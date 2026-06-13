import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { isSuperAdmin } from "@/config/roles/superAdmin";
import { AddUserPage } from "@/modules/settings/pages/AddUserPage";
import { CreateRolePage } from "@/modules/settings/pages/CreateRolePage";
import { EditRolePage } from "@/modules/settings/pages/EditRolePage";
import { RolesPage } from "@/modules/settings/pages/RolesPage";
import { TeamPage } from "@/modules/settings/pages/TeamPage";
import {
  hasAllPermissions,
  hasAnyPermission,
} from "@/shared/utils/permissions";

type SettingsRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
  anyOfPermissions?: PermissionKey[];
};

export const settingsRoutes: SettingsRouteDefinition[] = [
  {
    Component: TeamPage,
    index: true,
    key: "team-index",
    anyOfPermissions: [
      PERMISSIONS.SETTINGS_TENANT,
      PERMISSIONS.TEAM_INVITE,
      PERMISSIONS.USERS_VIEW,
    ],
  },
  {
    Component: TeamPage,
    key: "team",
    path: "team",
    anyOfPermissions: [
      PERMISSIONS.SETTINGS_TENANT,
      PERMISSIONS.TEAM_INVITE,
      PERMISSIONS.USERS_VIEW,
    ],
  },
  {
    Component: AddUserPage,
    key: "add-user",
    path: "team/create",
    anyOfPermissions: [PERMISSIONS.TEAM_INVITE, PERMISSIONS.USERS_MANAGE],
  },
  {
    Component: RolesPage,
    key: "roles",
    path: "roles",
    anyOfPermissions: [PERMISSIONS.ROLES_VIEW, PERMISSIONS.SETTINGS_TENANT],
  },
  {
    Component: CreateRolePage,
    key: "create-role",
    path: "roles/create",
    requiredPermissions: [PERMISSIONS.ROLES_MANAGE],
  },
  {
    Component: EditRolePage,
    key: "edit-role",
    path: "roles/:roleId/edit",
    anyOfPermissions: [PERMISSIONS.ROLES_VIEW, PERMISSIONS.ROLES_MANAGE],
  },
];

export function getDefaultSettingsPath(
  permissions: PermissionKey[],
  roles: string[] = [],
) {
  if (isSuperAdmin(roles)) {
    return "team";
  }

  const firstAccessibleRoute = settingsRoutes.find((route) => {
    if (route.anyOfPermissions?.length) {
      return hasAnyPermission(permissions, route.anyOfPermissions, roles);
    }

    return hasAllPermissions(
      permissions,
      route.requiredPermissions ?? [],
      roles,
    );
  });

  return firstAccessibleRoute?.path ?? "team";
}
