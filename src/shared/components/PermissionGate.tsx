import type { PropsWithChildren, ReactNode } from "react";
import { useAuth } from "@/app/auth/useAuth";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/shared/utils/permissions";

type PermissionGateProps = PropsWithChildren<{
  allOf?: readonly string[];
  anyOf?: readonly string[];
  fallback?: ReactNode;
  permission?: string;
}>;

export function PermissionGate({
  allOf,
  anyOf,
  children,
  fallback = null,
  permission,
}: PermissionGateProps) {
  const { permissions, roles } = useAuth();

  const isAllowed = (() => {
    if (permission) {
      return hasPermission(permissions, permission, roles);
    }

    if (allOf?.length) {
      return hasAllPermissions(permissions, allOf, roles);
    }

    if (anyOf?.length) {
      return hasAnyPermission(permissions, anyOf, roles);
    }

    return true;
  })();

  return isAllowed ? children : fallback;
}
