import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TuneRounded, UploadRounded } from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import type { CourseSearchOptionSetting } from "@/config/universities/courseSearchSettings";
import {
  buildCourseSearchFilterConfig,
  getCourseSearchDefaultFilterValues,
} from "@/modules/universities/courseSearchFilterConfig";
import {
  LeadQuickFilters,
  type LeadQuickFilterTab,
} from "@/modules/lead/components/LeadQuickFilters";
import {
  LeadTableContainer,
  type LeadRow,
} from "@/modules/lead/components/LeadTableContainer";
import { ImportLeadsDialog } from "@/modules/lead/components/ImportLeadsDialog";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import {
  leadApi,
  type BackendLead,
  type CourseSearchRequest,
  type CourseSearchResponse,
  type CourseSearchResultItem,
} from "@/modules/lead/leadApi";
import { fromBackendLeadStage, toBackendLeadStage } from "@/modules/lead/leadStageMappers";
import { usersService } from "@/modules/settings/usersService";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import {
  FilterPanel,
  getDefaultFilterPanelValues,
  type DateRangeFilterValue,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";

/** Team list, lead sources, countries and course filter options: slow-moving
 *  reference data, cached well past the 60s global default. */
const REFERENCE_DATA_STALE_MS = 30 * 60_000;

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const quickFilterDefinitions: Omit<LeadQuickFilterTab, "count">[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "prospective", label: "Prospective" },
  { key: "enrolled", label: "Enrolled" },
];

const courseSearchAdvanceFilterConfig = buildCourseSearchFilterConfig({ countryCounts: {} });
const courseSearchDefaultValues = getCourseSearchDefaultFilterValues(courseSearchAdvanceFilterConfig);

type CourseSearchDynamicOptionKey = "city" | "institution" | "discipline" | "duration";

type CourseSearchFilterMetadata = {
  countryCounts: Record<string, number>;
  dynamicOptions: Partial<Record<CourseSearchDynamicOptionKey, CourseSearchOptionSetting[]>>;
};

const filterConfig: FilterConfig[] = [
  {
    // Options are injected at runtime from the real counsellor list
    // (see dynamicFilterConfig); this entry only defines the control.
    type: "dropdown",
    label: "Agent",
    key: "agent",
    placeholder: "All Agents",
    options: [],
  },
  {
    type: "dropdown",
    label: "Country",
    key: "country",
    placeholder: "All Countries",
    options: ["Canada", "Australia", "United Kingdom", "Germany"],
  },
  {
    type: "slider",
    label: "Lead Score",
    key: "score",
    min: 0,
    max: 100,
  },
  {
    type: "checkbox-group",
    label: "Source",
    key: "source",
    options: ["Website", "Social Media", "Referral", "Email Campaign"],
  },
  {
    type: "date-range",
    label: "Created Date",
    key: "dateRange",
  },
];

/** Counts how many filter groups are set away from their default — drives the
 *  badge on the Filters button so folded filters aren't out of sight, out of mind. */
function countActiveFilters(values: FilterPanelValues, config: FilterConfig[]): number {
  return config.reduce((count, fc) => {
    const value = values[fc.key];
    switch (fc.type) {
      case "dropdown":
        return count + (typeof value === "string" && value ? 1 : 0);
      case "slider": {
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value as [number, number];
          if (min !== fc.min || max !== fc.max) return count + 1;
        }
        return count;
      }
      case "checkbox-group":
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
      case "date-range": {
        const range = value as DateRangeFilterValue | undefined;
        return count + (range && (range.startDate || range.endDate) ? 1 : 0);
      }
      default:
        return count;
    }
  }, 0);
}

