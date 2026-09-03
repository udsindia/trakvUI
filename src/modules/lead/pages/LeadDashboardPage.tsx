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
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import {
  LeadQuickFilters,
  type LeadQuickFilterTab,
} from "@/modules/lead/components/LeadQuickFilters";
import {
  LeadTableContainer,
  type LeadAgentOption,
  type LeadRow,
} from "@/modules/lead/components/LeadTableContainer";
import { ImportLeadsDialog } from "@/modules/lead/components/ImportLeadsDialog";
import { leadApi, type BackendLead } from "@/modules/lead/leadApi";
import {
  ENROLLED_STAGE,
  fromBackendLeadStage,
  toBackendLeadStage,
} from "@/modules/lead/leadStageMappers";
import { usersService } from "@/modules/settings/usersService";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import {
  FilterPanel,
  getDefaultFilterPanelValues,
  type DateRangeFilterValue,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";
import { joinPhoneNumber } from "@/shared/utils/phone";

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
    phone: joinPhoneNumber(lead.countryCode, lead.phone),
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
  const queryClient = useQueryClient();
  const tenantId = tenant?.tenantId ?? "";

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [snack, setSnack] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const canCreateLeads = hasPermissions([PERMISSIONS.LEAD_CREATE]);
  const canAssignLeads = hasPermissions([PERMISSIONS.LEAD_ASSIGN]);
  const activeFilterCount = countActiveFilters(filterValues, filterConfig);

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
  });

  const backendLeads: BackendLead[] = leadsPage?.content ?? [];

  const usersQuery = useQuery({
    enabled: Boolean(tenantId) && canAssignLeads,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const sourcesQuery = useQuery({
    queryKey: ["leads", "sources"],
    queryFn: leadApi.getSources,
  });
  const countriesQuery = useQuery({
    queryKey: ["leads", "countries"],
    queryFn: leadApi.getCountries,
  });

  const dynamicFilterConfig = useMemo<FilterConfig[]>(() => {
    const counsellorNames = Array.from(
      new Set(
        (usersQuery.data ?? [])
          .filter((user) => user.active)
          .map((user) => user.name)
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const sourceOptions = sourcesQuery.data?.length ? sourcesQuery.data : undefined;
    const countryOptions = countriesQuery.data?.length ? countriesQuery.data : undefined;

    return filterConfig
      .filter((config) => config.key !== "agent" || canAssignLeads)
      .map((config) => {
        if (config.key === "agent") return { ...config, options: counsellorNames };
        if (config.key === "source" && sourceOptions) return { ...config, options: sourceOptions };
        if (config.key === "country" && countryOptions) return { ...config, options: countryOptions };
        return config;
      });
  }, [usersQuery.data, sourcesQuery.data, countriesQuery.data, canAssignLeads]);

  const leadRows: LeadRow[] = useMemo(() => backendLeads.map(mapBackendLeadToRow), [backendLeads]);

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
    totalVisible === 0 ? "Showing 0 of 0 leads" : `Showing ${pageStart}–${pageEnd} of ${totalVisible} leads`;

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

  const agentOptions: LeadAgentOption[] = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((user) => user.active)
        .map((user) => ({ agentId: user.id, agentName: user.name })),
    [usersQuery.data],
  );

  const handleAssignLeads = async (ids: string[], agentId: string) => {
    const agentName = agentOptions.find((option) => option.agentId === agentId)?.agentName ?? "";
    try {
      // The bulk endpoint takes the entity field name (assignedTo), unlike the
      // single-lead PATCH payload (assignedToId).
      if (ids.length > 1) {
        await leadApi.bulkUpdateLeads(ids, { assignedTo: agentId });
      } else {
        await leadApi.updateLead(ids[0], { assignedToId: agentId });
      }
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      setSnack(
        ids.length > 1
          ? `${ids.length} leads assigned to ${agentName}`
          : `Lead assigned to ${agentName}`,
      );
    } catch {
      setSnack("Failed to assign lead(s)");
    }
  };

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      await leadApi.updateLead(id, {
        leadStage: toBackendLeadStage(stage),
      });
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      // Enrolling creates the student record server-side, so the application
      // student picker has to be refetched for it to show up.
      if (stage === ENROLLED_STAGE) {
        await queryClient.invalidateQueries({ queryKey: ["students"] });
        setSnack("Lead enrolled — student record created");
      } else {
        setSnack(`Stage updated to ${stage}`);
      }
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
          height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 20}px)` },
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
                agentOptions={agentOptions}
                canAssign={canAssignLeads}
                onAssignLeads={handleAssignLeads}
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
