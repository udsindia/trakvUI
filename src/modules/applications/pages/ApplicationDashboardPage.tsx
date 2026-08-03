import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ApplicationQuickFilters, type ApplicationQuickFilterTab } from "@/modules/applications/components/ApplicationQuickFilters";
import { ApplicationTableContainer, type ApplicationRow } from "@/modules/applications/components/ApplicationTableContainer";
import { applicationsApi, type BackendApplication } from "@/modules/applications/applicationsApi";
import { FilterPanel, type FilterConfig, type FilterPanelValues } from "@/shared/components/FilterPanel";

/** "OFFER_ACCEPTED" -> "Offer Accepted" */
function humanizeOutcome(value?: string | null): string {
  return value
    ? value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
}

/**
 * A CLOSED application (any terminal outcome — Withdrawn, Offer Accepted, Rejected…)
 * shows its outcome, NOT the stage it happened to be in when closed. Only an open
 * (IN_PROGRESS) application shows its current stage.
 */
function deriveStatus(app: BackendApplication): string {
  if (app.outcome && app.outcome !== "IN_PROGRESS") {
    return humanizeOutcome(app.outcome);
  }
  return app.stage ?? app.currentStageName ?? humanizeOutcome(app.outcome) ?? "In Progress";
}

function mapBackendApplicationToRow(app: BackendApplication): ApplicationRow {
  return {
    id: app.id,
    studentName: app.studentName ?? "—",
    email: app.email ?? "",
    targetCountry: app.targetCountry ?? app.destinationCountry ?? "",
    targetUniversity: app.targetUniversity ?? app.universityName ?? "",
    course: app.course ?? app.courseName ?? "",
    stage: deriveStatus(app),
    createdAt: app.createdAt,
  };
}

export function ApplicationDashboardPage() {
  const [filterValues, setFilterValues] = useState<FilterPanelValues>({ country: "", stage: "" });
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: backendApps = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  const appRows: ApplicationRow[] = useMemo(
    () => backendApps.map(mapBackendApplicationToRow),
    [backendApps],
  );

  // Filter options are derived from the actual data so they always match real values.
  const distinctCountries = useMemo(
    () => Array.from(new Set(appRows.map((r) => r.targetCountry).filter(Boolean))).sort(),
    [appRows],
  );
  const distinctStages = useMemo(
    () => Array.from(new Set(appRows.map((r) => r.stage).filter(Boolean))).sort(),
    [appRows],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      { type: "dropdown", label: "Target Country", key: "country", placeholder: "All Countries", options: distinctCountries },
      { type: "dropdown", label: "Stage", key: "stage", placeholder: "All Stages", options: distinctStages },
    ],
    [distinctCountries, distinctStages],
  );

  const quickFilterTabs: ApplicationQuickFilterTab[] = useMemo(() => {
    const perStage = distinctStages.map((stage) => ({
      key: stage,
      label: stage,
      count: appRows.filter((r) => r.stage === stage).length,
    }));
    return [{ key: "all", label: "All", count: appRows.length }, ...perStage];
  }, [appRows, distinctStages]);

  const countryFilter = (filterValues.country as string) || "";
  const stageFilter = (filterValues.stage as string) || "";
  const query = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      appRows.filter((r) => {
        if (activeQuickFilter !== "all" && r.stage !== activeQuickFilter) return false;
        if (countryFilter && r.targetCountry !== countryFilter) return false;
        if (stageFilter && r.stage !== stageFilter) return false;
        if (query) {
          const haystack = `${r.studentName} ${r.email} ${r.targetUniversity} ${r.course}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      }),
    [appRows, activeQuickFilter, countryFilter, stageFilter, query],
  );

  const visibleCount = filteredRows.length;
  const paginationLabel = visibleCount === 0
    ? "Showing 0 of 0 applications"
    : `Showing 1-${visibleCount} of ${visibleCount} applications`;

  // Reserved for when the search bar is re-enabled.
  void setSearchQuery;

  return (
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
      <Box sx={{ display: "grid", flex: 1, gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0, 1fr)" }, minHeight: 0 }}>
        <Box sx={{ borderColor: "#edf2f7", borderBottom: { xs: "1px solid", lg: 0 }, minHeight: 0, overflow: "hidden", px: { xs: 2.5, md: 3, lg: 0 }, py: { xs: 2.5, md: 3, lg: 3 }, width: "100%" }}>
          <FilterPanel filtersConfig={filterConfig} stickyTopOffset={0} width={250} values={filterValues} onFiltersChange={setFilterValues} />
        </Box>

        <Box sx={{ bgcolor: "#fcfdff", display: "flex", flex: 1, flexDirection: "column", gap: 2.25, minHeight: 0, pb: { xs: 1, md: 2 }, px: { xs: 2, md: 2 }, pt: { xs: 2, md: 2 } }}>
          <ApplicationQuickFilters activeKey={activeQuickFilter} tabs={quickFilterTabs} onChange={setActiveQuickFilter} />

          {isLoading ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : isError ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <Typography color="error" variant="body2">Failed to load applications.</Typography>
            </Box>
          ) : (
            <ApplicationTableContainer applications={filteredRows} page={1} pageCount={1} paginationLabel={paginationLabel} />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
