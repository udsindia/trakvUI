import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TuneRounded,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  studentsApi,
  type StudentOption,
} from "@/modules/applications/studentsApi";
import {
  leadApi,
  type CourseSearchRequest,
  type CourseSearchResponse,
} from "@/modules/lead/leadApi";
import {
  shortlistApi,
} from "@/modules/universities/shortlistApi";
import {
  NAVBAR_HEIGHT,
} from "@/app/layout/Navbar";
import {
  courseSearchSettings,
} from "@/config/universities/courseSearchSettings";
import {
  PageHeader,
} from "@/modules/lead/components/PageHeader";
import {
  CourseSearchCard,
} from "@/modules/universities/components/CourseSearchCard";
import {
  ShortlistTray,
} from "@/modules/universities/components/ShortlistTray";
import {
  universitiesApi,
} from "@/modules/universities/universitiesApi";
import {
  // buildCourseSearchFilterSections,
  // temporarily unused: section titles disabled
  buildCourseSearchFilterConfig,
  getCourseSearchDefaultFilterValues,
  getCourseSearchSliderFallbacks,
} from "@/modules/universities/courseSearchFilterConfig";
import {
  universitiesCatalogQueryKey,
} from "@/modules/universities/universitiesCatalogService";
import {
  toAlpha2CountryCode,
} from "@/modules/universities/universitiesMappers";
import {
  useCountries,
} from "@/modules/universities/useUniversitiesCatalog";
import {
  courseDetailsPath,
  universityDetailsPath,
} from "@/modules/universities/universitiesRoutePaths";
import {
  universitiesContentSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import type {
  CourseLevel,
  CourseSearchResult,
  CourseSortOption,
} from "@/modules/universities/universities.types";
import {
  useAuth,
} from "@/app/auth/useAuth";
import {
  PERMISSIONS,
} from "@/config/permissions/permissions";
import {
  GlobalSearchBar,
} from "@/shared/components/GlobalSearchBar";
import type {
  FilterPanelValue,
  FilterPanelValues,
} from "@/shared/components/FilterPanel";
import {
  FilterPanel,
} from "@/shared/components/FilterPanel";

const { defaults: defaultSearchSettings, filters: filterKeys } = courseSearchSettings;
const sliderFallbacks = getCourseSearchSliderFallbacks();

type SearchFiltersApiInstitution = {
  key?: string;
  value?: string;
};

type SearchFiltersApiResponse = {
  destinations?: string[];
  institutions?: SearchFiltersApiInstitution[];
  nearestCity?: string[];
  intakeMonths?: string[];
  intakeYears?: number[];
  intakeAvailableOnly?: boolean;
  courseLevels?: string[];
  disciplines?: string[];
  postStudyWorkPermit?: boolean;
};

const normalizeSearchFilterText = (value: string | undefined) => (value ?? "").trim();

const normalizeCourseLevelValue = (value: string) => {
  const normalized = normalizeSearchFilterText(value).toUpperCase();

  switch (normalized) {
    case "UNDERGRADUATE":
      return "UNDERGRADUATE";
    case "POSTGRADUATE_TAUGHT":
      return "POSTGRADUATE_TAUGHT";
    case "POSTGRADUATE_RESEARCH":
      return "POSTGRADUATE_RESEARCH";
    case "PHD":
      return "PHD";
    case "DIPLOMA":
      return "DIPLOMA";
    case "FOUNDATION":
      return "FOUNDATION";
    default:
      return normalizeSearchFilterText(value);
  }
};

const normalizeCourseLevelLabel = (value: string) => {
  const normalized = normalizeCourseLevelValue(value).toUpperCase();

  switch (normalized) {
    case "UNDERGRADUATE":
      return "Undergraduate";
    case "POSTGRADUATE_TAUGHT":
      return "Masters (PG)";
    case "POSTGRADUATE_RESEARCH":
      return "PhD";
    case "PHD":
      return "PhD";
    case "DIPLOMA":
      return "Diploma / Foundation";
    case "FOUNDATION":
      return "Diploma / Foundation";
    default:
      return normalizeSearchFilterText(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
};

function mapSearchFiltersToDynamicOptions(response?: SearchFiltersApiResponse) {
  const country = Array.from(
    new Set((response?.destinations ?? []).map((value) => normalizeSearchFilterText(value)).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      label: value,
      value: toAlpha2CountryCode(value) || value,
    }));

  const level = Array.from(
    new Set((response?.courseLevels ?? []).map((value) => normalizeCourseLevelValue(value)).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      label: normalizeCourseLevelLabel(value),
      value,
    }));

  const intake = Array.from(
    new Set((response?.intakeMonths ?? []).map((value) => normalizeSearchFilterText(value)).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));

  const city = Array.from(
    new Set((response?.nearestCity ?? []).map((value) => normalizeSearchFilterText(value)).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));

  const institution = (response?.institutions ?? [])
    .map((item) => ({
      label: normalizeSearchFilterText(item?.value),
      value: normalizeSearchFilterText(item?.key) || normalizeSearchFilterText(item?.value),
    }))
    .filter((item) => item.label && item.value);

  const discipline = Array.from(
    new Set((response?.disciplines ?? []).map((value) => normalizeSearchFilterText(value)).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));

  return {
    country,
    level,
    intake,
    city,
    institution,
    discipline: discipline.length > 0 ? discipline : [
      { label: "Computer Science", value: "computer-science" },
      { label: "Data Science", value: "data-science" },
      { label: "Business", value: "business" },
      { label: "General", value: "general" },
    ],
  };
}

// TODO: section titles are temporarily disabled in the advance filter panel.
// const sectionTitleByKey = new Map(
//   buildCourseSearchFilterSections().flatMap((section) =>
//     section.filterKeys.map((key, index) => [key, index === 0 ? section.title : undefined] as const),
//   ),
// );

function countActiveFilters(
  values: FilterPanelValues,
  filterConfig: ReturnType<typeof buildCourseSearchFilterConfig>,
  defaults: FilterPanelValues,
): number {
  return filterConfig.reduce((count, filter) => {
    const value = values[filter.key];
    switch (filter.type) {
      case "checkbox-group":
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
      case "dropdown": {
        if (typeof value === "string") {
          const defaultValue = defaults[filter.key];
          return count + (value.length > 0 && value !== defaultValue ? 1 : 0);
        }
        return count;
      }
      case "slider": {
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value as [number, number];
          const defaultValue = defaults[filter.key] as [number, number] | undefined;
          if (defaultValue && (min !== defaultValue[0] || max !== defaultValue[1])) {
            return count + 1;
          }
        }
        return count;
      }
      default:
        return count;
    }
  }, 0);
}

