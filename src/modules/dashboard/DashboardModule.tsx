import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AddRounded,
  AssignmentLateRounded,
  CheckCircleRounded,
  EventNoteRounded,
  GroupsRounded,
  InsightsRounded,
  PersonAddAltRounded,
  RefreshRounded,
  SchoolRounded,
  TrendingUpRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { ROLES } from "@/config/roles/roles";
import { dashboardService } from "@/modules/dashboard/dashboardService";
import type {
  DashboardApplicationDto,
  DashboardDataSource,
  DashboardLeadDto,
  DashboardTaskDto,
} from "@/modules/dashboard/dashboard.types";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

const LIVE_REFRESH_MS = 30_000;

type KpiCard = {
  helper: string;
  icon: typeof TrendingUpRounded;
  intent: "primary" | "success" | "warning" | "info";
  label: string;
  value: string;
};

type ActionPoint = {
  actionLabel: string;
  description: string;
  href: string;
  icon: typeof WarningAmberRounded;
  severity: "high" | "medium" | "low";
  title: string;
};

function isSameOwner(ownerId: string | undefined, ownerName: string | undefined, userId = "", userName = "") {
  return Boolean(
    (ownerId && userId && ownerId === userId) ||
      (ownerName && userName && ownerName.toLowerCase() === userName.toLowerCase()),
  );
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isPastDate(value: string) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);

  return date.getTime() < Date.now();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function stageCount(applications: DashboardApplicationDto[], stage: DashboardApplicationDto["stage"]) {
  return applications.filter((application) => application.stage === stage).length;
}

function getTaskCounts(tasks: DashboardTaskDto[]) {
  return {
    completed: tasks.filter((task) => task.status === "DONE").length,
    dueToday: tasks.filter((task) => isToday(task.dueDate)).length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    overdue: tasks.filter((task) => task.status !== "DONE" && isPastDate(task.dueDate)).length,
    open: tasks.filter((task) => task.status !== "DONE").length,
  };
}

function getSourceLabel(source: DashboardDataSource | undefined, isLoading: boolean) {
  if (isLoading) return "Syncing";
  return source === "live" ? "Live API" : "Mock service";
}

