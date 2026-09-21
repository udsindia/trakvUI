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
  getAptitudeTestOption,
  getEnglishTestOption,
} from "@/config/universities/requirementOptions";
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
  countryDisplayName,
  formatDuration,
  toAlpha2CountryCode,
  tuitionToLakhs,
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
  EligibilityStatus,} from "@/modules/universities/universities.types";
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
  intakeAvailableOnly?: boolean;
  courseLevels?: string[];
  disciplines?: string[];
  durationMonths?: number[];
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

  // The Course Duration dropdown had no options at all — it was on screen and could not
  // be opened to anything. These are the course lengths the tenant actually has, labelled
  // the way the cards label them, and each one filters to exactly that length.
  const duration = Array.from(new Set(response?.durationMonths ?? []))
    .filter((months) => typeof months === "number" && months > 0)
    .sort((left, right) => left - right)
    .map((months) => ({ label: formatDuration(months), value: String(months) }));

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
      case "number":
        return count + (typeof value === "string" && value.trim() !== "" ? 1 : 0);
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

// Exported for tests: this is the boundary where the screen's state becomes the
// request, and it is the only place a filter can be lost without anything erroring.
export function buildCourseSearchApiPayload(
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
    intakeAvailableOnly: false,
    intakeStatuses: [],
    courseLevels: [],
    disciplines: [],
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
    // Sent, so the server can work out whether this student actually qualifies. While
    // this was commented out the backend received no student, returned null eligibility,
    // and the mapping below invented "eligible, 100%" for every course on the page.
    studentId: studentId ?? undefined,
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

  if (asString(filterValues[filterKeys.delivery.key])) {
    payload.deliveryModes = [asString(filterValues[filterKeys.delivery.key])];
  }

  if (asString(filterValues[filterKeys.postStudyWorkPermit.key])) {
    payload.postStudyWorkPermit = asString(filterValues[filterKeys.postStudyWorkPermit.key]) === "yes";
  }

  // The option's value is a range in months, "13-18", with an empty upper end meaning no
  // limit. Parsed from the value, never the label: an older version stripped digits out of
  // the label and searched a window around them, which turned "1 year" into "between 1 and
  // 7 months".
  const durationRange = /^(\d+)-(\d*)$/.exec(asString(filterValues[filterKeys.duration.key]));
  if (durationRange) {
    const min = Number(durationRange[1]);
    if (min > 0) payload.minDurationMonths = min;
    if (durationRange[2]) payload.maxDurationMonths = Number(durationRange[2]);
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

  // English is asked from the student's side: the test they hold and their score, so the
  // server matches courses whose bar for that test they clear. MOI carries no score —
  // holding the letter is the requirement — so the score is left off deliberately rather
  // than defaulted to zero, which would read as a bar of zero.
  const englishTest = asString(filterValues[filterKeys.englishTest.key]);
  if (englishTest) {
    payload.englishTestType = englishTest;

    const score = Number(asString(filterValues[filterKeys.englishScore.key]));
    if (Number.isFinite(score) && score > 0) {
      payload.englishScore = score;
    }

    // Sent only when the counsellor opts into the strict reading. Left off, the server
    // keeps courses that record no language requirement — which is most of them, so the
    // default has to narrow the list rather than empty it.
    if (asStringArray(filterValues[filterKeys.englishUnstated.key]).includes("onlyStated")) {
      payload.includeUnstatedEnglish = false;
    }
  }

  // Aptitude, asked like English: the test sat and the score. "None" is a student who has
  // not sat one, so courses that require one are dropped. Nothing chosen filters nothing.
  const aptitudeTest = asString(filterValues[filterKeys.aptitudeTest.key]);
  if (aptitudeTest === "NONE") {
    payload.aptitudeTestRequired = false;
  } else if (aptitudeTest) {
    payload.aptitudeTestType = aptitudeTest;
    const aptitudeScore = Number(asString(filterValues[filterKeys.aptitudeScore.key]));
    if (Number.isFinite(aptitudeScore) && aptitudeScore > 0) {
      payload.aptitudeScore = aptitudeScore;
    }
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
    // The API returns countryCode; destination/country are older shapes that never arrive
    // from /courses/search. Reading only those left every card reading "Country".
    const country = typeof raw.destination === "string"
      ? raw.destination
      : typeof raw.country === "string"
        ? raw.country
        : typeof raw.countryCode === "string"
          ? countryDisplayName(raw.countryCode)
          : "—";
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
      // durationMonths / tuitionAmount + tuitionCurrency are what the API sends. The
      // placeholders below them used to win every time: every course showed "1 year", and
      // a £45,000 fee was printed as "₹45000.0L" because the raw amount went straight into
      // a formatter that appends lakhs. tuitionToLakhs converts first, with the same rate
      // table the university pages already use.
      duration: formatDuration(
        typeof raw.durationMonths === "number" ? raw.durationMonths : undefined,
      ),
      tuitionLakhs: Number(
        raw.tuitionLakhs ??
          tuitionToLakhs(
            typeof raw.tuitionAmount === "number" ? raw.tuitionAmount : Number(raw.tuitionAmount),
            typeof raw.tuitionCurrency === "string" ? raw.tuitionCurrency : undefined,
          ),
      ),
      // Carried through unconverted, because the card shows the fee in the currency the
      // university quotes it in. tuitionLakhs above stays for the budget slider and sort.
      tuitionAmount:
        typeof raw.tuitionAmount === "number" ? raw.tuitionAmount : Number(raw.tuitionAmount) || undefined,
      tuitionCurrency: typeof raw.tuitionCurrency === "string" ? raw.tuitionCurrency : undefined,
      // What the overall score does not cover: a course wanting 6.0 in every band still
      // turns away 6.5-overall-with-5.5-writing, and the filter cannot see that.
      ieltsPerBand:
        typeof raw.englishPerBandMin === "number"
          ? raw.englishPerBandMin
          : Number(raw.englishPerBandMin) || undefined,
      ieltsMin: Number(raw.ieltsMin ?? raw.ielts ?? 0),
      // Search returns no IELTS figure, and "IELTS 0" read as a real requirement of zero.
      // Empty, and the card drops the chip.
      ieltsLabel: typeof raw.ieltsLabel === "string" ? raw.ieltsLabel : "",
      applicationFee: String(raw.applicationFee ?? "₹0"),
      deadline: String(raw.deadline ?? "Rolling"),
      ...mapEligibility(raw.eligibility),
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
      alreadyShortlisted: raw.alreadyShortlisted === true,
      // Whether the university has ever recorded a backlog / education-gap limit. A course
      // with nothing on record still matches those filters, so the card has to be able to
      // say that it is an unknown rather than a confirmed fit.
      backlogsLimitStated: raw.backlogsLimitStated === true,
      educationGapLimitStated: raw.educationGapLimitStated === true,
      pendingApplications: 0,
    } as unknown as CourseSearchResult;
  });
}

