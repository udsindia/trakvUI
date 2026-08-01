import {
  PERMISSIONS,
  type PermissionKey,
} from "@/config/permissions/permissions";
import { formatScreamingSnakeLabel } from "@/shared/utils/formatLabel";

export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.DASHBOARD_VIEW]: "View dashboard",

  [PERMISSIONS.LEAD_VIEW]: "View leads",
  [PERMISSIONS.LEAD_CREATE]: "Create leads",
  [PERMISSIONS.LEAD_EDIT]: "Edit leads",
  [PERMISSIONS.LEAD_DELETE]: "Delete leads",
  [PERMISSIONS.LEAD_ASSIGN]: "Assign leads",
  [PERMISSIONS.LEAD_IMPORT]: "Import leads",
  [PERMISSIONS.LEAD_CONVERT]: "Convert leads to students",

  [PERMISSIONS.APPLICATION_VIEW]: "View applications",
  [PERMISSIONS.APPLICATION_CREATE]: "Create applications",
  [PERMISSIONS.APPLICATION_EDIT]: "Edit applications",
  [PERMISSIONS.APPLICATION_CLOSE]: "Close applications",

  [PERMISSIONS.STUDENT_VIEW]: "View students",
  [PERMISSIONS.STUDENT_EDIT]: "Edit students",
  [PERMISSIONS.STUDENT_DOCS]: "Manage student documents",

  [PERMISSIONS.UNIVERSITY_VIEW]: "View universities and courses",
  [PERMISSIONS.UNIVERSITY_MANAGE]: "Manage course database",

  [PERMISSIONS.ACTIVITY_VIEW]: "View activity feed",
  [PERMISSIONS.ACTIVITY_LOG]: "Log activities",

  [PERMISSIONS.TASK_VIEW]: "View tasks",
  [PERMISSIONS.TASK_CREATE]: "Create tasks",
  [PERMISSIONS.TASK_COMPLETE]: "Complete tasks",

  [PERMISSIONS.USER_VIEW]: "View team members",
  [PERMISSIONS.USER_MANAGE]: "Manage team members",
  [PERMISSIONS.ROLE_VIEW]: "View roles",
  [PERMISSIONS.ROLE_MANAGE]: "Manage roles",
  [PERMISSIONS.SETTINGS_MANAGE]: "Manage tenant settings",
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
      PERMISSIONS.LEAD_EDIT,
      PERMISSIONS.LEAD_DELETE,
      PERMISSIONS.LEAD_ASSIGN,
      PERMISSIONS.LEAD_IMPORT,
      PERMISSIONS.LEAD_CONVERT,
    ],
  },
  {
    label: "Applications",
    permissions: [
      PERMISSIONS.APPLICATION_VIEW,
      PERMISSIONS.APPLICATION_CREATE,
      PERMISSIONS.APPLICATION_EDIT,
      PERMISSIONS.APPLICATION_CLOSE,
    ],
  },
  {
    label: "Students",
    permissions: [
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.STUDENT_EDIT,
      PERMISSIONS.STUDENT_DOCS,
    ],
  },
  {
    label: "Universities",
    permissions: [
      PERMISSIONS.UNIVERSITY_VIEW,
      PERMISSIONS.UNIVERSITY_MANAGE,
    ],
  },
  {
    label: "Activities & Tasks",
    permissions: [
      PERMISSIONS.ACTIVITY_VIEW,
      PERMISSIONS.ACTIVITY_LOG,
      PERMISSIONS.TASK_VIEW,
      PERMISSIONS.TASK_CREATE,
      PERMISSIONS.TASK_COMPLETE,
    ],
  },
  {
    label: "Administration",
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
  },
];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
