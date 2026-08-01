import { lazy, type ComponentType } from "react";
import type { TenantContextState } from "@/app/auth/auth.types";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { moduleCatalog } from "@/config/modules/module-catalog";
import type { ModuleNavigationItemDefinition } from "@/config/modules/module.types";
import { MODULE_KEYS, type ModuleKey } from "@/config/modules/modules";
import type { PermissionKey } from "@/config/permissions/permissions";
import { isSuperAdmin } from "@/config/roles/superAdmin";
import { hasAllPermissions, hasAnyPermission } from "@/shared/utils/permissions";

type ModuleImport = () => Promise<{ default: ComponentType }>;

const moduleImporters: Record<ModuleKey, ModuleImport> = {
  [MODULE_KEYS.DASHBOARD]: () => import("@/modules/dashboard"),
  [MODULE_KEYS.LEAD]: () => import("@/modules/lead"),
  [MODULE_KEYS.APPLICATIONS]: () => import("@/modules/applications"),
  [MODULE_KEYS.ACTIVITIES]: () => import("@/modules/activities"),
  [MODULE_KEYS.UNIVERSITIES]: () => import("@/modules/universities"),
  [MODULE_KEYS.SETTINGS]: () => import("@/modules/settings"),
};

const lazyModuleMap: Record<ModuleKey, ReturnType<typeof lazy>> = {
  [MODULE_KEYS.DASHBOARD]: lazy(moduleImporters[MODULE_KEYS.DASHBOARD]),
  [MODULE_KEYS.LEAD]: lazy(moduleImporters[MODULE_KEYS.LEAD]),
  [MODULE_KEYS.APPLICATIONS]: lazy(moduleImporters[MODULE_KEYS.APPLICATIONS]),
  [MODULE_KEYS.ACTIVITIES]: lazy(moduleImporters[MODULE_KEYS.ACTIVITIES]),
  [MODULE_KEYS.UNIVERSITIES]: lazy(moduleImporters[MODULE_KEYS.UNIVERSITIES]),
  [MODULE_KEYS.SETTINGS]: lazy(moduleImporters[MODULE_KEYS.SETTINGS]),
};

function isItemAccessible(
  permissions: PermissionKey[],
  item: Pick<ModuleNavigationItemDefinition, "anyOfPermissions" | "requiredPermissions">,
) {
  if (item.anyOfPermissions?.length) {
    return hasAnyPermission(permissions, item.anyOfPermissions);
  }

  return hasAllPermissions(permissions, item.requiredPermissions ?? []);
}

/**
 * Recursively drops child nav items the user has no permission for, so a section
 * the user can partly access (e.g. Settings via USER_VIEW) doesn't expose
 * sub-items it can't (e.g. Role Management, which needs ROLE_VIEW).
 */
function filterChildren(
  permissions: PermissionKey[],
  superAdmin: boolean,
  children?: ModuleNavigationItemDefinition[],
): ModuleNavigationItemDefinition[] | undefined {
  if (!children?.length) {
    return children;
  }

  return children
    .filter((child) => superAdmin || isItemAccessible(permissions, child))
    .map((child) => ({
      ...child,
      children: filterChildren(permissions, superAdmin, child.children),
    }));
}

export function resolveModules({
  permissions,
  roles,
  tenant,
}: {
  permissions: PermissionKey[];
  roles: string[];
  tenant: TenantContextState | null;
}): ResolvedModule[] {
  if (!tenant) {
    return [];
  }

  const superAdmin = isSuperAdmin(roles);

  return moduleCatalog.map((moduleDefinition) => {
    const enabled = superAdmin ? true : (tenant.enabledModules[moduleDefinition.key] ?? false);
    const accessible = superAdmin ? true : isItemAccessible(permissions, moduleDefinition);

    return {
      ...moduleDefinition,
      children: filterChildren(permissions, superAdmin, moduleDefinition.children),
      enabled,
      accessible,
      Component: lazyModuleMap[moduleDefinition.key],
    };
  });
}

export function getNavigationModules(modules: ResolvedModule[]) {
  return modules
    .filter((module) => module.enabled && module.accessible)
    .sort((left, right) => left.order - right.order);
}

export function getDefaultModulePath(modules: ResolvedModule[]) {
  const firstAvailableModule = getNavigationModules(modules)[0];

  return firstAvailableModule ? `/${firstAvailableModule.path}` : "/unauthorized";
}
