import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { StudentsListPage } from "@/modules/students/pages/StudentsListPage";

type StudentRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const studentsRoutes: StudentRouteDefinition[] = [
  {
    Component: StudentsListPage,
    index: true,
    key: "list",
    requiredPermissions: [PERMISSIONS.STUDENTS_VIEW],
  },
];
