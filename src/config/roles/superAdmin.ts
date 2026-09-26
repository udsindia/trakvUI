export const BACKEND_SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export function isSuperAdmin(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((role) => role.toUpperCase() === BACKEND_SUPER_ADMIN_ROLE);
}
