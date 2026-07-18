import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRounded } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import {
  LeadQuickFilters,
  type LeadQuickFilterTab,
} from "@/modules/lead/components/LeadQuickFilters";
import {
  LeadTableContainer,
  type LeadRow,
} from "@/modules/lead/components/LeadTableContainer";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { leadApi, type BackendLead } from "@/modules/lead/leadApi";
import { fromBackendLeadStage, toBackendLeadStage } from "@/modules/lead/leadStageMappers";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import {
  FilterPanel,
  getDefaultFilterPanelValues,
  type DateRangeFilterValue,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";

const PAGE_SIZE = 25;

const quickFilterDefinitions: Omit<LeadQuickFilterTab, "count">[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
];

const filterConfig: FilterConfig[] = [
  {
    type: "dropdown",
    label: "Agent",
    key: "agent",
    placeholder: "All Agents",
    options: ["Aisha Khan", "Rahul Verma", "Priya Menon"],
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
      const created = row.createdAt ? new Date(row.createdAt).getTime() : null;
      if (created !== null) {
        if (dateFilter.startDate && created < new Date(dateFilter.startDate).getTime()) return false;
        if (dateFilter.endDate && created > new Date(dateFilter.endDate + "T23:59:59").getTime()) return false;
      }
    }

    return true;
  });
}

export function LeadDashboardPage() {
  const { hasPermissions } = useAuth();
  const queryClient = useQueryClient();

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [snack, setSnack] = useState<string | null>(null);

  const canCreateLeads = hasPermissions([PERMISSIONS.LEAD_CREATE]);

  const { data: backendLeads = [], isLoading, isError } = useQuery({
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  const leadRows: LeadRow[] = useMemo(
    () => backendLeads.map(mapBackendLeadToRow),
    [backendLeads],
  );

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

  const pageCount = Math.max(1, Math.ceil(fullyFilteredRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount);
  const pagedRows = fullyFilteredRows.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE,
  );

  const totalVisible = fullyFilteredRows.length;
  const pageStart = totalVisible === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(clampedPage * PAGE_SIZE, totalVisible);
  const paginationLabel =
    totalVisible === 0
      ? "Showing 0 of 0 leads"
      : `Showing ${pageStart}–${pageEnd} of ${totalVisible} leads`;

  const handleFilterChange = (values: FilterPanelValues) => {
    setFilterValues(values);
    setPage(1);
  };

  const handleSearchChange = (query: string) => {
    setLeadSearchQuery(query);
    setPage(1);
  };

  const handleQuickFilterChange = (key: string) => {
    setActiveQuickFilter(key);
    setPage(1);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await leadApi.deleteLead(id);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSnack("Lead deleted");
    } catch {
      setSnack("Failed to delete lead");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => leadApi.deleteLead(id)));
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSnack(`${ids.length} lead(s) deleted`);
    } catch {
      setSnack("Failed to delete some leads");
    }
  };

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      const updated = await leadApi.updateLead(id, {
        leadStage: toBackendLeadStage(stage),
      });
      queryClient.setQueryData<BackendLead[]>(["leads"], (current) =>
        current?.map((lead) => (lead.id === id ? updated : lead)),
      );
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSnack(`Stage updated to ${stage}`);
    } catch {
      setSnack("Failed to update stage");
    }
  };

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
      <Box
        sx={{
          display: "grid",
          flex: 1,
          gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0, 1fr)" },
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            borderColor: "#edf2f7",
            borderBottom: { xs: "1px solid", lg: 0 },
            maxHeight: { lg: "100%" },
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
            px: { xs: 2.5, md: 3, lg: 0 },
            py: { xs: 2.5, md: 3, lg: 3 },
            width: "100%",
          }}
        >
          <FilterPanel
            filtersConfig={filterConfig}
            stickyTopOffset={0}
            width={250}
            values={filterValues}
            onFiltersChange={handleFilterChange}
            onApplyFilters={handleFilterChange}
          />
        </Box>

        <Box
          sx={{
            bgcolor: "#fcfdff",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: 2.25,
            minHeight: 0,
            minWidth: 0,
            pb: { xs: 1, md: 2 },
            pl: { xs: 2, md: 2 },
            pr: { xs: 2, md: 2 },
            pt: { xs: 2, md: 2 },
          }}
        >
          <LeadQuickFilters
            activeKey={activeQuickFilter}
            tabs={quickFilterTabs}
            onChange={handleQuickFilterChange}
          />

          {isLoading ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : isError ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
              <Typography color="error" variant="body2">
                Failed to load leads. Check the console for details.
              </Typography>
            </Box>
          ) : (
            <LeadTableContainer
              leads={pagedRows}
              page={clampedPage}
              pageCount={pageCount}
              paginationLabel={paginationLabel}
              onDeleteLead={handleDeleteLead}
              onBulkDelete={handleBulkDelete}
              onUpdateStage={handleUpdateStage}
              onPageChange={setPage}
            />
          )}
        </Box>
      </Box>

      <Snackbar
        autoHideDuration={3500}
        message={snack}
        open={Boolean(snack)}
        onClose={() => setSnack(null)}
      />
    </Paper>
  );
}
