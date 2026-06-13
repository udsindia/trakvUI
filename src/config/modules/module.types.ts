import type { PermissionKey } from "@/config/permissions/permissions";
import type { RoleKey } from "@/config/roles/roles";
import type { ModuleKey } from "@/config/modules/modules";

export const MODULE_ICON_KEYS = {
  DASHBOARD: "dashboard",
  LEADS: "leads",
  APPLICATIONS: "applications",
  ACTIVITIES: "activities",
  SETTINGS: "settings",
} as const;

export type ModuleIconKey =
  (typeof MODULE_ICON_KEYS)[keyof typeof MODULE_ICON_KEYS];

export interface ModuleNavigationItemDefinition {
  key: string;
  navLabel: string;
  path: string;
  description?: string;
  icon?: ModuleIconKey;
  children?: ModuleNavigationItemDefinition[];
}

export interface ModuleDefinition extends ModuleNavigationItemDefinition {
  key: ModuleKey;
  title: string;
  description: string;
  icon: ModuleIconKey;
  order: number;
  allowedRoles: RoleKey[];
  /** User must have every permission in this list to access the module. */
  requiredPermissions?: PermissionKey[];
  /** User must have at least one permission in this list to access the module. */
  anyOfPermissions?: PermissionKey[];
}
