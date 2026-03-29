export const MODULE_KEYS = {
  DASHBOARD: "dashboard",
  LEAD: "lead",
  APPLICATIONS: "applications",
  ACTIVITIES: "activities",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
export type TenantModuleMap = Record<ModuleKey, boolean>;

export const defaultTenantModules: TenantModuleMap = {
  [MODULE_KEYS.DASHBOARD]: true,
  [MODULE_KEYS.LEAD]: true,
  [MODULE_KEYS.APPLICATIONS]: true,
  [MODULE_KEYS.ACTIVITIES]: true,
};

