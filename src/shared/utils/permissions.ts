import { PERMISSIONS } from "@/config/permissions/permissions";
import { isSuperAdmin } from "@/config/roles/superAdmin";

export type PermissionList = readonly string[] | string[] | null | undefined;
export type RoleList = readonly string[] | string[] | null | undefined;

const LEGACY_PERMISSION_ALIASES: Record<string, readonly string[]> = {
  [PERMISSIONS.APPLICATIONS_VIEW]: ["APPLICATIONS_VIEW", "APPLICATION_VIEW"],
  [PERMISSIONS.APPLICATIONS_MANAGE]: ["APPLICATIONS_MANAGE", "APPLICATION_EDIT"],
  [PERMISSIONS.UNIVERSITIES_VIEW]: ["UNIVERSITIES_VIEW", "UNIVERSITY_VIEW"],
  [PERMISSIONS.UNIVERSITIES_MANAGE]: ["UNIVERSITIES_MANAGE", "UNIVERSITY_MANAGE"],
  [PERMISSIONS.SETTINGS_TENANT]: ["SETTINGS_TENANT", "SETTINGS_MANAGE"],
  [PERMISSIONS.USERS_VIEW]: ["USERS_VIEW", "USER_VIEW"],
  [PERMISSIONS.USERS_MANAGE]: ["USERS_MANAGE", "USER_MANAGE"],
  [PERMISSIONS.ROLES_VIEW]: ["ROLES_VIEW", "ROLE_VIEW"],
  [PERMISSIONS.ROLES_MANAGE]: ["ROLES_MANAGE", "ROLE_MANAGE"],
  [PERMISSIONS.LEAD_MANAGE]: ["LEAD_MANAGE", "LEAD_EDIT"],
  [PERMISSIONS.TASK_UPDATE]: ["TASK_UPDATE", "TASK_COMPLETE"],
};

export function normalizePermission(permission: string | null | undefined): string {
  if (!permission) {
    return "";
  }

  const trimmedPermission = permission.trim();

  if (!trimmedPermission) {
    return "";
  }

  const canonicalPermission = Object.entries(LEGACY_PERMISSION_ALIASES).find(([, aliases]) =>
    aliases.includes(trimmedPermission),
  )?.[0];

  return canonicalPermission ?? trimmedPermission;
}

export function normalizePermissionList(permissions: PermissionList): string[] {
  if (!permissions?.length) {
    return [];
  }

  return Array.from(
    new Set(
      permissions
        .filter((permission): permission is string => Boolean(permission))
        .map((permission) => normalizePermission(permission)),
    ),
  );
}

function bypassesPermissionChecks(roles: RoleList): boolean {
  return isSuperAdmin(roles);
}

export function hasPermission(
  permissions: PermissionList,
  permission: string,
  roles?: RoleList,
): boolean {
  if (bypassesPermissionChecks(roles)) {
    return true;
  }

  if (!permission) {
    return false;
  }

  return normalizePermissionList(permissions).includes(permission);
}

export function hasAllPermissions(
  permissions: PermissionList,
  requiredPermissions: readonly string[],
  roles?: RoleList,
): boolean {
  if (bypassesPermissionChecks(roles)) {
    return true;
  }

  if (!requiredPermissions.length) {
    return true;
  }

  const granted = normalizePermissionList(permissions);
  return requiredPermissions.every((permission) =>
    granted.includes(permission),
  );
}

export function hasAnyPermission(
  permissions: PermissionList,
  requiredPermissions: readonly string[],
  roles?: RoleList,
): boolean {
  if (bypassesPermissionChecks(roles)) {
    return true;
  }

  if (!requiredPermissions.length) {
    return true;
  }

  const granted = normalizePermissionList(permissions);
  return requiredPermissions.some((permission) => granted.includes(permission));
}
