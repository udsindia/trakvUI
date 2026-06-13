import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { hasAllPermissions, hasAnyPermission } from "@/shared/utils/permissions";

type PermissionGuardProps = PropsWithChildren<{
  allOf?: readonly string[];
  anyOf?: readonly string[];
  redirectTo?: string;
  permission?: string;
}>;

export function PermissionGuard({
  allOf,
  anyOf,
  children,
  redirectTo = "/unauthorized",
  permission,
}: PermissionGuardProps) {
  const { permissions, roles } = useAuth();

  const isAllowed = (() => {
    if (permission) {
      return hasAllPermissions(permissions, [permission], roles);
    }

    if (allOf?.length) {
      return hasAllPermissions(permissions, allOf, roles);
    }

    if (anyOf?.length) {
      return hasAnyPermission(permissions, anyOf, roles);
    }

    return true;
  })();

  if (!isAllowed) {
    return <Navigate replace to={redirectTo} />;
  }

  return children;
}
