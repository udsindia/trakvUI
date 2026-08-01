import { ROLES, ROLE_LABELS, type RoleKey } from "@/config/roles/roles";
import type {
  DashboardKpiDto,
  DashboardQuickAction,
  DashboardWidgetVisibility,
} from "@/modules/dashboard/dashboard.types";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

const DASHBOARD_ROLE_PRIORITY: RoleKey[] = [
  ROLES.SUPER_ADMIN,
  ROLES.AGENCY_ADMIN,
  ROLES.MANAGER,
  ROLES.LEAD_MANAGER,
  ROLES.COUNSELLOR,
];

export function resolveDashboardRole(roles: string[]): RoleKey {
  // Role strings arrive from the backend upper-cased (e.g. "AGENCY_ADMIN") while
  // the ROLES constants are lower-cased ("agency_admin"), so compare case-insensitively —
  // otherwise every non-counsellor role silently falls through to the COUNSELLOR default.
  const normalized = roles.map((role) => role.toLowerCase());
  for (const role of DASHBOARD_ROLE_PRIORITY) {
    if (normalized.includes(role)) {
      return role;
    }
  }

  return ROLES.COUNSELLOR;
}

export function getDashboardRoleLabel(role: RoleKey): string {
  return ROLE_LABELS[role];
}

export function getDashboardGreeting(userName: string): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Good morning, ${userName}`;
  }

  if (hour < 17) {
    return `Good afternoon, ${userName}`;
  }

  return `Good evening, ${userName}`;
}

type RoleDashboardConfig = {
  attentionItems: DashboardAttentionItem[];
  kpis: DashboardKpiDto[];
  leadsScope: string;
  quickActions: DashboardQuickAction[];
  scopeNote: string;
  sectionTabs: DashboardSectionTab[];
  showUnassigned: boolean;
  subtitle: string;
  widgets: DashboardWidgetVisibility;
};

export type DashboardAttentionItem = {
  action: string;
  message: string;
  tone?: "danger" | "info" | "warning";
};

export type DashboardSectionTab = {
  badge?: string;
  id: string;
  label: string;
};

const ROLE_DASHBOARD_CONFIG: Record<RoleKey, RoleDashboardConfig> = {
  [ROLES.SUPER_ADMIN]: {
    subtitle: "Platform overview across all consultancies.",
    leadsScope: "All leads",
    scopeNote: 'Showing <strong style="color:#007A87">all</strong> data',
    showUnassigned: true,
    attentionItems: [],
    sectionTabs: [
      { id: "leads", label: "Leads" },
      { id: "applications", label: "Applications" },
      { id: "team", label: "Team" },
      { id: "activity", label: "Activity" },
    ],
    kpis: [],
    quickActions: [
      { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
      { icon: "💰", label: "View Commission", href: "#" },
      { icon: "✉️", label: "Invite Team", href: "/settings" },
      { icon: "📊", label: "View Reports", href: "#" },
    ],
    widgets: {
      applicationPipeline: true,
      leadPipeline: true,
      performance: true,
      recentActivities: true,
      weeklyActivity: true,
    },
  },
  [ROLES.AGENCY_ADMIN]: {
    subtitle: "Here's your business overview for today.",
    leadsScope: "All team leads",
    scopeNote: 'Showing <strong style="color:#007A87">team-wide</strong> data',
    showUnassigned: true,
    attentionItems: [],
    sectionTabs: [
      { id: "leads", label: "Leads" },
      { id: "applications", label: "Applications" },
      { id: "team", label: "Team" },
      { id: "activity", label: "Activity" },
    ],
    kpis: [],
    quickActions: [
      { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
      { icon: "💰", label: "View Commission", href: "#" },
      { icon: "📊", label: "View Reports", href: "#" },
      { icon: "✉️", label: "Invite Team", href: "/settings" },
    ],
    widgets: {
      applicationPipeline: true,
      leadPipeline: true,
      performance: true,
      recentActivities: true,
      weeklyActivity: true,
    },
  },
  [ROLES.LEAD_MANAGER]: {
    subtitle: "Lead pipeline and qualification overview.",
    leadsScope: "All leads",
    scopeNote: 'Showing <strong style="color:#007A87">all</strong> leads',
    showUnassigned: true,
    attentionItems: [],
    sectionTabs: [
      { id: "leads", label: "Leads" },
      { id: "activity", label: "Activity" },
    ],
    kpis: [],
    quickActions: [
      { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
      { icon: "🔁", label: "Assign Lead", href: leadRoutePaths.dashboard },
      { icon: "📝", label: "Log Activity", href: "/activities/feed" },
      { icon: "📥", label: "Import Leads", href: leadRoutePaths.dashboard },
    ],
    widgets: {
      applicationPipeline: false,
      leadPipeline: true,
      performance: true,
      recentActivities: true,
      weeklyActivity: true,
    },
  },
  [ROLES.MANAGER]: {
    subtitle: "Team overview and pipeline health.",
    leadsScope: "All team leads",
    scopeNote: 'Showing <strong style="color:#007A87">team-wide</strong> data',
    showUnassigned: true,
    attentionItems: [],
    sectionTabs: [
      { id: "leads", label: "Leads" },
      { id: "applications", label: "Applications" },
      { id: "team", label: "Team" },
      { id: "activity", label: "Activity" },
    ],
    kpis: [],
    quickActions: [
      { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
      { icon: "🔁", label: "Assign Lead", href: leadRoutePaths.dashboard },
      { icon: "📊", label: "View Reports", href: "#" },
      { icon: "👥", label: "View Team", href: "/settings" },
    ],
    widgets: {
      applicationPipeline: true,
      leadPipeline: true,
      performance: true,
      recentActivities: true,
      weeklyActivity: true,
    },
  },
  [ROLES.COUNSELLOR]: {
    subtitle: "Your leads and tasks for today.",
    leadsScope: "My assigned leads",
    scopeNote: 'Showing <strong style="color:#007A87">my assigned</strong> leads only',
    showUnassigned: false,
    attentionItems: [],
    sectionTabs: [
      { id: "leads", label: "My Leads" },
      { id: "applications", label: "My Applications" },
      { id: "activity", label: "Activity" },
    ],
    kpis: [],
    quickActions: [
      { icon: "➕", label: "Add Lead", href: leadRoutePaths.create },
      { icon: "📝", label: "Log Activity", href: "/activities/feed" },
      { icon: "🎓", label: "Add Application", href: applicationsRoutePaths.create },
      { icon: "📞", label: "Schedule Call", href: "/activities/tasks" },
    ],
    widgets: {
      applicationPipeline: true,
      leadPipeline: true,
      performance: true,
      recentActivities: true,
      weeklyActivity: true,
    },
  },
};

export function getRoleDashboardConfig(role: RoleKey): RoleDashboardConfig {
  return ROLE_DASHBOARD_CONFIG[role];
}
