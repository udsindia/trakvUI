import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRounded, TuneRounded } from "@mui/icons-material";
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
import { usersService } from "@/modules/settings/usersService";
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
    // `country` is the first destination for the table cell; `countries` keeps the
    // full list so the Country filter matches leads whose match isn't the first one.
    country: lead.destinationCountries?.[0] ?? "",
    countries: lead.destinationCountries ?? [],
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
    if (countryFilter && !row.countries.includes(countryFilter)) return false;

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
  const { hasPermissions, tenant } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = tenant?.tenantId ?? "";

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [snack, setSnack] = useState<string | null>(null);

  const canCreateLeads = hasPermissions([PERMISSIONS.LEAD_CREATE]);
  const canAssignLeads = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);
  const canDeleteLeads = hasPermissions([PERMISSIONS.LEAD_DELETE]);
  const activeFilterCount = countActiveFilters(filterValues, filterConfig);

  const { data: backendLeads = [], isLoading, isError } = useQuery({
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  // Real counsellors added via User Management feed the Agent filter, so it
  // stays in sync with who actually exists in the tenant.
  const usersQuery = useQuery({
    enabled: Boolean(tenantId) && canAssignLeads,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  // Distinct Source and Country values come from the backend so the drawer's
  // options reflect the tenant's actual leads instead of a hardcoded list.
  const sourcesQuery = useQuery({
    queryKey: ["leads", "sources"],
    queryFn: leadApi.getSources,
  });
  const countriesQuery = useQuery({
    queryKey: ["leads", "countries"],
    queryFn: leadApi.getCountries,
  });

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
              canDelete={canDeleteLeads}
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
    </>
  );
}
