import {
  PERMISSIONS,
  type PermissionKey,
} from "@/config/permissions/permissions";
import { formatScreamingSnakeLabel } from "@/shared/utils/formatLabel";

export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.DASHBOARD_VIEW]: "View dashboard",
  [PERMISSIONS.LEAD_CREATE]: "Create leads",
  [PERMISSIONS.LEAD_VIEW]: "View leads",
  [PERMISSIONS.LEAD_DELETE]: "Delete leads",
  [PERMISSIONS.LEAD_MANAGE]: "Manage leads",
  [PERMISSIONS.LEAD_ASSIGN]: "Assign leads",
  [PERMISSIONS.APPLICATIONS_VIEW]: "View applications",
  [PERMISSIONS.APPLICATIONS_MANAGE]: "Manage applications",
  [PERMISSIONS.TASK_CREATE]: "Create tasks",
  [PERMISSIONS.TASK_VIEW]: "View tasks",
  [PERMISSIONS.TASK_VIEW_TEAM]: "View team tasks",
  [PERMISSIONS.TASK_UPDATE]: "Update tasks",
  [PERMISSIONS.TASK_DELETE]: "Delete tasks",
  [PERMISSIONS.ACTIVITY_LOG]: "Log activities",
  [PERMISSIONS.SETTINGS_TENANT]: "Manage tenant settings",
  [PERMISSIONS.TEAM_INVITE]: "Invite team members",
  [PERMISSIONS.USERS_VIEW]: "View team members",
  [PERMISSIONS.USERS_MANAGE]: "Manage team members",
  [PERMISSIONS.ROLES_VIEW]: "View roles",
  [PERMISSIONS.ROLES_MANAGE]: "Manage roles",
};

export function getPermissionLabel(permission: string): string {
  return PERMISSION_LABELS[permission] ?? formatScreamingSnakeLabel(permission);
}

export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: PermissionKey[];
}> = [
  {
    label: "Dashboard",
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    label: "Leads",
    permissions: [
      PERMISSIONS.LEAD_VIEW,
      PERMISSIONS.LEAD_CREATE,
      PERMISSIONS.LEAD_DELETE,
      PERMISSIONS.LEAD_MANAGE,
      PERMISSIONS.LEAD_ASSIGN,
    ],
  },
  {
    label: "Applications",
    permissions: [
      PERMISSIONS.APPLICATIONS_VIEW,
      PERMISSIONS.APPLICATIONS_MANAGE,
    ],
  },
  {
    label: "Activities",
    permissions: [
      PERMISSIONS.TASK_VIEW,
      PERMISSIONS.TASK_VIEW_TEAM,
      PERMISSIONS.TASK_CREATE,
      PERMISSIONS.TASK_UPDATE,
      PERMISSIONS.TASK_DELETE,
      PERMISSIONS.ACTIVITY_LOG,
    ],
  },
  {
    label: "Administration",
    permissions: [
      PERMISSIONS.SETTINGS_TENANT,
      PERMISSIONS.TEAM_INVITE,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_MANAGE,
    ],
  },
];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
