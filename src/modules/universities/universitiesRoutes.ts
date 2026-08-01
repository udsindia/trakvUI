import type { ComponentType } from "react";
import type { PermissionKey } from "@/config/permissions/permissions";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { CourseDetailsPage } from "@/modules/universities/pages/CourseDetailsPage";
import { CourseSearchPage } from "@/modules/universities/pages/CourseSearchPage";
import { UniversityDetailsPage } from "@/modules/universities/pages/UniversityDetailsPage";

type UniversitiesRouteDefinition = {
  Component: ComponentType;
  index?: boolean;
  key: string;
  path?: string;
  requiredPermissions?: PermissionKey[];
};

export const universitiesRoutes: UniversitiesRouteDefinition[] = [
  {
    Component: CourseSearchPage,
    index: true,
    key: "search",
    requiredPermissions: [PERMISSIONS.UNIVERSITY_VIEW],
  },
  {
    Component: UniversityDetailsPage,
    key: "university",
    path: ":universityId",
    requiredPermissions: [PERMISSIONS.UNIVERSITY_VIEW],
  },
  {
    Component: CourseDetailsPage,
    key: "course",
    path: ":universityId/courses/:courseId",
    requiredPermissions: [PERMISSIONS.UNIVERSITY_VIEW],
  },
];