/**
 * The server's eligibility verdict, or an honest absence of one.
 *
 * Every card used to claim "eligible, 100%" no matter the student or the course — a
 * green tick with nothing behind it, which is worse than no answer because a counsellor
 * acts on it. The server returns null when it has no student to judge against, and that
 * has to stay null here rather than being rounded up to a pass.
 */
/**
 * The server's eligibility verdict, in the card's terms.
 *
 * Exported for tests. This compared against "NOT_ELIGIBLE", which the server never sends —
 * its enum says INELIGIBLE — so a course a student could not get into fell through to
 * "partial" and the card read "Eligible with notes". Combined with a server check that
 * failed every student on every course listing an MOI letter, the finder showed a column of
 * reassuring badges over a verdict that was uniformly "no".
 *
 * UNKNOWN means nothing mandatory was stated, so nothing was checked. It keeps the neutral
 * styling but says so, instead of claiming an eligibility nobody assessed.
 */
export function mapEligibility(raw: unknown): {
  eligibilityStatus: EligibilityStatus;
  eligibilityLabel?: string;
  eligibilityPercent?: number;
  eligibilityHint?: string;
} {
  if (!raw || typeof raw !== "object") {
    // No student selected, or nothing on record. The card hides the badge entirely when
    // there is no student, so this only shows when we genuinely cannot say.
    return { eligibilityStatus: "partial", eligibilityLabel: "Not assessed" };
  }

  const value = raw as { status?: string; met?: string[]; gaps?: string[] };
  const met = value.met?.length ?? 0;
  const gaps = value.gaps?.length ?? 0;
  const total = met + gaps;

  const status: EligibilityStatus =
    value.status === "ELIGIBLE"
      ? "eligible"
      : value.status === "INELIGIBLE" || value.status === "NOT_ELIGIBLE"
        ? "not-eligible"
        : "partial";

  return {
    eligibilityStatus: status,
    eligibilityLabel: value.status === "UNKNOWN" ? "Not assessed" : undefined,
    // Out of the requirements actually recorded. A course with none on file reports no
    // percentage rather than a perfect score for having asked nothing.
    eligibilityPercent: total > 0 ? Math.round((met / total) * 100) : undefined,
    eligibilityHint: gaps > 0 ? (value.gaps ?? []).join("; ") : undefined,
  };
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
  // What the server matched, which is not what is on screen: the API returns one page of
  // 20. The counter used to read "20 courses found" whether there were 20 matches or 200.
  const [courseResultTotal, setCourseResultTotal] = useState(0);
  // Whether the last search asked about backlogs or education gap — the cards qualify a
  // match only when it was one of those the counsellor filtered on.
  const [academicFilterApplied, setAcademicFilterApplied] = useState(false);
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

  // The score box takes its range and step from the chosen test: IELTS runs to 9 in half
  // points, PTE to 90, Duolingo to 160, Class 12 English is a percentage. MOI has max 0 —
  // held or not held — so the box is disabled for it rather than inviting a number that
  // would mean nothing. The same goes for aptitude until a real test is picked.
  const scoreBoxes = useMemo(() => {
    const english = getEnglishTestOption(asString(filterValues[filterKeys.englishTest.key]) as never);
    const aptitudeValue = asString(filterValues[filterKeys.aptitudeTest.key]);
    const aptitude =
      aptitudeValue && aptitudeValue !== "NONE" ? getAptitudeTestOption(aptitudeValue as never) : undefined;

    return {
      [filterKeys.englishScore.key]: !english
        ? { disabled: true, helperText: "Choose a test first." }
        : english.max <= 0
          ? { disabled: true, helperText: "No score for this one — holding it is the requirement." }
          : { min: 0, max: english.max, step: english.step, helperText: `Out of ${english.max}.` },
      [filterKeys.aptitudeScore.key]: aptitude
        ? { min: 0, max: aptitude.max, step: aptitude.step, helperText: `Out of ${aptitude.max}.` }
        : { disabled: true, helperText: aptitudeValue === "NONE" ? "Not needed." : "Choose a test first." },
    } as Record<string, { disabled?: boolean; helperText?: string; min?: number; max?: number; step?: number }>;
  }, [filterValues]);

  const filterConfig = useMemo(() => {
    const config = buildCourseSearchFilterConfig({ dynamicOptions }).map((filter) =>
      filter.type === "number" && scoreBoxes[filter.key]
        ? { ...filter, ...scoreBoxes[filter.key] }
        : filter,
    );
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
  }, [countryFilterOptions, dynamicOptions, scoreBoxes]);

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

  /**
   * Clearing the filters shows every course, not an empty page.
   *
   * Nothing on this screen is required — the API applies a clause only for a filter that
   * was actually set — so "no filters" is a perfectly good search and should return the
   * whole catalogue. This used to drop back to the blank filter panel instead, which read
   * as though clearing the filters had also cleared the results.
   */
  const handleClearFilters = () => {
    setFilterValues(defaultFilterValues);
    setSort(defaultSearchSettings.sort);
    setSearchQuery("");
    setCourseSearchError(null);
    void runCourseSearch(defaultFilterValues, "", defaultSearchSettings.sort);
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
        setAcademicFilterApplied(Boolean(payload.backlogs) || Boolean(payload.educationGap));
        const response = await leadApi.searchCourses(payload);
        setCourseResults(normalizeCourseSearchApiResults(response));
        setCourseResultTotal(
          typeof response?.totalElements === "number"
            ? response.totalElements
            : normalizeCourseSearchApiResults(response).length,
        );
        setHasAppliedFilters(true);
        return true;
      } catch (error) {
        setCourseResults([]);
        setCourseResultTotal(0);
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
                      {courseResultTotal || filteredResults.length}
                    </Box>{" "}
                    {(courseResultTotal || filteredResults.length) === 1 ? "course" : "courses"} found
                    {courseResultTotal > filteredResults.length
                      ? ` · showing the first ${filteredResults.length}`
                      : ""}
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
                      academicFilterApplied={academicFilterApplied}
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
