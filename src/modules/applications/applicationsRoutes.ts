import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ApplicationDashboardPage } from "@/modules/applications/pages/ApplicationDashboardPage";
import { AddApplicationPage } from "@/modules/applications/pages/AddApplicationPage";
import { ApplicationDetailsPage } from "@/modules/applications/pages/ApplicationDetailsPage";
import { EditApplicationPage } from "@/modules/applications/pages/EditApplicationPage";
import { CommissionsRedirect } from "@/modules/applications/pages/CommissionsRedirect";

type ApplicationRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const applicationsRoutes: ApplicationRouteDefinition[] = [
  {
    Component: ApplicationDashboardPage,
    index: true,
    key: "dashboard",
    requiredPermissions: [PERMISSIONS.APPLICATIONS_VIEW],
  },
  {
    Component: AddApplicationPage,
    key: "create",
    path: "create",
    requiredPermissions: [PERMISSIONS.APPLICATIONS_MANAGE],
  },
  {
    // Commissions moved to its own sidebar module; old links and bookmarks land there.
    // Must precede ":id", which would otherwise read "commissions" as an application id.
    Component: CommissionsRedirect,
    key: "commissions",
    path: "commissions",
    requiredPermissions: [PERMISSIONS.COMMISSION_VIEW],
  },
  {
    // Must precede ":id" so "/applications/<id>/edit" isn't swallowed by the detail route.
    Component: EditApplicationPage,
    key: "edit",
    path: ":id/edit",
    requiredPermissions: [PERMISSIONS.APPLICATIONS_MANAGE],
  },
  {
    Component: ApplicationDetailsPage,
    key: "details",
    path: ":id",
    requiredPermissions: [PERMISSIONS.APPLICATIONS_VIEW],
  },
];
