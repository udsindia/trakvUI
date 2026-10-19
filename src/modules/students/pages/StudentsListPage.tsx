import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Box, Button, CircularProgress, Drawer, Paper, Stack, Typography } from "@mui/material";
import { TuneRounded } from "@mui/icons-material";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { applicationsApi, type BackendApplication } from "@/modules/applications/applicationsApi";
import { applicationStageLabel } from "@/modules/applications/applicationStage";
import {
  ApplicationQuickFilters as QuickFilters,
  type ApplicationQuickFilterTab as QuickFilterTab,
} from "@/modules/applications/components/ApplicationQuickFilters";
import {
  StudentTableContainer,
  type StudentRow,
} from "@/modules/students/components/StudentTableContainer";
import { studentsApi, type BackendStudent } from "@/modules/students/studentsApi";
import { studentDetailsPath } from "@/modules/students/studentsRoutePaths";
import { usersService } from "@/modules/settings/usersService";
import { ALL_PAGE_SIZE } from "@/shared/components/DataTable";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import {
  FilterPanel,
  getDefaultFilterPanelValues,
  type DateRangeFilterValue,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";
import { joinPhoneNumber } from "@/shared/utils/phone";
import { pageSearch, useRegisterPageSearch } from "@/shared/state/pageSearch";
import { matchesSearch } from "@/shared/utils/search";

const DEFAULT_PAGE_SIZE = 10;
// The page filters and pages the list client-side (see studentsApi), so "All" is just a page size that fits it.
const PAGE_SIZE_OPTIONS = [10, 20, 50, ALL_PAGE_SIZE];

/**
 * The Filters drawer, the same panel the Lead Management page uses. The option lists are filled in
 * from the students actually loaded (see dynamicFilterConfig), so nothing is offered that matches
 * nobody; this static copy only defines the controls and their empty defaults.
 */
const filterConfig: FilterConfig[] = [
  { type: "dropdown", label: "Counsellor", key: "counsellor", placeholder: "All counsellors", options: [] },
  { type: "dropdown", label: "Application stage", key: "applicationStage", placeholder: "All stages", options: [] },
  { type: "checkbox-group", label: "Source", key: "source", options: [] },
  { type: "date-range", label: "Enrolled date", key: "dateRange" },
];

/** Counts the filter groups set away from their default: the badge on the Filters button. */
function countActiveFilters(values: FilterPanelValues): number {
  return filterConfig.reduce((count, config) => {
    const value = values[config.key];
    switch (config.type) {
      case "dropdown":
        return count + (typeof value === "string" && value ? 1 : 0);
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

function applyPanelFilters(rows: StudentRow[], values: FilterPanelValues): StudentRow[] {
  return rows.filter((row) => {
    const counsellor = values.counsellor as string | undefined;
    if (counsellor && row.counsellor !== counsellor) return false;

    const stage = values.applicationStage as string | undefined;
    if (stage && row.applicationStage !== stage) return false;

    const sources = values.source as string[] | undefined;
    if (Array.isArray(sources) && sources.length > 0 && !sources.includes(row.leadSource)) return false;

    const range = values.dateRange as DateRangeFilterValue | undefined;
    if (range?.startDate || range?.endDate) {
      const enrolled = row.enrolledAt ? new Date(row.enrolledAt).getTime() : NaN;
      if (Number.isNaN(enrolled)) return false;
      // Both bounds are whole local days, so a student enrolled at 11pm on the end date is still in.
      const start = range.startDate ? new Date(`${range.startDate}T00:00:00`).getTime() : NaN;
      const end = range.endDate ? new Date(`${range.endDate}T23:59:59.999`).getTime() : NaN;
      if (!Number.isNaN(start) && enrolled < start) return false;
      if (!Number.isNaN(end) && enrolled > end) return false;
    }
    return true;
  });
}

const quickFilterDefinitions = [
  { key: "all", label: "All" },
  { key: "lead", label: "Enrolled leads" },
  { key: "direct", label: "Direct" },
];

function mapBackendStudentToRow(
  student: BackendStudent,
  counsellorNames: Map<string, string>,
  applicationsByStudent: Map<string, BackendApplication[]>,
): StudentRow {
  const name = [student.firstName, student.lastName].filter(Boolean).join(" ").trim();
  const studentApplications = applicationsByStudent.get(student.id) ?? [];

  return {
    id: student.id,
    name: name || student.email || "—",
    email: student.email ?? "",
    phone: joinPhoneNumber(student.phoneCountryCode, student.phone),
    // The newest application is the one that speaks for the student; older ones are
    // counted, not named. Ordered on arrival below, so [0] is already the newest.
    applicationStage: studentApplications[0] ? applicationStageLabel(studentApplications[0]) : "",
    applicationCount: studentApplications.length,
    // Falls back to an em-dash when the viewer cannot list users (no USER_VIEW).
    counsellor: (student.assignedTo && counsellorNames.get(student.assignedTo)) || "",
    leadSource: student.leadSourceName ?? "",
    fromLead: Boolean(student.leadId),
    enrolledAt: student.enrolledAt ?? "",
  };
}

export function StudentsListPage() {
  const navigate = useNavigate();
  const { hasPermissions, tenant } = useAuth();
  const tenantId = tenant?.tenantId ?? "";
  const canViewUsers = hasPermissions([PERMISSIONS.USERS_VIEW]);
  const canViewApplications = hasPermissions([PERMISSIONS.APPLICATIONS_VIEW]);

  // The top bar's search box filters this table live while the page is open (see pageSearch); the
  // box on the page itself shares the same text, so the two always agree and mobile still has one.
  const searchQuery = useRegisterPageSearch("Search students: name, phone, counsellor…");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    data: backendStudents = [],
    isLoading,
    isError,
  } = useQuery({
    // Distinct from ["students", "options"], which caches the picker-shaped rows —
    // see the note in useApplicationFormController. Both still match an
    // invalidateQueries({ queryKey: ["students"] }) prefix invalidation.
    queryKey: ["students", "list"],
    queryFn: studentsApi.getStudents,
  });

  // Only for turning assignedTo ids into names; the page still works without it.
  const { data: users = [] } = useQuery({
    enabled: Boolean(tenantId) && canViewUsers,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  /*
    One list request for the whole page rather than one per student — the applications
    list is already fetched this way elsewhere and shares this cache key with the
    applications page, so opening either warms the other.
  */
  const { data: allApplications = [] } = useQuery({
    enabled: canViewApplications,
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  const counsellorNames = useMemo(
    () => new Map(users.map((user) => [user.id, user.name])),
    [users],
  );

  const applicationsByStudent = useMemo(() => {
    const grouped = new Map<string, BackendApplication[]>();
    for (const application of allApplications) {
      if (!application.studentId) continue;
      const existing = grouped.get(application.studentId);
      if (existing) {
        existing.push(application);
      } else {
        grouped.set(application.studentId, [application]);
      }
    }
    // Newest first, so the column names the application the student is actually working
    // through rather than whichever one the server happened to return first.
    for (const list of grouped.values()) {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return grouped;
  }, [allApplications]);

  const studentRows: StudentRow[] = useMemo(
    () =>
      backendStudents.map((student) =>
        mapBackendStudentToRow(student, counsellorNames, applicationsByStudent),
      ),
    [backendStudents, counsellorNames, applicationsByStudent],
  );

  const quickFilterTabs: QuickFilterTab[] = useMemo(
    () =>
      quickFilterDefinitions.map((tab) => ({
        ...tab,
        count:
          tab.key === "all"
            ? studentRows.length
            : studentRows.filter((student) => (student.fromLead ? "lead" : "direct") === tab.key)
                .length,
      })),
    [studentRows],
  );

  const query = searchQuery.trim().toLowerCase();

  // Offer only what exists in the loaded students: the counsellors who have students, the stages
  // they are at, and the sources they came from.
  const dynamicFilterConfig = useMemo<FilterConfig[]>(() => {
    const distinct = (values: string[]) =>
      Array.from(new Set(values.filter((value) => value && value !== "—"))).sort((a, b) =>
        a.localeCompare(b),
      );
    const counsellors = distinct(studentRows.map((row) => row.counsellor));
    const stages = distinct(studentRows.map((row) => row.applicationStage));
    const sources = distinct(studentRows.map((row) => row.leadSource));

    return filterConfig
      // A viewer who cannot list users gets no counsellor names, so there is nothing to choose from.
      .filter((config) => config.key !== "counsellor" || counsellors.length > 0)
      .map((config) => {
        if (config.key === "counsellor") return { ...config, options: counsellors };
        if (config.key === "applicationStage") return { ...config, options: stages };
        if (config.key === "source") return { ...config, options: sources };
        return config;
      });
  }, [studentRows]);

  const activeFilterCount = countActiveFilters(filterValues);

  const filteredRows = useMemo(
    () =>
      applyPanelFilters(studentRows, filterValues).filter((student) => {
        if (
          activeQuickFilter !== "all" &&
          (student.fromLead ? "lead" : "direct") !== activeQuickFilter
        ) {
          return false;
        }
        // Every column the table shows, so typing a counsellor, a source or an application stage finds students too.
        return matchesSearch(query, [
          student.name,
          student.email,
          student.phone,
          student.counsellor,
          student.leadSource,
          student.applicationStage,
        ]);
      }),
    [studentRows, filterValues, activeQuickFilter, query],
  );

  const handleFilterChange = (values: FilterPanelValues) => {
    setFilterValues((current) => {
      if (JSON.stringify(current) === JSON.stringify(values)) return current;
      setPage(1);
      return values;
    });
  };

  const visibleCount = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  const pageStart = visibleCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = visibleCount === 0 ? 0 : Math.min(clampedPage * pageSize, visibleCount);
  const paginationLabel =
    visibleCount === 0
      ? "Showing 0 of 0 students"
      : `Showing ${pageStart}-${pageEnd} of ${visibleCount} students`;

  const handleSearchChange = (value: string) => {
    pageSearch.setValue(value);
  };

  // A new search starts from the first page, whichever box it was typed into.
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleQuickFilterChange = (key: string) => {
    setActiveQuickFilter(key);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, pageCount)));
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (nextPageSize === pageSize) return;
    setPageSize(nextPageSize);
    setPage(1);
  };

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
        height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
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
            <QuickFilters
              activeKey={activeQuickFilter}
              tabs={quickFilterTabs}
              onChange={handleQuickFilterChange}
            />
          </Box>

          <GlobalSearchBar
            placeholder="Search name, email, phone…"
            value={searchQuery}
            onSearch={handleSearchChange}
            sx={{
              flexShrink: 0,
              width: { xs: 150, sm: 200, md: 240 },
              "& .MuiOutlinedInput-root": { boxShadow: "none", height: 38 },
            }}
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
              sx={{ borderRadius: "9px", textTransform: "none", whiteSpace: "nowrap" }}
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
          gap: 2.25,
          minHeight: 0,
          pb: { xs: 1, md: 2 },
          pt: { xs: 2, md: 2 },
          px: { xs: 2, md: 2 },
        }}
      >
        {isLoading ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
            <Typography color="error" variant="body2">
              Failed to load students.
            </Typography>
          </Box>
        ) : (
          <StudentTableContainer
            page={clampedPage}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            paginationLabel={paginationLabel}
            students={pagedRows}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={(student) => navigate(studentDetailsPath(student.id))}
          />
        )}
      </Box>
    </Paper>

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
    </>
  );
}
