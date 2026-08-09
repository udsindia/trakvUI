import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TuneRounded } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, Drawer, Paper, Stack, Typography } from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ApplicationQuickFilters, type ApplicationQuickFilterTab } from "@/modules/applications/components/ApplicationQuickFilters";
import { ApplicationTableContainer, type ApplicationRow } from "@/modules/applications/components/ApplicationTableContainer";
import { applicationsApi, type BackendApplication } from "@/modules/applications/applicationsApi";
import { FilterPanel, type FilterConfig, type FilterPanelValues } from "@/shared/components/FilterPanel";
import { useCountries } from "@/modules/universities/useUniversitiesCatalog";

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
    targetCountry: app.targetCountry ?? app.destinationCountry ?? "",
    targetUniversity: app.targetUniversity ?? app.universityName ?? "",
    course: app.course ?? app.courseName ?? "",
    // Backend sends the current stage name (or outcome for un-staged apps); fall back safely.
    stage: app.currentStageName ?? app.stage ?? app.outcome ?? "Unknown",
    createdAt: app.createdAt,
  };
}

export function ApplicationDashboardPage() {
  const [filterValues, setFilterValues] = useState<FilterPanelValues>({ country: "", stage: "" });
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery] = useState("");

  const [page, setPage] = useState(1);
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
  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = visibleCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, visibleCount);
  const paginationLabel = visibleCount === 0
    ? "Showing 0 of 0 applications"
    : `Showing ${rangeStart}-${rangeEnd} of ${visibleCount} applications`;

  const handleFilterChange = (values: FilterPanelValues) => {
    setFilterValues(values);
  };

  const handleApplyFilters = (values: FilterPanelValues) => {
    setFilterValues(values);
    setDrawerOpen(false);
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
              <ApplicationQuickFilters activeKey={activeQuickFilter} tabs={quickFilterTabs} onChange={setActiveQuickFilter} />
            </Box>

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
              page={safePage}
              pageCount={pageCount}
              paginationLabel={paginationLabel}
              onPageChange={setPage}
              onDeleteApplication={handleDeleteApplication}
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
