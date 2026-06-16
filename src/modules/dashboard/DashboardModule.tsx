import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import {
  PerformanceCard,
  WeeklyActivityCard,
} from "@/modules/dashboard/components/DashboardChartsSection";
import { DashboardGreeting } from "@/modules/dashboard/components/DashboardGreeting";
import { DashboardKpiGrid } from "@/modules/dashboard/components/DashboardKpiGrid";
import {
  ApplicationPipelineCard,
  LeadPipelineCard,
} from "@/modules/dashboard/components/DashboardPipelineCards";
import { RecentActivitiesCard } from "@/modules/dashboard/components/RecentActivitiesCard";
import {
  getDashboardGreeting,
  getDashboardRoleLabel,
  getRoleDashboardConfig,
  resolveDashboardRole,
} from "@/modules/dashboard/dashboardRoleConfig";
import { dashboardService } from "@/modules/dashboard/dashboardService";

const LIVE_REFRESH_MS = 30_000;

export default function DashboardModule() {
  const { roles, tenant, user } = useAuth();
  const dashboardRole = useMemo(() => resolveDashboardRole(roles), [roles]);
  const roleConfig = useMemo(() => getRoleDashboardConfig(dashboardRole), [dashboardRole]);

  const kpisQuery = useQuery({
    queryKey: ["dashboard", "kpis", dashboardRole],
    queryFn: () => dashboardService.getKpis(dashboardRole),
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const leadPipelineQuery = useQuery({
    queryKey: ["dashboard", "lead-pipeline", dashboardRole],
    queryFn: () => dashboardService.getLeadPipeline(dashboardRole),
    enabled: roleConfig.widgets.leadPipeline,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const applicationPipelineQuery = useQuery({
    queryKey: ["dashboard", "application-pipeline", dashboardRole],
    queryFn: () => dashboardService.getApplicationPipeline(dashboardRole),
    enabled: roleConfig.widgets.applicationPipeline,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const activityChartQuery = useQuery({
    queryKey: ["dashboard", "activity-chart", dashboardRole],
    queryFn: () => dashboardService.getActivityChart(dashboardRole),
    enabled: roleConfig.widgets.weeklyActivity,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const performanceQuery = useQuery({
    queryKey: ["dashboard", "performance", dashboardRole],
    queryFn: () => dashboardService.getPerformanceMetrics(dashboardRole),
    enabled: roleConfig.widgets.performance,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const recentActivitiesQuery = useQuery({
    queryKey: ["dashboard", "recent-activities", dashboardRole],
    queryFn: () => dashboardService.getRecentActivities(dashboardRole),
    enabled: roleConfig.widgets.recentActivities,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });

  const isLoading =
    kpisQuery.isLoading ||
    (roleConfig.widgets.leadPipeline && leadPipelineQuery.isLoading) ||
    (roleConfig.widgets.applicationPipeline && applicationPipelineQuery.isLoading) ||
    (roleConfig.widgets.weeklyActivity && activityChartQuery.isLoading) ||
    (roleConfig.widgets.performance && performanceQuery.isLoading) ||
    (roleConfig.widgets.recentActivities && recentActivitiesQuery.isLoading);

  const kpis = kpisQuery.data?.data ?? roleConfig.kpis;
  const greeting = getDashboardGreeting(user?.name ?? "there");

  return (
    <Stack spacing={2.5}>
      {isLoading ? <LinearProgress /> : null}

      <DashboardGreeting
        greeting={greeting}
        quickActions={roleConfig.quickActions}
        roleLabel={getDashboardRoleLabel(dashboardRole)}
        subtitle={roleConfig.subtitle}
        tenantName={tenant?.tenantName}
      />

      <DashboardKpiGrid kpis={kpis} />

      {roleConfig.widgets.leadPipeline || roleConfig.widgets.applicationPipeline ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg:
                roleConfig.widgets.leadPipeline && roleConfig.widgets.applicationPipeline
                  ? "repeat(2, minmax(0, 1fr))"
                  : "1fr",
            },
          }}
        >
          {roleConfig.widgets.leadPipeline && leadPipelineQuery.data?.data ? (
            <LeadPipelineCard pipeline={leadPipelineQuery.data.data} />
          ) : null}
          {roleConfig.widgets.applicationPipeline && applicationPipelineQuery.data?.data ? (
            <ApplicationPipelineCard pipeline={applicationPipelineQuery.data.data} />
          ) : null}
        </Box>
      ) : null}

      {roleConfig.widgets.weeklyActivity || roleConfig.widgets.performance ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg:
                roleConfig.widgets.weeklyActivity && roleConfig.widgets.performance
                  ? "repeat(2, minmax(0, 1fr))"
                  : "1fr",
            },
          }}
        >
          {roleConfig.widgets.weeklyActivity && activityChartQuery.data?.data ? (
            <WeeklyActivityCard points={activityChartQuery.data.data} />
          ) : null}
          {roleConfig.widgets.performance && performanceQuery.data?.data ? (
            <PerformanceCard metrics={performanceQuery.data.data} />
          ) : null}
        </Box>
      ) : null}

      {roleConfig.widgets.recentActivities && recentActivitiesQuery.data?.data ? (
        <RecentActivitiesCard activities={recentActivitiesQuery.data.data} />
      ) : null}
    </Stack>
  );
}
