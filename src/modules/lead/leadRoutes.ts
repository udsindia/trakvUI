import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { AddLeadPage } from "@/modules/lead/pages/AddLeadPage";
import { EditLeadPage } from "@/modules/lead/pages/EditLeadPage";
import { LeadDashboardPage } from "@/modules/lead/pages/LeadDashboardPage";
import { LeadDetailsPage } from "@/modules/lead/pages/LeadDetailsPage";

type LeadRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const leadRoutes: LeadRouteDefinition[] = [
  {
    Component: LeadDashboardPage,
    index: true,
    key: "dashboard",
  },
  {
    Component: AddLeadPage,
    key: "create",
    path: "create",
    requiredPermissions: [PERMISSIONS.LEAD_CREATE],
  },
  {
    Component: EditLeadPage,
    key: "edit",
    path: ":id/edit",
    requiredPermissions: [PERMISSIONS.LEAD_MANAGE],
  },
  {
    Component: LeadDetailsPage,
    key: "details",
    path: ":id",
    requiredPermissions: [PERMISSIONS.LEAD_VIEW],
  },
];
