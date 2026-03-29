import { lazy, type ComponentType } from "react";
import type { TenantContextState } from "@/app/auth/auth.types";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { moduleCatalog } from "@/config/modules/module-catalog";
import { MODULE_KEYS, type ModuleKey } from "@/config/modules/modules";
import type { PermissionKey } from "@/config/permissions/permissions";
import type { RoleKey } from "@/config/roles/roles";

type ModuleImport = () => Promise<{ default: ComponentType }>;

const moduleImporters: Record<ModuleKey, ModuleImport> = {
  [MODULE_KEYS.DASHBOARD]: () => import("@/modules/dashboard"),
  [MODULE_KEYS.LEAD]: () => import("@/modules/lead"),
  [MODULE_KEYS.APPLICATIONS]: () => import("@/modules/applications"),
  [MODULE_KEYS.ACTIVITIES]: () => import("@/modules/activities"),
};

const lazyModuleMap: Record<ModuleKey, ReturnType<typeof lazy>> = {
  [MODULE_KEYS.DASHBOARD]: lazy(moduleImporters[MODULE_KEYS.DASHBOARD]),
  [MODULE_KEYS.LEAD]: lazy(moduleImporters[MODULE_KEYS.LEAD]),
  [MODULE_KEYS.APPLICATIONS]: lazy(moduleImporters[MODULE_KEYS.APPLICATIONS]),
  [MODULE_KEYS.ACTIVITIES]: lazy(moduleImporters[MODULE_KEYS.ACTIVITIES]),
};

export function resolveModules({
  permissions,
  roles,
  tenant,
}: {
  permissions: PermissionKey[];
  roles: RoleKey[];
  tenant: TenantContextState | null;
}): ResolvedModule[] {
  if (!tenant) {
    return [];
  }

  return moduleCatalog.map((moduleDefinition) => {
    const enabled = tenant.enabledModules[moduleDefinition.key] ?? false;
    const accessible =
      moduleDefinition.allowedRoles.some((role) => roles.includes(role)) &&
      moduleDefinition.requiredPermissions.every((permission) =>
        permissions.includes(permission),
      );

    return {
      ...moduleDefinition,
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
