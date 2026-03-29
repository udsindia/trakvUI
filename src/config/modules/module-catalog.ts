import {
  MODULE_ICON_KEYS,
  type ModuleDefinition,
} from "@/config/modules/module.types";
import { MODULE_KEYS } from "@/config/modules/modules";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ROLES } from "@/config/roles/roles";

export const moduleCatalog: ModuleDefinition[] = [
  {
    key: MODULE_KEYS.DASHBOARD,
    title: "Dashboard",
    navLabel: "Dashboard",
    path: "dashboard",
    icon: MODULE_ICON_KEYS.DASHBOARD,
    description: "Portfolio KPIs, case volumes, and operational summaries.",
    order: 1,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.TENANT_ADMIN,
      ROLES.COUNSELLOR,
      ROLES.APPLICATION_MANAGER,
      ROLES.ACTIVITY_MANAGER,
      ROLES.ANALYST,
    ],
    requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    key: MODULE_KEYS.LEAD,
    title: "Lead Management",
    navLabel: "Lead Management",
    path: "leads",
    icon: MODULE_ICON_KEYS.LEADS,
    description: "Prospect intake, pipeline ownership, and lead conversion flows.",
    order: 2,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.TENANT_ADMIN,
      ROLES.COUNSELLOR,
      ROLES.ANALYST,
    ],
    requiredPermissions: [PERMISSIONS.LEAD_VIEW],
  },
  {
    key: MODULE_KEYS.APPLICATIONS,
    title: "Applications",
    navLabel: "Applications",
    path: "applications",
    icon: MODULE_ICON_KEYS.APPLICATIONS,
    description: "Application lifecycle orchestration for students and counsellors.",
    order: 3,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.TENANT_ADMIN,
      ROLES.COUNSELLOR,
      ROLES.APPLICATION_MANAGER,
    ],
    requiredPermissions: [PERMISSIONS.APPLICATIONS_VIEW],
  },
  {
    key: MODULE_KEYS.ACTIVITIES,
    title: "Activities",
    navLabel: "Activities",
    path: "activities",
    icon: MODULE_ICON_KEYS.ACTIVITIES,
    description: "Tasks, reminders, and case coordination timelines.",
    order: 4,
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.TENANT_ADMIN,
      ROLES.COUNSELLOR,
      ROLES.ACTIVITY_MANAGER,
    ],
    requiredPermissions: [PERMISSIONS.ACTIVITIES_VIEW],
  },
];
