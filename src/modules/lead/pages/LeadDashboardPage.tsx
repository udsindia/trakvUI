import { useState } from "react";
import { AddRounded } from "@mui/icons-material";
import { Box, Button, Paper, Stack } from "@mui/material";
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
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import {
  FilterPanel,
  getDefaultFilterPanelValues,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";

const quickFilterDefinitions: Omit<LeadQuickFilterTab, "count">[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
];

const filterConfig: FilterConfig[] = [
  {
    type: "dropdown",
    label: "Agent",
    key: "agent",
    placeholder: "Select Agent",
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
    label: "Date Range",
    key: "dateRange",
  },
];

const leadRows: LeadRow[] = [
  {
    id: "lead-101",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    phone: "+91 98765 43210",
    source: "Website",
    agent: "Aisha Khan",
    stage: "New",
    lastActivity: "28 Mar, 09:10",
    nextAction: "Intro call at 2:30 PM",
    score: 82,
  },
  {
    id: "lead-102",
    name: "Sara Thompson",
    email: "sara.thompson@example.com",
    phone: "+91 98111 22334",
    source: "Referral",
    agent: "Rahul Verma",
    stage: "Contacted",
    lastActivity: "28 Mar, 08:15",
    nextAction: "Send course shortlist",
    score: 76,
  },
  {
    id: "lead-103",
    name: "Nihal Patel",
    email: "nihal.patel@example.com",
    phone: "+91 98222 33445",
    source: "Meta Ads",
    agent: "Priya Menon",
    stage: "Qualified",
    lastActivity: "27 Mar, 18:20",
    nextAction: "Document review",
    score: 91,
  },
  {
    id: "lead-104",
    name: "Mia Collins",
    email: "mia.collins@example.com",
    phone: "+91 98333 44556",
    source: "Walk-in",
    agent: "Aisha Khan",
    stage: "Proposal",
    lastActivity: "27 Mar, 16:05",
    nextAction: "Proposal follow-up",
    score: 69,
  },
  {
    id: "lead-105",
    name: "Dev Kapoor",
    email: "dev.kapoor@example.com",
    phone: "+91 98444 55667",
    source: "Website",
    agent: "Rahul Verma",
    stage: "Contacted",
    lastActivity: "27 Mar, 11:40",
    nextAction: "Counsellor callback",
    score: 73,
  },
  {
    id: "lead-106",
    name: "Elena Brooks",
    email: "elena.brooks@example.com",
    phone: "+91 98555 66778",
    source: "Referral",
    agent: "Priya Menon",
    stage: "Qualified",
    lastActivity: "26 Mar, 15:35",
    nextAction: "Application eligibility review",
    score: 88,
  },
];

function getStageKey(stage: string) {
  return stage.toLowerCase().replace(/\s+/g, "-");
}

export function LeadDashboardPage() {
  const { hasPermissions } = useAuth();
  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getDefaultFilterPanelValues(filterConfig),
  );
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const canCreateLeads = hasPermissions([PERMISSIONS.LEAD_CREATE]);

  const quickFilterTabs: LeadQuickFilterTab[] = quickFilterDefinitions.map((tab) => ({
    ...tab,
    count:
      tab.key === "all"
        ? leadRows.length
        : leadRows.filter((lead) => getStageKey(lead.stage) === tab.key).length,
  }));

  const filteredLeadRows =
    activeQuickFilter === "all"
      ? leadRows
      : leadRows.filter((lead) => getStageKey(lead.stage) === activeQuickFilter);
  const visibleLeadCount = filteredLeadRows.length;
  const paginationLabel =
    visibleLeadCount === 0
      ? "Showing 0 of 0 leads"
      : `Showing 1-${visibleLeadCount} of ${visibleLeadCount} leads`;

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
        height: {
          lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)`,
        },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              <GlobalSearchBar
                placeholder="Search leads..."
                sx={{ width: { xs: "100%", md: 280 } }}
                value={leadSearchQuery}
                onSearch={setLeadSearchQuery}
              />
              {canCreateLeads ? (
                <Button
                  component={RouterLink}
                  startIcon={<AddRounded />}
                  sx={{ minHeight: 44, px: 2.25, textTransform: "none" }}
                  to={leadRoutePaths.create}
                  variant="contained"
                >
                  Add Lead
                </Button>
              ) : null}
            </Stack>
          }
          title="Leads"
          subtitle=""
        />
      </Box>

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
            onFiltersChange={setFilterValues}
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
            onChange={setActiveQuickFilter}
          />
          <LeadTableContainer
            leads={filteredLeadRows}
            page={1}
            pageCount={1}
            paginationLabel={paginationLabel}
          />
        </Box>
      </Box>
    </Paper>
  );
}