function formatLastActivity(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapBackendLeadToRow(lead: BackendLead): LeadRow {
  return {
    id: lead.id,
    name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    stage: fromBackendLeadStage(lead.leadStage),
    agent: lead.assignedToName ?? "—",
    source: lead.sourceName ?? "—",
    score: lead.score ?? 0,
    lastActivity: formatLastActivity(lead.lastActivityAt),
    nextAction: "",
    country: lead.destinationCountries?.[0] ?? "",
    createdAt: lead.createdAt ?? "",
  };
}

function getStageKey(stage: string) {
  return stage.toLowerCase().replace(/\s+/g, "-");
}

function mapCourseSearchResponseToLeadRows(response: CourseSearchResponse | undefined): LeadRow[] {
  const results = response?.content ?? response?.items ?? [];

  return results.map((item, index) => ({
    id: item.id ?? item.courseId ?? `course-search-${index}`,
    name: item.name ?? item.courseName ?? item.title ?? item.universityName ?? "Course match",
    email: item.studentEmail ?? item.email ?? "",
    phone: item.studentPhone ?? item.phone ?? "",
    stage: "New",
    agent: "—",
    source: "Course Search",
    score: typeof item.score === "number" ? item.score : 0,
    lastActivity: item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) : "—",
    nextAction: "",
    country: item.destination ?? item.country ?? item.nearestCity ?? item.city ?? "",
    createdAt: item.createdAt ?? new Date().toISOString(),
  }));
}

function getCourseLevelValue(value: string): string | undefined {
  const normalized = value.toLowerCase();

  const mapping: Record<string, string> = {
    undergraduate: "UNDERGRADUATE",
    masters: "POSTGRADUATE_TAUGHT",
    phd: "PHD",
    diploma: "DIPLOMA",
  };

  return mapping[normalized];
}

function parseDurationValue(value: string): { min: number; max: number } | null {
  const match = /^(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:months?|month)$/i.exec(value.trim());
  if (!match) return null;

  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : first;
  return { min: Math.min(first, second), max: Math.max(first, second) };
}

function asStringArrayValue(value: unknown): string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : [];
}

function normalizeOptionValues(values: Array<string | null | undefined>): CourseSearchOptionSetting[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
}

function readStringValue(item: CourseSearchResultItem, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = item[key as keyof CourseSearchResultItem];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readStringArrayValue(item: CourseSearchResultItem, keys: string[]): string[] {
  for (const key of keys) {
    const value = item[key as keyof CourseSearchResultItem];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim());
    }
  }

  return [];
}

function buildCourseSearchFilterMetadata(response?: CourseSearchResponse): CourseSearchFilterMetadata {
  const results = response?.content ?? response?.items ?? [];
  const countryCounts: Record<string, number> = {};
  const cityValues: string[] = [];
  const institutionValues: string[] = [];
  const disciplineValues: string[] = [];
  const durationValues: string[] = [];

  for (const item of results) {
    const country = readStringValue(item, ["destination", "country", "countryCode"]);
    if (country) {
      countryCounts[country] = (countryCounts[country] ?? 0) + 1;
    }

    const city = readStringValue(item, ["nearestCity", "city"]);
    if (city) {
      cityValues.push(city);
    }

    const institution = readStringValue(item, ["institutionName", "universityName"]);
    if (institution) {
      institutionValues.push(institution);
    }

    const disciplines = readStringArrayValue(item, ["disciplines"]);
    if (disciplines.length > 0) {
      disciplineValues.push(...disciplines);
    }

    const discipline = readStringValue(item, ["discipline", "fieldOfStudy"]);
    if (discipline) {
      disciplineValues.push(discipline);
    }

    const duration = readStringValue(item, ["duration", "durationLabel"]);
    if (duration) {
      durationValues.push(duration);
      continue;
    }

    const durationMonths = item["durationMonths" as keyof CourseSearchResultItem];
    if (typeof durationMonths === "number" && Number.isFinite(durationMonths)) {
      durationValues.push(`${durationMonths} months`);
    }
  }

  return {
    countryCounts,
    dynamicOptions: {
      city: normalizeOptionValues(cityValues),
      institution: normalizeOptionValues(institutionValues),
      discipline: normalizeOptionValues(disciplineValues),
      duration: normalizeOptionValues(durationValues),
    },
  };
}

