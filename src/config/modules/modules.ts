export const MODULE_KEYS = {
  DASHBOARD: "dashboard",
  LEAD: "lead",
  STUDENTS: "students",
  APPLICATIONS: "applications",
  COMMISSIONS: "commissions",
  ACTIVITIES: "activities",
  UNIVERSITIES: "universities",
  UNIVERSITIES_BROWSE: "universities-browse",
  SETTINGS: "settings",
  CALL_RECORDS: "call-records",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
export type TenantModuleMap = Record<ModuleKey, boolean>;

export const defaultTenantModules: TenantModuleMap = {
  [MODULE_KEYS.DASHBOARD]: true,
  [MODULE_KEYS.LEAD]: true,
  [MODULE_KEYS.STUDENTS]: true,
  [MODULE_KEYS.APPLICATIONS]: true,
  [MODULE_KEYS.COMMISSIONS]: true,
  [MODULE_KEYS.ACTIVITIES]: true,
  [MODULE_KEYS.UNIVERSITIES]: true,
  [MODULE_KEYS.UNIVERSITIES_BROWSE]: true,
  [MODULE_KEYS.SETTINGS]: true,
  [MODULE_KEYS.CALL_RECORDS]: true,
};

