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


/**
 * Backend industry module flags → the frontend modules they switch off. A backend flag
 * that is absent leaves its modules at the default (on), so an older backend that sends
 * no flags changes nothing.
 */
const INDUSTRY_MODULE_KEYS: Record<string, ModuleKey[]> = {
  students: [MODULE_KEYS.STUDENTS],
  applications: [MODULE_KEYS.APPLICATIONS],
  commissions: [MODULE_KEYS.COMMISSIONS],
  universities: [MODULE_KEYS.UNIVERSITIES, MODULE_KEYS.UNIVERSITIES_BROWSE],
};

export function tenantModulesForIndustry(
  industryModules?: Record<string, boolean> | null,
): TenantModuleMap {
  const enabledModules = { ...defaultTenantModules };
  if (!industryModules) return enabledModules;

  for (const [flag, moduleKeys] of Object.entries(INDUSTRY_MODULE_KEYS)) {
    if (industryModules[flag] === false) {
      for (const moduleKey of moduleKeys) enabledModules[moduleKey] = false;
    }
  }
  return enabledModules;
}