function applySearchFilter(rows: LeadRow[], query: string): LeadRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.includes(q) ||
      row.agent.toLowerCase().includes(q) ||
      row.stage.toLowerCase().includes(q),
  );
}

function applyPanelFilters(rows: LeadRow[], values: FilterPanelValues): LeadRow[] {
  return rows.filter((row) => {
    const agentFilter = values.agent as string | undefined;
    if (agentFilter && row.agent !== agentFilter) return false;

    const countryFilter = values.country as string | undefined;
    if (countryFilter && row.country !== countryFilter) return false;

    const scoreFilter = values.score as [number, number] | undefined;
    if (Array.isArray(scoreFilter)) {
      const [min, max] = scoreFilter;
      if (row.score < min || row.score > max) return false;
    }

    const sourceFilter = values.source as string[] | undefined;
    if (Array.isArray(sourceFilter) && sourceFilter.length > 0) {
      if (!sourceFilter.includes(row.source)) return false;
    }

    const dateFilter = values.dateRange as DateRangeFilterValue | undefined;
    if (dateFilter?.startDate || dateFilter?.endDate) {
      const created = row.createdAt ? new Date(row.createdAt).getTime() : NaN;
      if (!Number.isNaN(created)) {
        // Parse both bounds as local day-edges. Guarding on NaN keeps a bad
        // value from silently disabling that bound (the old end-date bug).
        const startTs = dateFilter.startDate
          ? new Date(`${dateFilter.startDate}T00:00:00`).getTime()
          : NaN;
        const endTs = dateFilter.endDate
          ? new Date(`${dateFilter.endDate}T23:59:59.999`).getTime()
          : NaN;
        if (!Number.isNaN(startTs) && created < startTs) return false;
        if (!Number.isNaN(endTs) && created > endTs) return false;
      }
    }

    return true;
  });
}