function asStringArray(value: FilterPanelValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.every((entry) => typeof entry === "string") ? value : [];
}

function asNumberRange(
  value: FilterPanelValue | undefined,
  fallback: [number, number],
): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return fallback;
  }

  const [min, max] = value;
  if (typeof min !== "number" || typeof max !== "number") {
    return fallback;
  }

  return [min, max];
}

function asString(value: FilterPanelValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function buildCourseSearchApiPayload(
  filterValues: FilterPanelValues,
  query: string,
  sort: CourseSortOption,
  studentId: string | null,
): CourseSearchRequest {
  const payload: CourseSearchRequest = {
    destinations: [],
    institutions: [],
    nearestCity: null as any,
    intakeMonths: [],
    intakeYears: [],
    intakeAvailableOnly: false,
    intakeStatuses: [],
    courseLevels: [],
    disciplines: [],
    durations: [],
    deliveryModes: [],
    postStudyWorkPermit: null as any,
    nationality: null as any,
    regionState: null as any,
    isOnshore: false,
    highestEducationLevel: null as any,
    countryOfEducation: null as any,
    gradingSystem: null as any,
    backlogs: null as any,
    educationGap: null as any,
    // studentId: studentId ?? null,
    // Free text over course name + university name — this is what the header search box drives.
    query: query.trim() || undefined,
    sort: sort || null,
  };

  if (asString(filterValues[filterKeys.country.key])) {
    payload.destinations = [asString(filterValues[filterKeys.country.key])];
  }

  if (asString(filterValues[filterKeys.level.key])) {
    payload.courseLevels = [asString(filterValues[filterKeys.level.key])];
  }

  if (asString(filterValues[filterKeys.intake.key])) {
    payload.intakeMonths = [asString(filterValues[filterKeys.intake.key])];
  }

  if (asString(filterValues[filterKeys.intakeStatus.key])) {
    payload.intakeStatuses = [asString(filterValues[filterKeys.intakeStatus.key])];
  }

  if (asString(filterValues[filterKeys.nearestCity.key])) {
    payload.nearestCity = asString(filterValues[filterKeys.nearestCity.key]);
  }

  if (asString(filterValues[filterKeys.institution.key])) {
    payload.institutions = [{ name: asString(filterValues[filterKeys.institution.key]) }];
  }

  if (asString(filterValues[filterKeys.nationality.key])) {
    payload.nationality = asString(filterValues[filterKeys.nationality.key]);
  }

  if (asString(filterValues[filterKeys.regionState.key])) {
    payload.regionState = asString(filterValues[filterKeys.regionState.key]);
  }

  payload.isOnshore = asStringArray(filterValues[filterKeys.onshore.key]).includes("onshore");

  if (asString(filterValues[filterKeys.highestEducationLevel.key])) {
    payload.highestEducationLevel = asString(filterValues[filterKeys.highestEducationLevel.key]);
  }

  if (asString(filterValues[filterKeys.countryOfEducation.key])) {
    payload.countryOfEducation = asString(filterValues[filterKeys.countryOfEducation.key]);
  }

  if (asString(filterValues[filterKeys.gradingSystem.key])) {
    payload.gradingSystem = asString(filterValues[filterKeys.gradingSystem.key]);
  }

  if (asString(filterValues[filterKeys.backlogs.key])) {
    payload.backlogs = asString(filterValues[filterKeys.backlogs.key]);
  }

  if (asString(filterValues[filterKeys.educationGap.key])) {
    payload.educationGap = asString(filterValues[filterKeys.educationGap.key]);
  }

  if (asString(filterValues[filterKeys.discipline.key])) {
    payload.disciplines = [asString(filterValues[filterKeys.discipline.key])];
  }

  if (asString(filterValues[filterKeys.duration.key])) {
    payload.durations = [asString(filterValues[filterKeys.duration.key])];
  }

  if (asString(filterValues[filterKeys.delivery.key])) {
    payload.deliveryModes = [asString(filterValues[filterKeys.delivery.key])];
  }

  if (asString(filterValues[filterKeys.postStudyWorkPermit.key])) {
    payload.postStudyWorkPermit = asString(filterValues[filterKeys.postStudyWorkPermit.key]) === "yes";
  }

  const durationValue = asString(filterValues[filterKeys.duration.key]);
  if (durationValue) {
    const numeric = Number.parseInt(durationValue.replace(/[^0-9]/g, ""), 10);
    if (!Number.isNaN(numeric)) {
      payload.minDurationMonths = Math.max(1, numeric - 6);
      payload.maxDurationMonths = numeric + 6;
    }
  }

  const turnaroundRange = asNumberRange(
    filterValues[filterKeys.turnaround.key],
    sliderFallbacks.turnaround,
  );
  if (
    turnaroundRange[0] !== sliderFallbacks.turnaround[0] ||
    turnaroundRange[1] !== sliderFallbacks.turnaround[1]
  ) {
    payload.minTurnaroundDays = turnaroundRange[0];
    payload.maxTurnaroundDays = turnaroundRange[1];
  }

  const tuitionRange = asNumberRange(filterValues[filterKeys.tuition.key], sliderFallbacks.tuition);
  if (tuitionRange[0] !== sliderFallbacks.tuition[0] || tuitionRange[1] !== sliderFallbacks.tuition[1]) {
    payload.minTuitionLakhs = tuitionRange[0];
    payload.maxTuitionLakhs = tuitionRange[1];
  }

  const ieltsRange = asNumberRange(filterValues[filterKeys.ielts.key], sliderFallbacks.ielts);
  if (ieltsRange[0] !== sliderFallbacks.ielts[0] || ieltsRange[1] !== sliderFallbacks.ielts[1]) {
    payload.minIelts = ieltsRange[0];
    payload.maxIelts = ieltsRange[1];
  }

  return payload;
}

function normalizeCourseSearchApiResults(response: CourseSearchResponse | undefined): CourseSearchResult[] {
  const items = response?.content ?? response?.items ?? [];

  return items.map((item, index) => {
    const raw = item as Record<string, unknown>;
    const courseName = typeof raw.name === "string" ? raw.name : typeof raw.courseName === "string" ? raw.courseName : "Course";
    const universityName = typeof raw.universityName === "string"
      ? raw.universityName
      : typeof raw.institutionName === "string"
        ? raw.institutionName
        : "University";
    const city = typeof raw.nearestCity === "string"
      ? raw.nearestCity
      : typeof raw.city === "string"
        ? raw.city
        : "City";
    const country = typeof raw.destination === "string"
      ? raw.destination
      : typeof raw.country === "string"
        ? raw.country
        : "Country";
    const levelValue = String(raw.level ?? raw.studyLevel ?? "masters").toLowerCase();
    const normalizedLevel = ["undergraduate", "masters", "phd", "diploma"].includes(levelValue)
      ? (levelValue as CourseLevel)
      : "masters";

    return {
      id: String(raw.id ?? raw.courseId ?? `${index}`),
      universityId: String(raw.universityId ?? raw.universityId ?? `${index}`),
      name: String(courseName),
      level: normalizedLevel,
      levelLabel: String(raw.levelLabel ?? raw.studyLevelLabel ?? "Masters (PG)"),
      intakes: Array.isArray(raw.intakes)
        ? raw.intakes.filter((value): value is string => typeof value === "string")
        : [],
      duration: String(raw.duration ?? raw.durationLabel ?? "1 year"),
      tuitionLakhs: Number(raw.tuitionLakhs ?? raw.tuitionAmount ?? 0),
      ieltsMin: Number(raw.ieltsMin ?? raw.ielts ?? 0),
      ieltsLabel: String(raw.ieltsLabel ?? `IELTS ${raw.ielts ?? 0}`),
      applicationFee: String(raw.applicationFee ?? "₹0"),
      deadline: String(raw.deadline ?? "Rolling"),
      eligibilityStatus: "eligible",
      eligibilityPercent: 100,
      curriculum: { semester1: [], semester2: [] },
      requirements: [],
      keyDates: {
        applicationDeadline: String(raw.applicationDeadline ?? "Rolling"),
        rollingAdmissions: true,
        courseStart: String(raw.courseStart ?? "-"),
        courseEnd: String(raw.courseEnd ?? "-"),
        pgwpEligible: String(raw.pgwpEligible ?? "No"),
      },
      fees: {
        tuitionPerYear: String(raw.tuitionPerYear ?? "₹0"),
        applicationFee: String(raw.applicationFee ?? "₹0"),
        livingCosts: String(raw.livingCosts ?? "₹0"),
        scholarshipNote: String(raw.scholarshipNote ?? ""),
      },
      ourData: {
        studentsSent: Number(raw.studentsSent ?? 0),
        accepted: Number(raw.accepted ?? 0),
        visaApproved: Number(raw.visaApproved ?? 0),
        avgCommission: String(raw.avgCommission ?? "-"),
      },
      university: {
        id: String(raw.universityId ?? `${index}`),
        name: universityName,
        shortName: universityName,
        country,
        countryCode: toAlpha2CountryCode(country) || "IN",
        city,
        flag: "🏛️",
        founded: 2000,
        website: "",
        about: "",
        trackRecord: {
          studentsEnrolled: 0,
          visasApproved: 0,
          visaSuccessRate: 0,
          avgApplicationDays: 0,
          avgCommission: "-",
        },
        links: [],
        internalNotes: "",
        generalRequirements: [],
      },
      alreadyShortlisted: false,
      pendingApplications: 0,
    } as unknown as CourseSearchResult;
  });
}

export function CourseSearchPage() {
  const navigate = useNavigate();
  const { data: countries = [] } = useCountries();

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getCourseSearchDefaultFilterValues(buildCourseSearchFilterConfig({})),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<CourseSortOption>(defaultSearchSettings.sort);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [courseResults, setCourseResults] = useState<CourseSearchResult[]>([]);
  const [courseSearchError, setCourseSearchError] = useState<string | null>(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // ── Student context for shortlisting (a shortlist belongs to a student) ──────
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students", "options"],
    queryFn: studentsApi.getStudents,
  });

  const preselectId = searchParams.get("studentId");
  useEffect(() => {
    if (preselectId && !selectedStudent) {
      const match = students.find((s) => s.id === preselectId);
      if (match) setSelectedStudent(match);
    }
  }, [preselectId, students, selectedStudent]);

  const studentId = selectedStudent?.id ?? null;

  const { data: shortlistIds = [] } = useQuery({
    queryKey: ["shortlist", studentId],
    queryFn: () => shortlistApi.getShortlistedCourseIds(studentId as string),
    enabled: !!studentId,
  });

  const shortlistMutation = useMutation({
    mutationFn: ({ courseId, add }: { courseId: string; add: boolean }) =>
      add
        ? shortlistApi.addToShortlist(studentId as string, courseId)
        : shortlistApi.removeFromShortlist(studentId as string, courseId),
    onSettled: () => {
      if (studentId) queryClient.invalidateQueries({ queryKey: ["shortlist", studentId] });
    },
  });

  // ── Advanced filter option metadata, sourced from the course search API so the
  // dropdowns (destination, level, intake, city, institution, discipline, duration)
  // reflect real data. This is metadata only — it does not render any course results.
  const { data: filterOptionsResponse, isLoading: isLoadingFilterOptions } = useQuery({
    queryKey: ["courses", "search", "filter-options"],
    queryFn: () =>
      leadApi.courseFilters(),
  });

  const countryFilterOptions = useMemo(() => {
    const apiOptions = countries
      .map((country) => ({
        label: country.name,
        value: toAlpha2CountryCode(country.code),
      }))
      .filter((option) => option.label && option.value);

    if (apiOptions.length > 0) {
      return apiOptions;
    }

    return courseSearchSettings.filters.country.options.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  }, [countries]);

  const dynamicOptions = useMemo(() => {
    const response = filterOptionsResponse as SearchFiltersApiResponse | undefined;

    const legacyResults =
      filterOptionsResponse && typeof filterOptionsResponse === "object" && !Array.isArray(filterOptionsResponse)
        ? ("content" in filterOptionsResponse || "items" in filterOptionsResponse
          ? (filterOptionsResponse.content ?? filterOptionsResponse.items ?? [])
          : [])
        : [];

    if (response && ("destinations" in response || "institutions" in response || "nearestCity" in response || "courseLevels" in response || "disciplines" in response)) {
      return mapSearchFiltersToDynamicOptions(response);
    }

    const collect = (extract: (item: (typeof legacyResults)[number]) => string | undefined) =>
      Array.from(
        new Set(
          legacyResults
            .map(extract)
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      )
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ label: value, value }));

    const country = collect((item) =>
      typeof item.destination === "string"
        ? item.destination
        : typeof item.country === "string"
          ? item.country
          : undefined,
    ).map((option) => ({
      label: option.label,
      value: toAlpha2CountryCode(option.value) || option.value,
    }));

    const level = collect((item) =>
      typeof item.level === "string"
        ? item.level
        : typeof item.studyLevel === "string"
          ? item.studyLevel
          : undefined,
    );

    const intake = collect((item) => {
      if (Array.isArray(item.intakes)) {
        return item.intakes.find((value): value is string => typeof value === "string");
      }
      return typeof item.intakeMonth === "string" ? item.intakeMonth : undefined;
    });

    const city = collect((item) =>
      typeof item.nearestCity === "string"
        ? item.nearestCity
        : typeof item.city === "string"
          ? item.city
          : undefined,
    );

    const institution = collect((item) =>
      typeof item.institutionName === "string"
        ? item.institutionName
        : typeof item.universityName === "string"
          ? item.universityName
          : undefined,
    );

    const duration = collect((item) =>
      typeof item.duration === "string"
        ? item.duration
        : typeof item.durationLabel === "string"
          ? item.durationLabel
          : typeof item.durationMonths === "number"
            ? `${item.durationMonths} months`
            : undefined,
    );

    const discipline = Array.from(
      new Set(
        legacyResults.flatMap((item) => {
          const list: string[] = [];
          if (Array.isArray(item.disciplines)) {
            list.push(
              ...item.disciplines.filter(
                (value): value is string => typeof value === "string" && Boolean(value.trim()),
              ),
            );
          }
          if (typeof item.discipline === "string" && item.discipline.trim()) {
            list.push(item.discipline.trim());
          }
          return list;
        }),
      ),
    )
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ label: value, value }));

    return {
      country,
      level,
      intake,
      city,
      institution,
      duration,
      discipline: discipline.length > 0 ? discipline : [
        { label: "Computer Science", value: "computer-science" },
        { label: "Data Science", value: "data-science" },
        { label: "Business", value: "business" },
        { label: "General", value: "general" },
      ],
    };
  }, [filterOptionsResponse]);

  const filterConfig = useMemo(() => {
    const config = buildCourseSearchFilterConfig({ dynamicOptions });
    return config.map((filter) => {
      if (filter.type !== "dropdown" || filter.key !== filterKeys.country.key) {
        return {
          ...filter,
          helperText: filter.helperText,
          // sectionTitle: sectionTitleByKey.get(filter.key), // temporarily disabled
        };
      }

      return {
        ...filter,
        // sectionTitle: sectionTitleByKey.get(filter.key), // temporarily disabled
        options: dynamicOptions.country.length > 0 ? dynamicOptions.country : countryFilterOptions,
      };
    });
  }, [countryFilterOptions, dynamicOptions]);

  const defaultFilterValues = useMemo(
    () => getCourseSearchDefaultFilterValues(filterConfig),
    [filterConfig],
  );
  const activeFilterCount = countActiveFilters(filterValues, filterConfig, defaultFilterValues);

  const filteredResults = useMemo(() => courseResults, [courseResults]);

  const shortlistItems = useMemo(
    () => courseResults.filter((result) => shortlistIds.includes(result.id)),
    [courseResults, shortlistIds],
  );

  const handleToggleShortlist = (courseId: string) => {
    if (!studentId) return;
    const add = !shortlistIds.includes(courseId);
    // Optimistic cache update so the button flips instantly; onSettled resyncs.
    queryClient.setQueryData<string[]>(["shortlist", studentId], (prev = []) =>
      add ? [...prev, courseId] : prev.filter((id) => id !== courseId),
    );
    shortlistMutation.mutate({ courseId, add });
  };

  const handleClearFilters = () => {
    setFilterValues(defaultFilterValues);
    setSort(defaultSearchSettings.sort);
    setSearchQuery("");
    setCourseResults([]);
    setCourseSearchError(null);
    setHasAppliedFilters(false);
  };

  /**
   * Every course lookup goes through here — the filter drawer, the header search box and
   * the sort dropdown all re-query the API, since results are server-side only (there is
   * no client-side filtering to fall back on).
   */
  const runCourseSearch = useCallback(
    async (values: FilterPanelValues, query: string, sortValue: CourseSortOption) => {
      setCourseSearchError(null);
      setIsApplyingFilters(true);

      try {
        const payload = buildCourseSearchApiPayload(values, query, sortValue, studentId);
        const response = await leadApi.searchCourses(payload);
        setCourseResults(normalizeCourseSearchApiResults(response));
        setHasAppliedFilters(true);
        return true;
      } catch (error) {
        setCourseResults([]);
        setHasAppliedFilters(false);
        setCourseSearchError(
          error instanceof Error ? error.message : "Unable to load courses. Please try again.",
        );
        return false;
      } finally {
        setIsApplyingFilters(false);
      }
    },
    [studentId],
  );

  const handleApplyFilters = async (values: FilterPanelValues) => {
    setFilterValues(values);
    const ok = await runCourseSearch(values, searchQuery, sort);
    if (ok) {
      setDrawerOpen(false);
    }
  };

  // Re-query when the search text or sort changes, but only once a first search has run —
  // before that the page is still on its landing state and there is nothing to refine.
  const hasSearchedRef = useRef(false);
  useEffect(() => {
    if (!hasAppliedFilters) {
      hasSearchedRef.current = false;
      return;
    }
    if (!hasSearchedRef.current) {
      hasSearchedRef.current = true;
      return;
    }
    void runCourseSearch(filterValues, searchQuery, sort);
    // filterValues is intentionally omitted: applying filters already runs its own search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sort, hasAppliedFilters]);

  if (!hasAppliedFilters) {
    return (
      <Box
        sx={{
          alignItems: "stretch",
          bgcolor: "#f3f7fb",
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 80px)",
          p: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            minHeight: 0,
            width: "100%",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "#e9eff5",
              borderRadius: "20px",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
              display: "flex",
              flex: 1,
              minHeight: 0,
              maxWidth: 1500,
              overflow: "hidden",
              width: "100%",
            }}
          >
            {isLoadingFilterOptions ? (
              <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
                <Typography color="text.secondary">Loading filters...</Typography>
              </Box>
            ) : (
              <FilterPanel
                applyButtonLabel={
                  isApplyingFilters ? "Applying..." : courseSearchSettings.filterPanel.applyButtonLabel
                }
                contentColumns={2}
                filtersConfig={filterConfig}
                sx={{
                  height: "100%",
                  width: "100%",
                  "& .MuiPaper-root": { boxShadow: "none" },
                }}
                title="Advance Filters"
                values={filterValues}
                width="100%"
                onApplyFilters={handleApplyFilters}
                onFiltersChange={setFilterValues}
              />
            )}
          </Paper>
        </Box>
        {courseSearchError ? (
          <Alert severity="error" sx={{ maxWidth: 1500, mt: 2, mx: "auto", width: "100%" }}>
            {courseSearchError}
          </Alert>
        ) : null}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={[
        universitiesPagePaperSx,
        { height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` } },
      ]}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={0.5}
              sx={{ alignItems: "center" }}
            >
              <Autocomplete
                getOptionLabel={(option) => option.name || option.email || option.id}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                options={students}
                size="small"
                sx={{ width: { xs: "100%", md: 230 } }}
                value={selectedStudent}
                onChange={(_, value) => setSelectedStudent(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Shortlist for"
                    placeholder="Select student"
                  />
                )}
              />
              <GlobalSearchBar
                placeholder={courseSearchSettings.search.placeholder}
                sx={{ width: { xs: "100%", md: 300 } }}
                value={searchQuery}
                onSearch={setSearchQuery}
              />
              <Badge
                badgeContent={activeFilterCount}
                color="primary"
                overlap="rectangular"
                sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontWeight: 700 } }}
              >
                <Button
                  startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
                  variant="outlined"
                  sx={{
                    borderRadius: "9px",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setDrawerOpen(true)}
                  size="small"
                >
                  Filters
                </Button>
              </Badge>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  sx={{ fontSize: 13 }}
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CourseSortOption)}
                >
                  {courseSearchSettings.sort.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          }
          subtitle=""
          title=""
        />
      </Box>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <Box sx={[universitiesContentSx, { display: "flex", flexDirection: "column" }]}>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2.75 }}>
            {isApplyingFilters ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Loading courses...
              </Typography>
            ) : courseSearchError ? (
              <Typography color="error" sx={{ py: 4, textAlign: "center" }}>
                {courseSearchError}
              </Typography>
            ) : (
              <>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "space-between",
                    mb: 1.75,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                      {filteredResults.length}
                    </Box>{" "}
                    courses found
                  </Typography>
                  <Chip
                    clickable
                    label="Reset filters"
                    size="small"
                    sx={{
                      borderColor: "divider",
                      borderRadius: "8px",
                      color: "text.secondary",
                      display: { xs: "none", lg: "inline-flex" },
                      fontWeight: 600,
                    }}
                    variant="outlined"
                    onClick={handleClearFilters}
                  />
                </Stack>

                <Stack spacing={1.25}>
                  {filteredResults.map((result) => (
                    <CourseSearchCard
                      key={result.id}
                      isShortlisted={shortlistIds.includes(result.id)}
                      result={result}
                      shortlistDisabled={!studentId}
                      shortlistDisabledReason="Select a student to shortlist for"
                      studentName={selectedStudent?.name}
                      onAddToShortlist={() => handleToggleShortlist(result.id)}
                      onViewCourse={() =>
                        navigate(courseDetailsPath(result.universityId, result.id))
                      }
                      onViewUniversity={() =>
                        navigate(universityDetailsPath(result.universityId))
                      }
                    />
                  ))}

                  {filteredResults.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No courses match your search.
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        Try clearing filters or searching by course, university, or city.
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </>
            )}
          </Box>

          <ShortlistTray
            items={shortlistItems}
            onRemove={(courseId) => handleToggleShortlist(courseId)}
            onSend={() => undefined}
          />
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        slotProps={{ paper: { sx: { display: "flex", flexDirection: "column", width: { xs: "100%", sm: 360 } } } }}
        onClose={() => setDrawerOpen(false)}
      >
        <FilterPanel
          applyButtonLabel={courseSearchSettings.filterPanel.applyButtonLabel}
          filtersConfig={filterConfig}
          sx={{ height: "100%" }}
          title={courseSearchSettings.filterPanel.title}
          values={filterValues}
          width="100%"
          onApplyFilters={handleApplyFilters}
          onFiltersChange={setFilterValues}
        />
      </Drawer>

    </Paper>
  );
}
