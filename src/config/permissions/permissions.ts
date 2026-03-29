import { ROLES, type RoleKey } from "@/config/roles/roles";

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  LEAD_CREATE: "lead.create",
  LEAD_VIEW: "lead:view",
  LEAD_MANAGE: "lead:manage",
  APPLICATIONS_VIEW: "applications:view",
  APPLICATIONS_MANAGE: "applications:manage",
  ACTIVITIES_VIEW: "activities:view",
  ACTIVITIES_MANAGE: "activities:manage",
} as const;

export type PermissionKey =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const allPermissions = Object.values(PERMISSIONS);

export const ROLE_PERMISSION_MAP: Record<RoleKey, PermissionKey[]> = {
  [ROLES.SUPER_ADMIN]: allPermissions,
  [ROLES.TENANT_ADMIN]: allPermissions,
  [ROLES.COUNSELLOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.ACTIVITIES_VIEW,
  ],
  [ROLES.APPLICATION_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.APPLICATIONS_VIEW,
    PERMISSIONS.APPLICATIONS_MANAGE,
  ],
  [ROLES.ACTIVITY_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ACTIVITIES_VIEW,
    PERMISSIONS.ACTIVITIES_MANAGE,
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.LEAD_VIEW,
  ],
};

export function getPermissionsForRoles(roles: RoleKey[]) {
  return Array.from(
    new Set(roles.flatMap((role) => ROLE_PERMISSION_MAP[role] ?? [])),
  );
}
