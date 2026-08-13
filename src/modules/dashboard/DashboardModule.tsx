import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, LinearProgress, Stack } from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import { DashboardAttentionStrip } from "@/modules/dashboard/components/DashboardAttentionStrip";
import { DashboardHeader } from "@/modules/dashboard/components/DashboardHeader";
import { DashboardKpiGrid } from "@/modules/dashboard/components/DashboardKpiGrid";
import { DashboardSectionTabs } from "@/modules/dashboard/components/DashboardSectionTabs";
import { DashboardActivitySection } from "@/modules/dashboard/components/sections/DashboardActivitySection";
import { DashboardApplicationsSection } from "@/modules/dashboard/components/sections/DashboardApplicationsSection";
import { DashboardLeadsSection } from "@/modules/dashboard/components/sections/DashboardLeadsSection";
import { DashboardTeamSection } from "@/modules/dashboard/components/sections/DashboardTeamSection";
import {
  getRoleDashboardConfig,
  resolveDashboardRole,
} from "@/modules/dashboard/dashboardRoleConfig";
import type { DashboardPeriod } from "@/modules/dashboard/dashboardDateRange";
import { getDashboardDateRange } from "@/modules/dashboard/dashboardDateRange";
import { dashboardService } from "@/modules/dashboard/dashboardService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const LIVE_REFRESH_MS = 30_000;

export default function DashboardModule() {
  const { roles, tenant } = useAuth();
  const dashboardRole = useMemo(() => resolveDashboardRole(roles), [roles]);
  const roleConfig = useMemo(() => getRoleDashboardConfig(dashboardRole), [dashboardRole]);
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [activeSection, setActiveSection] = useState(roleConfig.sectionTabs[0]?.id ?? "leads");
  const dateRange = useMemo(() => getDashboardDateRange(period), [period]);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", dateRange.fromDate, dateRange.toDate],
    queryFn: () => dashboardService.getDashboard(period),
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });

  const dashboard = dashboardQuery.data?.data;
  const kpis = dashboard?.kpis ?? roleConfig.kpis;
  const greeting = dashboard?.greeting ?? "Welcome";
  const sectionTabs = roleConfig.sectionTabs;
  const currentSection = sectionTabs.some((tab) => tab.id === activeSection)
    ? activeSection
    : sectionTabs[0]?.id ?? "leads";

  return (
    <Stack spacing={1} sx={{ display: "flex", flexDirection: "column", gap: 1, minHeight: 0 }}>
      {dashboardQuery.isLoading ? <LinearProgress /> : null}

      {dashboardQuery.isError ? (
        <Alert severity="warning">
          {getApiErrorMessage(dashboardQuery.error, "Unable to load dashboard data. Showing defaults.")}
        </Alert>
      ) : null}

      <DashboardHeader
        greeting={greeting}
        period={period}
        subtitle={roleConfig.subtitle}
        onPeriodChange={setPeriod}
      />

      <DashboardKpiGrid kpis={kpis} />

      <DashboardAttentionStrip items={roleConfig.attentionItems} />

      <DashboardSectionTabs
        activeSection={currentSection}
        scopeNote={roleConfig.scopeNote}
        tabs={sectionTabs}
        onSectionChange={setActiveSection}
      />

      <Box sx={{ flex: 1, minHeight: { xs: 480, lg: 520 } }}>
        {currentSection === "leads" ? (
          <DashboardLeadsSection
            leadsScope={roleConfig.leadsScope}
            performance={dashboard?.performance}
            pipeline={dashboard?.leadPipeline}
            showUnassigned={roleConfig.showUnassigned}
          />
        ) : null}
        {currentSection === "applications" ? (
          <DashboardApplicationsSection pipeline={dashboard?.applicationPipeline} />
        ) : null}
        {currentSection === "team" ? <DashboardTeamSection /> : null}
        {currentSection === "activity" || currentSection === "tasks" ? (
          <DashboardActivitySection />
        ) : null}
      </Box>
    </Stack>
  );
}
