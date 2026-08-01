import { ROLE_LABELS, ROLES, type RoleKey } from "@/config/roles/roles";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import type {
  BackendDashboardResponse,
  DashboardKpiCardKey,
  DashboardQuickActionKey,
  DashboardSectionKey,
} from "@/modules/dashboard/dashboardApi";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { fromBackendLeadStage } from "@/modules/lead/leadStageMappers";
import type { DashboardPeriod } from "@/modules/dashboard/dashboardDateRange";
import type {
  DashboardActivityChartPointDto,
  DashboardApplicationPipelineDto,
  DashboardKpiDto,
  DashboardLeadPipelineDto,
  DashboardPerformanceMetricDto,
  DashboardQuickAction,
  DashboardWidgetVisibility,
} from "@/modules/dashboard/dashboard.types";

// Colours only — the label is resolved through the shared `fromBackendLeadStage`
// mapper (see mapDashboardResponse) so the dashboard and the leads page can never
// drift on stage wording again (e.g. "Proposal" vs "Proposal Sent"). Keys mirror
// the leads vocabulary in leadStageMappers.
const LEAD_STAGE_CONFIG: Record<string, { color: string; label: string }> = {
  NEW: { label: "New", color: "#4f46e5" },
  CONTACTED: { label: "Contacted", color: "#7c3aed" },
  QUALIFIED: { label: "Qualified", color: "#ec4899" },
  PROPOSAL_SENT: { label: "Proposal", color: "#f59e0b" },
  NEGOTIATION: { label: "Negotiation", color: "#d97706" },
  CONVERTED: { label: "Converted", color: "#10b981" },
  LOST: { label: "Lost", color: "#94a3b8" },
  ARCHIVED: { label: "Archived", color: "#64748b" },
};

const APPLICATION_STAGE_CONFIG: Record<string, { color: string; label: string }> = {
  DOC_CHECK: { label: "Doc Check", color: "#818cf8" },
  APPLIED: { label: "Applied", color: "#6366f1" },
  OFFER: { label: "Offer", color: "#4f46e5" },
  VISA: { label: "Visa", color: "#4338ca" },
  ENROLLED: { label: "Enrolled", color: "#10b981" },
  PROCESSING: { label: "Processing", color: "#6366f1" },
  VISA_APPLIED: { label: "Visa Applied", color: "#4338ca" },
  VISA_APPROVED: { label: "Visa Approved", color: "#10b981" },
};

const PERFORMANCE_COLORS = ["#0f5ad4", "#10b981", "#f59e0b", "#7c3aed", "#ef4444"];

const TEMPLATE_ROLE_LABELS: Record<string, string> = {
  AGENCY_ADMIN: ROLE_LABELS[ROLES.AGENCY_ADMIN],
  SUPER_ADMIN: ROLE_LABELS[ROLES.SUPER_ADMIN],
  MANAGER: ROLE_LABELS[ROLES.MANAGER],
  LEAD_MANAGER: ROLE_LABELS[ROLES.LEAD_MANAGER],
  COUNSELLOR: ROLE_LABELS[ROLES.COUNSELLOR],
};

