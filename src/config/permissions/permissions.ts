import { ROLES, type RoleKey } from "@/config/roles/roles";

/**
 * Permission strings returned by the backend auth service.
 * KEYS are the app-internal names (referenced everywhere as PERMISSIONS.X); VALUES must
 * match the strings the backend actually grants — the consolidated *singular* taxonomy
 * (USER_VIEW, UNIVERSITY_VIEW, APPLICATION_VIEW, …). A few keys have no exact backend
 * equivalent and are mapped to the closest granted permission.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
  LEAD_CREATE: "LEAD_CREATE",
  LEAD_VIEW: "LEAD_VIEW",
  LEAD_DELETE: "LEAD_DELETE",
  LEAD_MANAGE: "LEAD_EDIT",                 // no LEAD_MANAGE server-side; closest is LEAD_EDIT
  LEAD_ASSIGN: "LEAD_ASSIGN",
  APPLICATIONS_VIEW: "APPLICATION_VIEW",
  APPLICATIONS_MANAGE: "APPLICATION_EDIT",  // no APPLICATION_MANAGE; closest is APPLICATION_EDIT
  STUDENTS_VIEW: "STUDENT_VIEW",
  STUDENTS_MANAGE: "STUDENT_EDIT",          // no STUDENT_MANAGE; closest is STUDENT_EDIT
  STUDENTS_DOCS: "STUDENT_DOCS",            // document upload/manage on a student record
  TASK_CREATE: "TASK_CREATE",
  TASK_VIEW: "TASK_VIEW",
  TASK_VIEW_TEAM: "TASK_VIEW_TEAM",         // no backend equivalent (kept distinct)
  TASK_UPDATE: "TASK_COMPLETE",             // closest granted task-write perm
  TASK_DELETE: "TASK_DELETE",               // no backend equivalent (kept distinct)
  ACTIVITY_LOG: "ACTIVITY_LOG",
  UNIVERSITIES_VIEW: "UNIVERSITY_VIEW",
  UNIVERSITIES_MANAGE: "UNIVERSITY_MANAGE",
  SETTINGS_TENANT: "SETTINGS_MANAGE",
  TEAM_INVITE: "TEAM_INVITE",               // no backend equivalent (kept distinct)
  USERS_VIEW: "USER_VIEW",
  USERS_MANAGE: "USER_MANAGE",
  ROLES_VIEW: "ROLE_VIEW",
  ROLES_MANAGE: "ROLE_MANAGE",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

const allPermissions = Object.values(PERMISSIONS);

export const ROLE_PERMISSION_MAP: Record<RoleKey, PermissionKey[]> = {
  [ROLES.SUPER_ADMIN]: allPermissions,
  [ROLES.AGENCY_ADMIN]: allPermissions,
  [ROLES.COUNSELLOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_MANAGE,
    PERMISSIONS.STUDENTS_DOCS,
    PERMISSIONS.UNIVERSITIES_VIEW,
    PERMISSIONS.TASK_VIEW,
  ],
  [ROLES.APPLICATION_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_MANAGE,
    PERMISSIONS.UNIVERSITIES_VIEW,
  ],
  [ROLES.ACTIVITY_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],
  [ROLES.ANALYST]: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.LEAD_VIEW],
};

export function getPermissionsForRoles(roles: RoleKey[]) {
  return Array.from(new Set(roles.flatMap((role) => ROLE_PERMISSION_MAP[role] ?? [])));
}
