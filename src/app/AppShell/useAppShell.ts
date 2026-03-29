import { useMemo } from "react";
import { useAuth } from "@/app/auth/useAuth";
import {
  getDefaultModulePath,
  getNavigationModules,
  resolveModules,
} from "@/app/module-loader/module-registry";

export function useAppShell() {
  const {
    isInitializing,
    logout,
    permissions,
    roles,
    tenant,
    user,
  } = useAuth();

  const modules = useMemo(
    () =>
      resolveModules({
        permissions,
        roles,
        tenant,
      }),
    [permissions, roles, tenant],
  );

  const navigationModules = useMemo(
    () => getNavigationModules(modules),
    [modules],
  );

  const defaultModulePath = useMemo(
    () => getDefaultModulePath(modules),
    [modules],
  );

  return {
    defaultModulePath,
    isInitializing,
    modules,
    navigationModules,
    notificationsCount: 4,
    onLogout: logout,
    roles,
    tenant,
    user,
  };
}
