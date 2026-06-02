import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddRounded } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ApplicationQuickFilters, type ApplicationQuickFilterTab } from "@/modules/applications/components/ApplicationQuickFilters";
import { ApplicationTableContainer, type ApplicationRow } from "@/modules/applications/components/ApplicationTableContainer";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi, type BackendApplication } from "@/modules/applications/applicationsApi";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import { FilterPanel, getDefaultFilterPanelValues, type FilterConfig, type FilterPanelValues } from "@/shared/components/FilterPanel";

const quickFilterDefinitions: Omit<ApplicationQuickFilterTab, "count">[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "visa_applied", label: "Visa Applied" },
  { key: "approved", label: "Visa Approved" },
];

const filterConfig: FilterConfig[] = [
  {
    type: "dropdown",
    label: "Target Country",
    key: "country",
    placeholder: "All Countries",
    options: ["Canada", "Australia", "United Kingdom", "Germany", "USA"],
  },
  {
    type: "dropdown",
    label: "Stage",
    key: "stage",
    placeholder: "All Stages",
    options: ["Draft", "Submitted", "Processing", "Visa Applied", "Visa Approved", "Visa Rejected", "Completed"],
  },
];

function mapBackendApplicationToRow(app: BackendApplication): ApplicationRow {
  return {
    id: app.id,
    studentName: app.studentName,
    email: app.email,
    targetCountry: app.targetCountry,
    targetUniversity: app.targetUniversity,
    course: app.course,
    stage: app.stage,
    createdAt: app.createdAt,
  };
}

function getStageKey(stage: string) {
  if (stage === "Visa Applied") return "visa_applied";
  if (stage === "Visa Approved") return "approved";
  if (stage === "Processing" || stage === "Submitted") return "processing";
  return stage.toLowerCase().replace(/\s+/g, "_");
}

export function ApplicationDashboardPage() {
  const { hasPermissions } = useAuth();
  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() => getDefaultFilterPanelValues(filterConfig));
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const canCreate = hasPermissions([PERMISSIONS.APPLICATIONS_MANAGE]);

  const { data: backendApps = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  const appRows: ApplicationRow[] = backendApps.map(mapBackendApplicationToRow);

  const quickFilterTabs: ApplicationQuickFilterTab[] = quickFilterDefinitions.map((tab) => ({
    ...tab,
    count: tab.key === "all" ? appRows.length : appRows.filter((app) => getStageKey(app.stage) === tab.key).length,
  }));

  const filteredRows = activeQuickFilter === "all"
    ? appRows
    : appRows.filter((app) => getStageKey(app.stage) === activeQuickFilter);

  const visibleCount = filteredRows.length;
  const paginationLabel = visibleCount === 0 ? "Showing 0 of 0 applications" : `Showing 1-${visibleCount} of ${visibleCount} applications`;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ width: { xs: "100%", md: "auto" } }}>
              <GlobalSearchBar
                placeholder="Search applications..."
                sx={{ width: { xs: "100%", md: 280 } }}
                value={searchQuery}
                onSearch={setSearchQuery}
              />
              {canCreate ? (
                <Button
                  component={RouterLink}
                  startIcon={<AddRounded />}
                  sx={{ minHeight: 44, px: 2.25, textTransform: "none" }}
                  to={applicationsRoutePaths.create}
                  variant="contained"
                >
                  Add Application
                </Button>
              ) : null}
            </Stack>
          }
          title="Applications"
          subtitle=""
        />
      </Box>

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