const QUICK_ACTION_CONFIG: Record<DashboardQuickActionKey, DashboardQuickAction> = {
  ADD_LEAD: { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
  VIEW_COMMISSION: { icon: "💰", label: "View Commission", href: "#" },
  VIEW_REPORTS: { icon: "📊", label: "View Reports", href: "#" },
  INVITE_TEAM: { icon: "✉️", label: "Invite Team", href: "/settings" },
  NEW_APPLICATION: { icon: "➕", label: "New Application", href: applicationsRoutePaths.create },
  DOC_CHECK_QUEUE: { icon: "📄", label: "Doc Check Queue", href: applicationsRoutePaths.dashboard },
  VISA_TRACKER: { icon: "🛂", label: "Visa Tracker", href: applicationsRoutePaths.dashboard },
  ASSIGN_LEAD: { icon: "🔁", label: "Assign Lead", href: leadRoutePaths.dashboard },
  LOG_ACTIVITY: { icon: "📝", label: "Log Activity", href: "/activities/feed" },
  IMPORT_LEADS: { icon: "📥", label: "Import Leads", href: leadRoutePaths.dashboard },
  VIEW_TEAM: { icon: "👥", label: "View Team", href: "/settings" },
  ADD_APPLICATION: { icon: "🎓", label: "Add Application", href: applicationsRoutePaths.create },
  SCHEDULE_CALL: { icon: "📞", label: "Schedule Call", href: "/activities/tasks" },
};

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCount(value: number) {
  return String(value);
}

function formatCurrency(value: number) {
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(2)}L`;
  }

  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

function mapPipelineStage(stage: string, config: Record<string, { color: string; label: string }>) {
  const normalized = stage.toUpperCase();
  const match = config[normalized];

  return {
    color: match?.color ?? "#64748b",
    count: 0,
    label: match?.label ?? titleCase(stage),
  };
}

/**
 * Sub-label for period-scoped KPIs (New Leads, Revenue) so the caption tracks the
 * selected period instead of a fixed timeframe — otherwise "New Leads … Today"
 * shows while viewing the Quarter, and "Revenue … Month to date" while viewing the Week.
 */
const PERIOD_DELTA_LABEL: Record<DashboardPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
};

function buildKpiCard(
  key: DashboardKpiCardKey,
  kpi: BackendDashboardResponse["kpi"],
  period: DashboardPeriod,
): DashboardKpiDto {
  const periodLabel = PERIOD_DELTA_LABEL[period];
  switch (key) {
    case "REVENUE_RECEIVED":
      return {
        accent: "purple",
        delta: periodLabel,
        deltaTone: "flat",
        icon: "💰",
        label: "Revenue",
        value: kpi.revenueReceived != null ? formatCurrency(kpi.revenueReceived) : "—",
      };
    case "NEW_LEADS":
      return {
        accent: "blue",
        delta: periodLabel,
        deltaTone: "flat",
        icon: "👤",
        label: "New Leads",
        value: formatCount(kpi.newLeads ?? 0),
      };
    case "OVERDUE_TASKS":
      return {
        accent: "red",
        delta: (kpi.overdueTasks ?? 0) > 0 ? "Needs attention" : "All caught up",
        deltaTone: (kpi.overdueTasks ?? 0) > 0 ? "down" : "up",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: formatCount(kpi.overdueTasks ?? 0),
      };
    case "CONVERSION_RATE":
      return {
        accent: "green",
        delta: "Lead to enrolment",
        deltaTone: "flat",
        icon: "📈",
        label: "Conversion Rate",
        value: formatPercent(kpi.conversionRate ?? 0),
      };
    case "ACTIVE_APPLICATIONS":
      return {
        accent: "blue",
        delta: "In progress",
        deltaTone: "flat",
        icon: "📄",
        label: "Active Applications",
        value: "—",
      };
    case "COMMISSION_PENDING":
      return {
        accent: "orange",
        delta: "Pending payout",
        deltaTone: "flat",
        icon: "💸",
        label: "Commission Pending",
        value: "—",
      };
    case "ACTIVE_STUDENTS":
      return {
        accent: "green",
        delta: "Current portfolio",
        deltaTone: "flat",
        icon: "🎓",
        label: "Active Students",
        value: kpi.activeStudents != null ? formatCount(kpi.activeStudents) : "—",
      };
    case "TASKS_DUE_TODAY":
      return {
        accent: "orange",
        delta: "Due today",
        deltaTone: "flat",
        icon: "📋",
        label: "Tasks Due Today",
        value: "—",
      };
    default:
      return {
        accent: "blue",
        delta: "",
        deltaTone: "flat",
        icon: "📊",
        label: titleCase(key),
        value: "—",
      };
  }
}

export interface DashboardViewModel {
  activityChart?: {
    label: string;
    points: DashboardActivityChartPointDto[];
  };
  applicationPipeline?: DashboardApplicationPipelineDto;
  greeting: string;
  kpis: DashboardKpiDto[];
  leadPipeline?: DashboardLeadPipelineDto;
  performance?: DashboardPerformanceMetricDto[];
  quickActions: DashboardQuickAction[];
  roleLabel: string;
  sectionOrder: DashboardSectionKey[];
  widgets: DashboardWidgetVisibility;
}

export function mapDashboardResponse(
  response: BackendDashboardResponse,
  period: DashboardPeriod,
): DashboardViewModel {
  const { capabilities, kpi } = response;
  const sectionOrder = response.sectionOrder?.length
    ? response.sectionOrder
    : capabilities.sectionOrder;

  const kpiCards = capabilities.kpiCards?.length ? capabilities.kpiCards : [];
  const quickActionKeys = response.quickActions?.length
    ? response.quickActions
    : capabilities.quickActions;

  const widgets: DashboardWidgetVisibility = {
    applicationPipeline:
      capabilities.pipeline?.applications !== false &&
      sectionOrder.includes("applicationPipeline"),
    leadPipeline: capabilities.pipeline?.leads !== false && sectionOrder.includes("leadPipeline"),
    performance: sectionOrder.includes("performance"),
    recentActivities: sectionOrder.includes("recentActivities"),
    weeklyActivity: sectionOrder.includes("activityChart"),
  };

  const leadStages = response.leadPipeline.stages.map((stage) => ({
    ...mapPipelineStage(stage.stage, LEAD_STAGE_CONFIG),
    // Label comes from the shared leads mapper so wording stays identical across pages.
    label: fromBackendLeadStage(stage.stage),
    count: stage.count,
  }));

  const applicationStages = response.applicationPipeline.stages.map((stage) => ({
    ...mapPipelineStage(stage.stage, APPLICATION_STAGE_CONFIG),
    count: stage.count,
  }));

  return {
    greeting: `${capabilities.greeting}, ${capabilities.userName}`,
    roleLabel: TEMPLATE_ROLE_LABELS[capabilities.templateName] ?? titleCase(capabilities.templateName),
    quickActions: quickActionKeys
      .map((key) => QUICK_ACTION_CONFIG[key])
      .filter((action): action is DashboardQuickAction => Boolean(action)),
    kpis: kpiCards.map((key) => buildKpiCard(key, kpi, period)),
    sectionOrder,
    widgets,
    leadPipeline: widgets.leadPipeline
      ? {
          stages: leadStages,
          total: leadStages.reduce((sum, stage) => sum + stage.count, 0),
        }
      : undefined,
    applicationPipeline: widgets.applicationPipeline
      ? {
          stages: applicationStages,
          total: response.applicationPipeline.totalActive,
        }
      : undefined,
    activityChart: widgets.weeklyActivity
      ? {
          label: response.activityChart.label,
          points: response.activityChart.weeks.map((week) => ({
            activities: week.activities,
            label: week.label,
            tasks: week.tasks,
          })),
        }
      : undefined,
    performance: widgets.performance
      ? response.performance.metrics.map((metric, index) => ({
          color: PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length],
          label: metric.label,
          unit: metric.unit,
          value: metric.value,
        }))
      : undefined,
  };
}

export function getRoleLabelForRole(role: RoleKey): string {
  return ROLE_LABELS[role];
}
