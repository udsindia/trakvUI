export const MODULE_KEYS = {
  SUPER_ADMIN: "super_admin",
  DASHBOARD: "dashboard",
  LEAD: "lead",
  APPLICATIONS: "applications",
  ACTIVITIES: "activities",
  SETTINGS: "settings",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

export type TenantModuleKey = Exclude<ModuleKey, typeof MODULE_KEYS.SUPER_ADMIN>;

export type TenantModuleMap = Record<TenantModuleKey, boolean>;

export const defaultTenantModules: TenantModuleMap = {
  [MODULE_KEYS.DASHBOARD]: true,
  [MODULE_KEYS.LEAD]: true,
  [MODULE_KEYS.APPLICATIONS]: true,
  [MODULE_KEYS.ACTIVITIES]: true,
  [MODULE_KEYS.SETTINGS]: true,
};

