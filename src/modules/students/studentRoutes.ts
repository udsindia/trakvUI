import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { StudentDashboardPage } from "@/modules/students/pages/StudentDashboardPage";
import { StudentDetailsPage } from "@/modules/students/pages/StudentDetailsPage";
import { EditStudentPage } from "@/modules/students/pages/EditStudentPage";

type StudentRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const studentRoutes: StudentRouteDefinition[] = [
  {
    Component: StudentDashboardPage,
    index: true,
    key: "dashboard",
    requiredPermissions: [PERMISSIONS.STUDENTS_VIEW],
  },
  {
    Component: EditStudentPage,
    key: "edit",
    // Declared before ":id" so the edit segment isn't swallowed by the detail route.
    path: ":id/edit",
    requiredPermissions: [PERMISSIONS.STUDENTS_MANAGE],
  },
  {
    Component: StudentDetailsPage,
    key: "details",
    path: ":id",
    requiredPermissions: [PERMISSIONS.STUDENTS_VIEW],
  },
];
