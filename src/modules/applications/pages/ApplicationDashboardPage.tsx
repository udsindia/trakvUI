import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TuneRounded } from "@mui/icons-material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { Badge, Box, Button, CircularProgress, Drawer, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ApplicationQuickFilters, type ApplicationQuickFilterTab } from "@/modules/applications/components/ApplicationQuickFilters";
import { ApplicationTableContainer, type ApplicationRow } from "@/modules/applications/components/ApplicationTableContainer";
import { countryDisplayName } from "@/modules/universities/universitiesMappers";
import { applicationsApi, type BackendApplication } from "@/modules/applications/applicationsApi";
import { applicationStageLabel } from "@/modules/applications/applicationStage";
import { FilterPanel, type FilterConfig, type FilterPanelValues } from "@/shared/components/FilterPanel";
import { useCountries } from "@/modules/universities/useUniversitiesCatalog";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function countActiveFilters(values: FilterPanelValues, config: FilterConfig[]): number {
  return config.reduce((count, filterConfig) => {
    const value = values[filterConfig.key];
    switch (filterConfig.type) {
      case "dropdown":
        return count + (typeof value === "string" && value ? 1 : 0);
      case "checkbox-group":
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
      case "date-range": {
        const range = value as { startDate?: string; endDate?: string } | undefined;
        return count + (range && (range.startDate || range.endDate) ? 1 : 0);
      }
      case "slider":
        return count;
      default:
        return count;
    }
  }, 0);
}

function mapBackendApplicationToRow(app: BackendApplication): ApplicationRow {
  return {
    id: app.id,
    studentName: app.studentName ?? "—",
    email: app.email ?? "",
    targetCountry: app.targetCountry ?? countryDisplayName(app.destinationCountryCode),
    targetUniversity: app.targetUniversity ?? app.universityName ?? "",
    course: app.course ?? app.courseName ?? "",
    stage: applicationStageLabel(app),
    createdAt: app.createdAt,
  };
}

export function ApplicationDashboardPage() {
  const [filterValues, setFilterValues] = useState<FilterPanelValues>({ country: "", stage: "" });
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const queryClient = useQueryClient();

  const { data: backendApps = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
  const handleDeleteApplication = (id: string) => deleteMutation.mutateAsync(id);

  const { data: countries = [] } = useCountries();

  const appRows: ApplicationRow[] = useMemo(
    () => backendApps.map(mapBackendApplicationToRow),
    [backendApps],
  );

  const distinctCountries = useMemo(() => {
    const apiCountries = countries
      .map((country) => country.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const rowCountries = appRows
      .map((row) => row.targetCountry)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return Array.from(new Set([...apiCountries, ...rowCountries])).sort((a, b) => a.localeCompare(b));
  }, [appRows, countries]);

  const distinctStages = useMemo(
    () => Array.from(new Set(appRows.map((row) => row.stage).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [appRows],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      { type: "dropdown", label: "Target Country", key: "country", placeholder: "All Countries", options: distinctCountries },
      { type: "dropdown", label: "Stage", key: "stage", placeholder: "All Stages", options: distinctStages },
    ],
    [distinctCountries, distinctStages],
  );

  const activeFilterCount = countActiveFilters(filterValues, filterConfig);

  const quickFilterTabs: ApplicationQuickFilterTab[] = useMemo(() => {
    const perStage = distinctStages.map((stage) => ({
      key: stage,
      label: stage,
      count: appRows.filter((row) => row.stage === stage).length,
    }));
    return [{ key: "all", label: "All", count: appRows.length }, ...perStage];
  }, [appRows, distinctStages]);

  const countryFilter = (filterValues.country as string) || "";
  const stageFilter = (filterValues.stage as string) || "";
  const query = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      appRows.filter((row) => {
        if (activeQuickFilter !== "all" && row.stage !== activeQuickFilter) return false;
        if (countryFilter && row.targetCountry !== countryFilter) return false;
        if (stageFilter && row.stage !== stageFilter) return false;
        if (query) {
          const haystack = `${row.studentName} ${row.email} ${row.targetUniversity} ${row.course}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      }),
    [appRows, activeQuickFilter, countryFilter, stageFilter, query],
  );

  const visibleCount = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  const pageStart = visibleCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = visibleCount === 0 ? 0 : Math.min(clampedPage * pageSize, visibleCount);
  const paginationLabel = visibleCount === 0
    ? "Showing 0 of 0 applications"
    : `Showing ${pageStart}-${pageEnd} of ${visibleCount} applications`;

  const handleFilterChange = (values: FilterPanelValues) => {
    setFilterValues(values);
    setPage(1);
  };

  const handleApplyFilters = (values: FilterPanelValues) => {
    setFilterValues(values);
    setPage(1);
    setDrawerOpen(false);
  };

  const handleQuickFilterChange = (key: string) => {
    setActiveQuickFilter(key);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const normalizedPage = Math.max(1, Math.min(nextPage, pageCount));
    setPage(normalizedPage);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // A narrower result set can leave the current page past the end of it.
    setPage(1);
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
              <ApplicationQuickFilters activeKey={activeQuickFilter} tabs={quickFilterTabs} onChange={handleQuickFilterChange} />
            </Box>

            <TextField
              placeholder="Search student, email, university or course"
              size="small"
              value={searchQuery}
              sx={{
                flexShrink: 0,
                width: { xs: 180, md: 300 },
                "& .MuiOutlinedInput-root": { borderRadius: "9px", fontSize: 13 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: "text.disabled", fontSize: 17 }} />
                    </InputAdornment>
                  ),
                },
              }}
              onChange={(event) => handleSearchChange(event.target.value)}
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
              >
                Filters
              </Button>
            </Badge>
          </Stack>
        </Box>

        <Box sx={{ bgcolor: "#fcfdff", display: "flex", flex: 1, flexDirection: "column", gap: 2.25, minHeight: 0, pb: { xs: 1, md: 2 }, px: { xs: 2, md: 2 }, pt: { xs: 2, md: 2 } }}>
          {isLoading ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : isError ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <Typography color="error" variant="body2">Failed to load applications.</Typography>
            </Box>
          ) : (
            <ApplicationTableContainer
              applications={pagedRows}
              page={clampedPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              pageCount={pageCount}
              paginationLabel={paginationLabel}
              onDeleteApplication={handleDeleteApplication}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
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
          filtersConfig={filterConfig}
          sx={{ height: "100%" }}
          values={filterValues}
          width="100%"
          onFiltersChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
        />
      </Drawer>
    </>
  );
}
