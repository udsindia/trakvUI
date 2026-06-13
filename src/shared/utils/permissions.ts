import { isSuperAdmin } from "@/config/roles/superAdmin";

export type PermissionList = readonly string[] | string[] | null | undefined;
export type RoleList = readonly string[] | string[] | null | undefined;

function normalizePermissionList(permissions: PermissionList): string[] {
  if (!permissions?.length) {
    return [];
  }

  return permissions.filter((permission): permission is string =>
    Boolean(permission),
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
