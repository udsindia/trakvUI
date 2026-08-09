import { lazy, type ComponentType } from "react";
import type { TenantContextState } from "@/app/auth/auth.types";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { moduleCatalog } from "@/config/modules/module-catalog";
import { MODULE_KEYS, type ModuleKey } from "@/config/modules/modules";
import type { ModuleNavigationItemDefinition } from "@/config/modules/module.types";
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
  [MODULE_KEYS.UNIVERSITIES_BROWSE]: () => import("@/modules/universities-browse"),
  [MODULE_KEYS.SETTINGS]: () => import("@/modules/settings"),
};

const lazyModuleMap: Record<ModuleKey, ReturnType<typeof lazy>> = {
  [MODULE_KEYS.DASHBOARD]: lazy(moduleImporters[MODULE_KEYS.DASHBOARD]),
  [MODULE_KEYS.LEAD]: lazy(moduleImporters[MODULE_KEYS.LEAD]),
  [MODULE_KEYS.APPLICATIONS]: lazy(moduleImporters[MODULE_KEYS.APPLICATIONS]),
  [MODULE_KEYS.ACTIVITIES]: lazy(moduleImporters[MODULE_KEYS.ACTIVITIES]),
  [MODULE_KEYS.UNIVERSITIES]: lazy(moduleImporters[MODULE_KEYS.UNIVERSITIES]),
  [MODULE_KEYS.UNIVERSITIES_BROWSE]: lazy(moduleImporters[MODULE_KEYS.UNIVERSITIES_BROWSE]),
  [MODULE_KEYS.SETTINGS]: lazy(moduleImporters[MODULE_KEYS.SETTINGS]),
};

function isNavItemAccessible(
  permissions: PermissionKey[],
  item: ModuleNavigationItemDefinition,
) {
  if (item.anyOfPermissions?.length) {
    return hasAnyPermission(permissions, item.anyOfPermissions);
  }

  return hasAllPermissions(permissions, item.requiredPermissions ?? []);
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
    const accessible = superAdmin ? true : isNavItemAccessible(permissions, moduleDefinition);

    // Gate sub-items individually so e.g. Role Management is hidden from a user who lacks
    // ROLE_VIEW even when the parent Settings section is visible via another permission.
    const children = moduleDefinition.children?.filter(
      (child) => superAdmin || isNavItemAccessible(permissions, child),
    );

    return {
      ...moduleDefinition,
      children,
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
