import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ApplicationDashboardPage } from "@/modules/applications/pages/ApplicationDashboardPage";
import { AddApplicationPage } from "@/modules/applications/pages/AddApplicationPage";
import { ApplicationDetailsPage } from "@/modules/applications/pages/ApplicationDetailsPage";
import { EditApplicationPage } from "@/modules/applications/pages/EditApplicationPage";

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