function KpiCardView({ helper, icon: Icon, intent, label, value }: KpiCard) {
  const colors = {
    info: { bg: "#eef7ff", fg: "#0f5ad4" },
    primary: { bg: "#eef4ff", fg: "#174ea6" },
    success: { bg: "#eaf7f1", fg: "#00796b" },
    warning: { bg: "#fff7e6", fg: "#b26a00" },
  }[intent];

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e4ebf3",
        borderRadius: 1,
        minHeight: 142,
        p: 2.25,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: colors.bg,
              borderRadius: 1,
              color: colors.fg,
              display: "flex",
              height: 42,
              justifyContent: "center",
              width: 42,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography color="text.secondary" variant="caption">
            Now
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1 }} variant="h4">
            {value}
          </Typography>
          <Typography sx={{ fontWeight: 700 }} variant="body1">
            {label}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {helper}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function ActionPointCard({ point }: { point: ActionPoint }) {
  const severityColor = point.severity === "high" ? "error" : point.severity === "medium" ? "warning" : "default";
  const Icon = point.icon;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e4ebf3",
        borderRadius: 1,
        p: 2,
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "#f8fafc",
            border: "1px solid",
            borderColor: "#e4ebf3",
            borderRadius: 1,
            display: "flex",
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <Icon color={point.severity === "high" ? "error" : "primary"} fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
              {point.title}
            </Typography>
            <Chip color={severityColor} label={point.severity} size="small" />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {point.description}
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          size="small"
          sx={{ alignSelf: { xs: "stretch", sm: "center" }, textTransform: "none" }}
          to={point.href}
          variant="outlined"
        >
          {point.actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function DashboardModule() {
  const { roles, user } = useAuth();
  const isAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.TENANT_ADMIN);
  const isApplicationManager = roles.includes(ROLES.APPLICATION_MANAGER);
  const isActivityManager = roles.includes(ROLES.ACTIVITY_MANAGER);
  const isAnalyst = roles.includes(ROLES.ANALYST);

  const leadsQuery = useQuery({
    queryKey: ["dashboard", "leads"],
    queryFn: dashboardService.getLeads,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const applicationsQuery = useQuery({
    queryKey: ["dashboard", "applications"],
    queryFn: dashboardService.getApplications,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const tasksQuery = useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: dashboardService.getTasks,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const taskSummaryQuery = useQuery({
    queryKey: ["dashboard", "task-summary"],
    queryFn: dashboardService.getTaskSummary,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
  const activityFeedQuery = useQuery({
    queryKey: ["dashboard", "activity-feed"],
    queryFn: dashboardService.getActivityFeed,
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });

  const dashboardLeads = leadsQuery.data?.data ?? [];
  const dashboardApplications = applicationsQuery.data?.data ?? [];
  const dashboardTasks = tasksQuery.data?.data ?? [];
  const dashboardActivities = activityFeedQuery.data?.data ?? [];

  const userLeads = useMemo(
    () =>
      isAdmin
        ? dashboardLeads
        : dashboardLeads.filter((lead) =>
            isSameOwner(lead.assignedTo?.id, lead.assignedTo?.name, user?.id, user?.name),
          ),
    [dashboardLeads, isAdmin, user?.id, user?.name],
  );
  const userTasks = useMemo(
    () =>
      isAdmin
        ? dashboardTasks
        : dashboardTasks.filter((task) =>
            isSameOwner(task.assignedTo?.id, task.assignedTo?.name, user?.id, user?.name),
          ),
    [dashboardTasks, isAdmin, user?.id, user?.name],
  );
  const userActivities = useMemo(
    () =>
      isAdmin
        ? dashboardActivities
        : dashboardActivities.filter((activity) =>
            isSameOwner(activity.actor?.id, activity.actor?.name, user?.id, user?.name),
          ),
    [dashboardActivities, isAdmin, user?.id, user?.name],
  );

  const leadPool = isAdmin ? dashboardLeads : userLeads;
  const applicationPool = dashboardApplications;
  const taskPool = isAdmin ? dashboardTasks : userTasks;
  const activityPool = isAdmin ? dashboardActivities : userActivities;
  const taskCounts = getTaskCounts(taskPool);
  const taskSummary = taskSummaryQuery.data?.data;
  const overdueTasks = taskSummary?.overdue ?? taskCounts.overdue;
  const dueTodayTasks = taskSummary?.dueToday ?? taskCounts.dueToday;
  const openTasks = taskSummary?.pending ?? taskCounts.open;
  const conversionRate = percent(stageCount(applicationPool, "Visa Approved"), leadPool.length);
  const activeApplications = applicationPool.filter((application) =>
    ["Submitted", "Processing", "Visa Applied"].includes(application.stage),
  ).length;

  const kpis = useMemo<KpiCard[]>(() => {
    if (isAdmin) {
      return [
        {
          helper: `${formatNumber(leadPool.filter((lead) => lead.leadStage === "New").length)} new leads in queue`,
          icon: GroupsRounded,
          intent: "primary",
          label: "Total leads",
          value: formatNumber(leadPool.length),
        },
        {
          helper: `${formatNumber(activeApplications)} active files needing coordination`,
          icon: SchoolRounded,
          intent: "info",
          label: "Applications",
          value: formatNumber(applicationPool.length),
        },
        {
          helper: `${formatNumber(overdueTasks)} overdue and ${formatNumber(dueTodayTasks)} due today`,
          icon: AssignmentLateRounded,
          intent: overdueTasks ? "warning" : "success",
          label: "Open tasks",
          value: formatNumber(openTasks),
        },
        {
          helper: "Visa approved applications compared with lead volume",
          icon: TrendingUpRounded,
          intent: "success",
          label: "Conversion proxy",
          value: `${conversionRate}%`,
        },
      ];
    }

    if (isApplicationManager) {
      return [
        {
          helper: "Submitted, processing, and visa-applied applications",
          icon: SchoolRounded,
          intent: "primary",
          label: "Active applications",
          value: formatNumber(activeApplications),
        },
        {
          helper: "Visa files currently waiting on external movement",
          icon: EventNoteRounded,
          intent: "info",
          label: "Visa applied",
          value: formatNumber(stageCount(applicationPool, "Visa Applied")),
        },
        {
          helper: "Approved applications ready for completion",
          icon: CheckCircleRounded,
          intent: "success",
          label: "Visa approved",
          value: formatNumber(stageCount(applicationPool, "Visa Approved")),
        },
        {
          helper: "Rejected applications that may need review",
          icon: WarningAmberRounded,
          intent: "warning",
          label: "Rejected",
          value: formatNumber(stageCount(applicationPool, "Visa Rejected")),
        },
      ];
    }

    if (isActivityManager) {
      return [
        {
          helper: "All non-completed tasks currently visible",
          icon: AssignmentLateRounded,
          intent: "primary",
          label: "Open tasks",
          value: formatNumber(openTasks),
        },
        {
          helper: "Tasks that missed their target date",
          icon: WarningAmberRounded,
          intent: overdueTasks ? "warning" : "success",
          label: "Overdue",
          value: formatNumber(overdueTasks),
        },
        {
          helper: "Work already started by the team",
          icon: InsightsRounded,
          intent: "info",
          label: "In progress",
          value: formatNumber(taskCounts.inProgress),
        },
        {
          helper: "Activities recorded today",
          icon: EventNoteRounded,
          intent: "success",
          label: "Today activity",
          value: formatNumber(activityPool.filter((activity) => isToday(activity.occurredAt)).length),
        },
      ];
    }

    if (isAnalyst) {
      return [
        {
          helper: "Lead records available to analyze",
          icon: GroupsRounded,
          intent: "primary",
          label: "Lead volume",
          value: formatNumber(leadPool.length),
        },
        {
          helper: "Qualified leads compared with all visible leads",
          icon: TrendingUpRounded,
          intent: "success",
          label: "Qualification rate",
          value: `${percent(leadPool.filter((lead) => lead.leadStage === "Qualified").length, leadPool.length)}%`,
        },
        {
          helper: "Applications created from the pipeline",
          icon: SchoolRounded,
          intent: "info",
          label: "Applications",
          value: formatNumber(applicationPool.length),
        },
        {
          helper: "Approved applications compared with lead volume",
          icon: CheckCircleRounded,
          intent: "success",
          label: "Approval proxy",
          value: `${conversionRate}%`,
        },
      ];
    }

    return [
      {
        helper: "Leads assigned to the logged-in counsellor",
        icon: GroupsRounded,
        intent: "primary",
        label: "My leads",
        value: formatNumber(leadPool.length),
      },
      {
        helper: `${formatNumber(leadPool.filter((lead) => lead.score && lead.score >= 75).length)} high-intent leads`,
        icon: TrendingUpRounded,
        intent: "success",
        label: "Priority leads",
        value: formatNumber(leadPool.filter((lead) => lead.leadStage === "New").length),
      },
      {
        helper: `${formatNumber(overdueTasks)} overdue and ${formatNumber(dueTodayTasks)} due today`,
        icon: AssignmentLateRounded,
        intent: overdueTasks ? "warning" : "info",
        label: "My tasks",
        value: formatNumber(openTasks),
      },
      {
        helper: "Recent activity records linked to you",
        icon: EventNoteRounded,
        intent: "info",
        label: "Activities",
        value: formatNumber(activityPool.length),
      },
    ];
  }, [
    activeApplications,
    activityPool,
    applicationPool,
    conversionRate,
    dueTodayTasks,
    isActivityManager,
    isAdmin,
    isAnalyst,
    isApplicationManager,
    leadPool,
    openTasks,
    overdueTasks,
    taskCounts.inProgress,
  ]);

  const actionPoints = useMemo<ActionPoint[]>(() => {
    const points: ActionPoint[] = [];
    const highScoreNewLeads = leadPool.filter((lead) => lead.leadStage === "New" && (lead.score ?? 0) >= 75);
    const staleLeads = leadPool.filter((lead) => !lead.lastActivityAt || isPastDate(lead.lastActivityAt));
    const rejectedApps = applicationPool.filter((application) => application.stage === "Visa Rejected");

    if (overdueTasks > 0) {
      points.push({
        actionLabel: "Open tasks",
        description: `${formatNumber(overdueTasks)} task${overdueTasks === 1 ? "" : "s"} need immediate follow-up.`,
        href: "/activities/tasks",
        icon: AssignmentLateRounded,
        severity: "high",
        title: "Overdue work",
      });
    }

    if (highScoreNewLeads.length > 0) {
      points.push({
        actionLabel: "Review leads",
        description: `${formatNumber(highScoreNewLeads.length)} high-score new lead${highScoreNewLeads.length === 1 ? "" : "s"} are ready for assignment or contact.`,
        href: leadRoutePaths.dashboard,
        icon: PersonAddAltRounded,
        severity: "medium",
        title: "High-intent leads",
      });
    }

    if (rejectedApps.length > 0) {
      points.push({
        actionLabel: "Review applications",
        description: `${formatNumber(rejectedApps.length)} rejected application${rejectedApps.length === 1 ? "" : "s"} should be reviewed for next steps.`,
        href: applicationsRoutePaths.dashboard,
        icon: WarningAmberRounded,
        severity: "high",
        title: "Visa rejection review",
      });
    }

    if (staleLeads.length > 0) {
      points.push({
        actionLabel: "Plan outreach",
        description: `${formatNumber(staleLeads.length)} visible lead${staleLeads.length === 1 ? "" : "s"} have no recent activity.`,
        href: "/activities/feed",
        icon: EventNoteRounded,
        severity: "low",
        title: "Follow-up gap",
      });
    }

    return points.slice(0, 4);
  }, [applicationPool, leadPool, overdueTasks]);

  const isLoading =
    leadsQuery.isLoading ||
    applicationsQuery.isLoading ||
    tasksQuery.isLoading ||
    activityFeedQuery.isLoading;
  const hasMockFallback =
    leadsQuery.data?.source === "mock" ||
    applicationsQuery.data?.source === "mock" ||
    tasksQuery.data?.source === "mock" ||
    activityFeedQuery.data?.source === "mock";
  const liveSourceCount = [
    leadsQuery.data?.source,
    applicationsQuery.data?.source,
    tasksQuery.data?.source,
    activityFeedQuery.data?.source,
  ].filter((source) => source === "live").length;

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "#e4ebf3",
          borderRadius: 1,
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 800 }} variant="h4">
                Dashboard
              </Typography>
              <Chip
                color={hasMockFallback ? "warning" : "success"}
                label={`${liveSourceCount}/4 live sources`}
                size="small"
              />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Role-aware KPIs for {user?.name ?? "the logged-in user"} refreshed through dashboard services every 30 seconds.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            {isAdmin ? (
              <>
                <Button
                  component={RouterLink}
                  startIcon={<AddRounded />}
                  sx={{ textTransform: "none" }}
                  to={leadRoutePaths.create}
                  variant="contained"
                >
                  Add Lead
                </Button>
                <Button
                  component={RouterLink}
                  startIcon={<SchoolRounded />}
                  sx={{ textTransform: "none" }}
                  to={applicationsRoutePaths.create}
                  variant="outlined"
                >
                  Add Application
                </Button>
              </>
            ) : null}
            <Button
              component={RouterLink}
              startIcon={<AssignmentLateRounded />}
              sx={{ textTransform: "none" }}
              to="/activities/tasks"
              variant={isAdmin ? "outlined" : "contained"}
            >
              Tasks
            </Button>
          </Stack>
        </Stack>

        {isLoading ? (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
          </Box>
        ) : null}
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {kpis.map((kpi) => (
          <KpiCardView key={kpi.label} {...kpi} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "#e4ebf3",
            borderRadius: 1,
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  {isAdmin ? "Admin Action Points" : "My Action Points"}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Prioritized from leads, tasks, and applications visible to this user.
                </Typography>
              </Box>
              <Chip
                icon={<RefreshRounded />}
                label={hasMockFallback ? "Mock service" : "Live API"}
                size="small"
                variant="outlined"
              />
            </Stack>

            {actionPoints.length ? (
              <Stack spacing={1.5}>
                {actionPoints.map((point) => (
                  <ActionPointCard key={point.title} point={point} />
                ))}
              </Stack>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  border: "1px dashed",
                  borderColor: "#d9e2ec",
                  borderRadius: 1,
                  p: 3,
                  textAlign: "center",
                }}
              >
                <CheckCircleRounded color="success" />
                <Typography sx={{ fontWeight: 700, mt: 1 }} variant="subtitle1">
                  No urgent action points
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  New items will appear here as live data changes.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "#e4ebf3",
            borderRadius: 1,
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 800 }} variant="h6">
                Operational Pulse
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Service-backed dashboard feeds; currently mock until backend endpoints are connected.
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={1.75}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography color="text.secondary" variant="body2">
                  Leads source
                </Typography>
                <Chip label={getSourceLabel(leadsQuery.data?.source, leadsQuery.isLoading)} size="small" />
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography color="text.secondary" variant="body2">
                  Applications source
                </Typography>
                <Chip
                  label={getSourceLabel(applicationsQuery.data?.source, applicationsQuery.isLoading)}
                  size="small"
                />
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography color="text.secondary" variant="body2">
                  Tasks source
                </Typography>
                <Chip label={getSourceLabel(tasksQuery.data?.source, tasksQuery.isLoading)} size="small" />
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography color="text.secondary" variant="body2">
                  Activity source
                </Typography>
                <Chip
                  label={getSourceLabel(activityFeedQuery.data?.source, activityFeedQuery.isLoading)}
                  size="small"
                />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.5}>
              {activityPool.slice(0, 4).map((activity) => (
                <Stack key={activity.id} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      bgcolor: "#eef4ff",
                      borderRadius: 1,
                      color: "primary.main",
                      display: "flex",
                      height: 32,
                      justifyContent: "center",
                      pt: 0.75,
                      width: 32,
                    }}
                  >
                    <EventNoteRounded fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {activity.title}
                    </Typography>
                    <Typography color="text.secondary" noWrap variant="caption">
                      {activity.actor?.name ?? "Unassigned"} ·{" "}
                      {new Date(activity.occurredAt).toLocaleString("en-IN")}
                    </Typography>
                  </Box>
                </Stack>
              ))}
              {activityPool.length === 0 ? (
                <Stack sx={{ alignItems: "center", py: 2 }}>
                  <CircularProgress size={22} />
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}
