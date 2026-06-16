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
  ROLES.APPLICATION_MANAGER,
  ROLES.ACTIVITY_MANAGER,
  ROLES.ANALYST,
  ROLES.COUNSELLOR,
];

export function resolveDashboardRole(roles: string[]): RoleKey {
  for (const role of DASHBOARD_ROLE_PRIORITY) {
    if (roles.includes(role)) {
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
  kpis: DashboardKpiDto[];
  quickActions: DashboardQuickAction[];
  subtitle: string;
  widgets: DashboardWidgetVisibility;
};

const ROLE_DASHBOARD_CONFIG: Record<RoleKey, RoleDashboardConfig> = {
  [ROLES.SUPER_ADMIN]: {
    subtitle: "Platform-wide overview across all agencies on Trakv.",
    kpis: [
      {
        accent: "blue",
        delta: "↑ 8 from Meta Ads",
        deltaTone: "up",
        icon: "👤",
        label: "New Leads Today",
        value: "23",
      },
      {
        accent: "green",
        delta: "Across all tenants",
        deltaTone: "flat",
        icon: "🎓",
        label: "Active Students",
        value: "142",
      },
      {
        accent: "red",
        delta: "Needs attention",
        deltaTone: "down",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: "5",
      },
      {
        accent: "orange",
        delta: "Pending payout",
        deltaTone: "flat",
        icon: "💸",
        label: "Commission Pending",
        value: "₹32K",
      },
    ],
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
    subtitle: "Here's what's happening at your agency today.",
    kpis: [
      {
        accent: "purple",
        delta: "↑ 12% vs last month",
        deltaTone: "up",
        icon: "💰",
        label: "Revenue (MTD)",
        value: "₹4.85L",
      },
      {
        accent: "blue",
        delta: "↑ 8 from Meta Ads",
        deltaTone: "up",
        icon: "👤",
        label: "New Leads Today",
        value: "23",
      },
      {
        accent: "red",
        delta: "Needs attention",
        deltaTone: "down",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: "5",
      },
      {
        accent: "green",
        delta: "↑ 2.1% this month",
        deltaTone: "up",
        icon: "📈",
        label: "Conversion Rate",
        value: "18.4%",
      },
    ],
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
  [ROLES.APPLICATION_MANAGER]: {
    subtitle: "Track application progress from document check to enrolment.",
    kpis: [
      {
        accent: "blue",
        delta: "Submitted, processing, visa applied",
        deltaTone: "flat",
        icon: "📄",
        label: "Active Applications",
        value: "58",
      },
      {
        accent: "orange",
        delta: "Awaiting university response",
        deltaTone: "flat",
        icon: "🏫",
        label: "Doc Check",
        value: "22",
      },
      {
        accent: "green",
        delta: "Ready for visa filing",
        deltaTone: "up",
        icon: "✅",
        label: "Offers Received",
        value: "10",
      },
      {
        accent: "purple",
        delta: "In visa processing",
        deltaTone: "flat",
        icon: "🛂",
        label: "Visa Applied",
        value: "7",
      },
    ],
    quickActions: [
      { icon: "➕", label: "New Application", href: applicationsRoutePaths.create },
      { icon: "📄", label: "Doc Check Queue", href: applicationsRoutePaths.dashboard },
      { icon: "🛂", label: "Visa Tracker", href: applicationsRoutePaths.dashboard },
      { icon: "📊", label: "View Reports", href: "#" },
    ],
    widgets: {
      applicationPipeline: true,
      leadPipeline: false,
      performance: true,
      recentActivities: true,
      weeklyActivity: false,
    },
  },
  [ROLES.ACTIVITY_MANAGER]: {
    subtitle: "Monitor team workload, tasks, and daily activity.",
    kpis: [
      {
        accent: "orange",
        delta: "3 high priority",
        deltaTone: "down",
        icon: "📋",
        label: "Tasks Due Today",
        value: "8",
      },
      {
        accent: "blue",
        delta: "↑ 8 from Meta Ads",
        deltaTone: "up",
        icon: "👤",
        label: "New Leads Today",
        value: "23",
      },
      {
        accent: "green",
        delta: "↑ 6 vs last week",
        deltaTone: "up",
        icon: "✅",
        label: "Qualified This Week",
        value: "34",
      },
      {
        accent: "red",
        delta: "Needs attention",
        deltaTone: "down",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: "5",
      },
    ],
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
  [ROLES.ANALYST]: {
    subtitle: "Pipeline analytics and conversion insights for your agency.",
    kpis: [
      {
        accent: "blue",
        delta: "↑ 8 from Meta Ads",
        deltaTone: "up",
        icon: "👤",
        label: "New Leads Today",
        value: "23",
      },
      {
        accent: "green",
        delta: "Team portfolio",
        deltaTone: "flat",
        icon: "🎓",
        label: "Active Students",
        value: "142",
      },
      {
        accent: "red",
        delta: "Across team",
        deltaTone: "down",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: "5",
      },
      {
        accent: "orange",
        delta: "↑ 2.1% this month",
        deltaTone: "up",
        icon: "📈",
        label: "Conversion Rate",
        value: "18.4%",
      },
    ],
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
    subtitle: "Your personal workload, leads, and follow-ups for today.",
    kpis: [
      {
        accent: "orange",
        delta: "3 high priority",
        deltaTone: "down",
        icon: "📋",
        label: "Tasks Due Today",
        value: "8",
      },
      {
        accent: "blue",
        delta: "Assigned to me",
        deltaTone: "up",
        icon: "👤",
        label: "New Leads Today",
        value: "6",
      },
      {
        accent: "green",
        delta: "My portfolio",
        deltaTone: "up",
        icon: "🎓",
        label: "Active Students",
        value: "24",
      },
      {
        accent: "red",
        delta: "Action needed",
        deltaTone: "down",
        icon: "⚠️",
        label: "Overdue Tasks",
        value: "2",
      },
    ],
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