export function LeadDashboardPage() {
  const { hasPermissions, tenant } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantId = tenant?.tenantId ?? "";
  const selectedStudentId = new URLSearchParams(location.search).get("studentId") ?? undefined;
  const courseSearchState = (location.state as {
    courseSearchResponse?: CourseSearchResponse;
    courseSearchPayload?: CourseSearchRequest;
  } | null) ?? null;
  const hasCourseSearchResults = Boolean(courseSearchState?.courseSearchResponse);

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [advancedFilterValues, setAdvancedFilterValues] = useState<FilterPanelValues>(() =>
    courseSearchDefaultValues,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [snack, setSnack] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);

  const canCreateLeads = hasPermissions([PERMISSIONS.LEAD_CREATE]);
  const canAssignLeads = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);
  const activeFilterCount = countActiveFilters(filterValues, filterConfig);

  // Backend paginates one page at a time; local filters/search are then applied
  // within the current page's payload only.
  const {
    data: leadsPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leads", "paginated", page, pageSize, "createdAt", "DESC"],
    queryFn: () =>
      leadApi.getLeadsPaginated({
        page: page - 1,
        size: pageSize,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    placeholderData: (previousData) => previousData,
    enabled: !hasCourseSearchResults,
  });
  // Logs how long the Leads page took to load its data, once per mount.
  const pageLoadStartRef = useRef(performance.now());
  const pageLoadLoggedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !pageLoadLoggedRef.current) {
      pageLoadLoggedRef.current = true;
      console.log(`[PageLoad] Leads loaded in ${(performance.now() - pageLoadStartRef.current).toFixed(0)}ms`);
    }
  }, [isLoading]);
  const backendLeads: BackendLead[] = leadsPage?.content ?? [];
  // Real counsellors added via User Management feed the Agent filter, so it
  // stays in sync with who actually exists in the tenant.
  // Reference data below changes rarely, but every refetch pays a full round trip
  // plus the per-request auth chain. A long staleTime keeps repeat visits to this
  // page down to the leads query alone.
  const usersQuery = useQuery({
    enabled: Boolean(tenantId) && canAssignLeads,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
    staleTime: REFERENCE_DATA_STALE_MS,
  });

  // Distinct Source and Country values come from the backend so the drawer's
  // options reflect the tenant's actual leads instead of a hardcoded list.
  const sourcesQuery = useQuery({
    queryKey: ["leads", "sources"],
    queryFn: leadApi.getSources,
    staleTime: REFERENCE_DATA_STALE_MS,
  });
  const countriesQuery = useQuery({
    queryKey: ["leads", "countries"],
    queryFn: leadApi.getCountries,
    staleTime: REFERENCE_DATA_STALE_MS,
  });

  const courseSearchOptionsQuery = useQuery({
    // Only feeds the advance-filter drawer (courseSearchFilterConfig), so it stays
    // off the initial render path — it pulls 200 courses purely to build options.
    enabled: !hasCourseSearchResults && drawerOpen,
    staleTime: REFERENCE_DATA_STALE_MS,
    queryKey: ["courses", "search", "filter-options", selectedStudentId ?? "all"],
    queryFn: () =>
      leadApi.searchCourses({
        page: 0,
        size: 200,
        ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
      }),
  });

  const courseSearchFilterMetadata = useMemo(
    () => buildCourseSearchFilterMetadata(courseSearchOptionsQuery.data),
    [courseSearchOptionsQuery.data],
  );

  const courseSearchFilterConfig = useMemo<FilterConfig[]>(
    () =>
      buildCourseSearchFilterConfig({
        countryCounts: courseSearchFilterMetadata.countryCounts,
        dynamicOptions: courseSearchFilterMetadata.dynamicOptions,
      }),
    [courseSearchFilterMetadata],
  );

  const dynamicFilterConfig = useMemo<FilterConfig[]>(() => {
    // The filter matches leads by agent *name*, so collapse duplicate names to a
    // single option — otherwise React sees repeated keys and the repeats are
    // indistinguishable anyway.
    const counsellorNames = Array.from(
      new Set(
        (usersQuery.data ?? [])
          .filter((user) => user.active)
          .map((user) => user.name)
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
    // Backend-provided distinct values; fall back to the static defaults until
    // the queries resolve (or if they return nothing) so the control never empties.
    const sourceOptions = sourcesQuery.data?.length ? sourcesQuery.data : undefined;
    const countryOptions = countriesQuery.data?.length ? countriesQuery.data : undefined;
    return filterConfig
      // Roles that can't assign leads (e.g. counsellors) can't read the team
      // list, so drop the Agent filter for them entirely.
      .filter((config) => config.key !== "agent" || canAssignLeads)
      .map((config) => {
        if (config.key === "agent") return { ...config, options: counsellorNames };
        if (config.key === "source" && sourceOptions) return { ...config, options: sourceOptions };
        if (config.key === "country" && countryOptions) return { ...config, options: countryOptions };
        return config;
      });
  }, [usersQuery.data, sourcesQuery.data, countriesQuery.data, canAssignLeads]);

  const leadRows: LeadRow[] = useMemo(() => {
    if (hasCourseSearchResults) {
      return mapCourseSearchResponseToLeadRows(courseSearchState?.courseSearchResponse);
    }

    return backendLeads.map(mapBackendLeadToRow);
  }, [backendLeads, courseSearchState, hasCourseSearchResults]);

  const quickFilterTabs: LeadQuickFilterTab[] = useMemo(
    () =>
      quickFilterDefinitions.map((tab) => ({
        ...tab,
        count:
          tab.key === "all"
            ? leadRows.length
            : leadRows.filter((lead) => getStageKey(lead.stage) === tab.key).length,
      })),
    [leadRows],
  );

  const fullyFilteredRows = useMemo(() => {
    let rows = applyPanelFilters(leadRows, filterValues);
    rows = applySearchFilter(rows, leadSearchQuery);
    if (activeQuickFilter !== "all") {
      rows = rows.filter((lead) => getStageKey(lead.stage) === activeQuickFilter);
    }
    return rows;
  }, [leadRows, filterValues, leadSearchQuery, activeQuickFilter]);

  const totalVisible = fullyFilteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalVisible / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = fullyFilteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const pageStart = totalVisible === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = totalVisible === 0 ? 0 : Math.min(clampedPage * pageSize, totalVisible);
  const paginationLabel =
    totalVisible === 0
      ? "Showing 0 of 0 leads"
      : `Showing ${pageStart}–${pageEnd} of ${totalVisible} leads`;

  const handlePageChange = useCallback((nextPage: number) => {
    const normalizedPage = Math.max(1, Math.min(nextPage, pageCount));
    setPage((currentPage) => (currentPage === normalizedPage ? currentPage : normalizedPage));
  }, [pageCount]);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    if (nextPageSize === pageSize) return;
    setPageSize(nextPageSize);
    setPage(1);
  }, [pageSize]);

  const handleFilterChange = useCallback((values: FilterPanelValues) => {
    setFilterValues((currentValues) => {
      if (JSON.stringify(currentValues) === JSON.stringify(values)) {
        return currentValues;
      }
      setPage(1);
      return values;
    });
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setLeadSearchQuery((currentQuery) => {
      if (currentQuery === query) return currentQuery;
      setPage(1);
      return query;
    });
  }, []);

  const handleQuickFilterChange = useCallback((key: string) => {
    setActiveQuickFilter((currentKey) => {
      if (currentKey === key) return currentKey;
      setPage(1);
      return key;
    });
  }, []);

  const handleDeleteLead = async (id: string) => {
    try {
      await leadApi.deleteLead(id);
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      setSnack("Lead deleted");
    } catch {
      setSnack("Failed to delete lead");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => leadApi.deleteLead(id)));
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      setSnack(`${ids.length} lead(s) deleted`);
    } catch {
      setSnack("Failed to delete some leads");
    }
  };

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      await leadApi.updateLead(id, {
        leadStage: toBackendLeadStage(stage),
      });
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      setSnack(`Stage updated to ${stage}`);
    } catch {
      setSnack("Failed to update stage");
    }
  };

  const handleAdvancedSearchSubmit = useCallback(async (values: FilterPanelValues) => {
    setIsSubmittingSearch(true);

    try {
      const destinations = asStringArrayValue(values.country);
      const institutionValue = typeof values.institution === "string" ? values.institution : "";
      const cityValue = typeof values.nearestCity === "string" ? values.nearestCity : "";
      const intakeValues = asStringArrayValue(values.intake);
      const courseLevelValues = asStringArrayValue(values.level);
      const disciplineValue = typeof values.discipline === "string" ? values.discipline : "";
      const durationValue = typeof values.duration === "string" ? values.duration : "";
      const postStudyWorkPermitValue =
        typeof values.postStudyWorkPermit === "string" ? values.postStudyWorkPermit : "";

      const payload: CourseSearchRequest = {
        destinations,
        institutions: institutionValue ? [{ name: institutionValue }] : [],
        nearestCity: cityValue,
        // Sent as combined "Mon YYYY" strings (matching the filter options) — the
        // backend parses month + year out of each entry itself.
        intakeMonths: intakeValues,
        courseLevels: courseLevelValues
          .map((value) => getCourseLevelValue(String(value)))
          .filter((value): value is string => Boolean(value)),
        disciplines: disciplineValue ? [disciplineValue] : [],
        minDurationMonths: durationValue ? parseDurationValue(durationValue)?.min ?? undefined : undefined,
        maxDurationMonths: durationValue ? parseDurationValue(durationValue)?.max ?? undefined : undefined,
        postStudyWorkPermit: postStudyWorkPermitValue === "yes",
        studentId: selectedStudentId,
        page: 0,
        size: 20,
      };

      const response = await leadApi.searchCourses(payload);
      navigate(leadRoutePaths.dashboard, {
        replace: true,
        state: {
          courseSearchResponse: response,
          courseSearchPayload: payload,
        },
      });
    } catch {
      setSnack("Failed to load advance search results");
    } finally {
      setIsSubmittingSearch(false);
    }
  }, [navigate, selectedStudentId]);

  if (!hasCourseSearchResults) {
    if (courseSearchOptionsQuery.isLoading && !courseSearchOptionsQuery.data) {
      return (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <CircularProgress size={34} />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          alignItems: "stretch",
          bgcolor: "#f3f7fb",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minHeight: "calc(100vh - 80px)",
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#122033" }}>
          Advance Filter
        </Typography>

        <Paper
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "#e9eff5",
            borderRadius: "16px",
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <FilterPanel
            applyButtonLabel={isSubmittingSearch ? "Loading…" : "Apply"}
            contentColumns={2}
            filtersConfig={courseSearchFilterConfig}
            sx={{ height: "100%", width: "100%" }}
            title="Advance Filter"
            values={advancedFilterValues}
            width="100%"
            onFiltersChange={setAdvancedFilterValues}
            onApplyFilters={(nextValues) => {
              setAdvancedFilterValues(nextValues);
              void handleAdvancedSearchSubmit(nextValues);
            }}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "#e9eff5",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          // Fill the viewport below the topbar: subtract the topbar height plus
          // the <main> wrapper's vertical padding (py:1.25 → 20px total).
          height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 20}px)` },
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Toolbar: quick-filter pills fill the row; advanced filters fold
            behind the Filters button (opens the drawer below). */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexShrink: 0,
            px: { xs: 1.5, md: 2 },
            py: { xs: 1, md: 1 },
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <LeadQuickFilters
                activeKey={activeQuickFilter}
                tabs={quickFilterTabs}
                onChange={handleQuickFilterChange}
              />
            </Box>

            <GlobalSearchBar
              placeholder="Search name, email, phone…"
              value={leadSearchQuery}
              onSearch={handleSearchChange}
              sx={{
                flexShrink: 0,
                width: { xs: 150, sm: 200, md: 240 },
                "& .MuiOutlinedInput-root": { boxShadow: "none", height: 38 },
              }}
            />

            {canCreateLeads ? (
              <Button
                startIcon={<UploadRounded sx={{ fontSize: 18 }} />}
                variant="contained"
                size="small"
                sx={{
                  borderRadius: "9px",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={() => setImportOpen(true)}
              >
                Import Leads
              </Button>
            ) : null}

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
              >
                Filters
              </Button>
            </Badge>
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: "#fcfdff",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
            px: { xs: 1.5, md: 1.5 },
            py: { xs: 1.5, md: 1.5 },
          }}
        >
          {isError ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <Typography color="error" variant="body2">
                Failed to load leads. Check the console for details.
              </Typography>
            </Box>
          ) : (
            <>
              {isLoading && backendLeads.length === 0 ? (
                <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
                  <CircularProgress size={32} />
                </Box>
              ) : null}
              <LeadTableContainer
                leads={pagedRows}
                page={clampedPage}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                pageCount={pageCount}
                paginationLabel={paginationLabel}
                onDeleteLead={handleDeleteLead}
                onBulkDelete={handleBulkDelete}
                onUpdateStage={handleUpdateStage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </Box>

        <Snackbar
          autoHideDuration={3500}
          message={snack}
          open={Boolean(snack)}
          onClose={() => setSnack(null)}
        />
      </Paper>

      {/* Advanced filters, folded behind the toolbar button. Same FilterPanel,
          same handlers — only its home changed from a sidebar to a drawer. */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        slotProps={{ paper: { sx: { display: "flex", flexDirection: "column", width: { xs: "100%", sm: 360 } } } }}
        onClose={() => setDrawerOpen(false)}
      >
        <FilterPanel
          filtersConfig={dynamicFilterConfig}
          sx={{ height: "100%" }}
          values={filterValues}
          width="100%"
          onFiltersChange={handleFilterChange}
          onApplyFilters={(values) => {
            handleFilterChange(values);
            setDrawerOpen(false);
          }}
        />
      </Drawer>

      <ImportLeadsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void queryClient.invalidateQueries({ queryKey: ["leads", "all"] });
          void queryClient.invalidateQueries({ queryKey: ["leads", "count"] });
          setSnack("Leads imported");
        }}
      />
    </>
  );
}
