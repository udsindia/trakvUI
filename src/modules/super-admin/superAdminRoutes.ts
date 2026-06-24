import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { AgenciesListPage } from "@/modules/super-admin/pages/AgenciesListPage";
import { AgencyDetailPage } from "@/modules/super-admin/pages/AgencyDetailPage";
import { CreateAgencyPage } from "@/modules/super-admin/pages/CreateAgencyPage";
import { GlobalSettingsPage } from "@/modules/super-admin/pages/GlobalSettingsPage";
import { PlatformAnalyticsPage } from "@/modules/super-admin/pages/PlatformAnalyticsPage";
import { PlatformDashboardPage } from "@/modules/super-admin/pages/PlatformDashboardPage";
import { RoleTemplatesPage } from "@/modules/super-admin/pages/RoleTemplatesPage";

type SuperAdminRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const superAdminRoutes: SuperAdminRouteDefinition[] = [
  {
    Component: PlatformDashboardPage,
    index: true,
    key: "overview",
    requiredPermissions: [PERMISSIONS.PLATFORM_VIEW],
  },
  {
    Component: AgenciesListPage,
    key: "agencies",
    path: "agencies",
    requiredPermissions: [PERMISSIONS.AGENCIES_VIEW],
  },
  {
    Component: CreateAgencyPage,
    key: "create-agency",
    path: "agencies/create",
    requiredPermissions: [PERMISSIONS.AGENCIES_MANAGE],
  },
  {
    Component: AgencyDetailPage,
    key: "agency-detail",
    path: "agencies/:agencyId",
    requiredPermissions: [PERMISSIONS.AGENCIES_VIEW],
  },
  {
    Component: PlatformAnalyticsPage,
    key: "analytics",
    path: "analytics",
    requiredPermissions: [PERMISSIONS.PLATFORM_ANALYTICS],
  },
  {
    Component: RoleTemplatesPage,
    key: "role-templates",
    path: "role-templates",
    requiredPermissions: [PERMISSIONS.PLATFORM_ROLES],
  },
  {
    Component: GlobalSettingsPage,
    key: "global-settings",
    path: "settings",
    requiredPermissions: [PERMISSIONS.PLATFORM_SETTINGS],
  },
];
