import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { UniversitiesBrowsePage } from "@/modules/universities-browse/UniversitiesBrowsePage";
import { CourseDetailsPage } from "@/modules/universities/pages/CourseDetailsPage";
import { UniversityDetailsPage } from "@/modules/universities/pages/UniversityDetailsPage";

export default function UniversitiesBrowseModule() {
  return (
    <Routes>
      <Route
        index
        element={
          <PermissionGuard allOf={[PERMISSIONS.UNIVERSITIES_VIEW]}>
            <UniversitiesBrowsePage />
          </PermissionGuard>
        }
      />
      {/*
        A university's detail page belongs under /universities, not under the course
        finder. It used to live at /courses/:id, so opening a university from this list
        highlighted Course Finder in the nav while showing a university — the address bar
        and the navigation disagreed with the page.

        The same pages are still mounted under /courses by the universities module, so
        links already in the wild keep working.
      */}
      <Route
        element={
          <PermissionGuard allOf={[PERMISSIONS.UNIVERSITIES_VIEW]}>
            <UniversityDetailsPage />
          </PermissionGuard>
        }
        path=":universityId"
      />
      <Route
        element={
          <PermissionGuard allOf={[PERMISSIONS.UNIVERSITIES_VIEW]}>
            <CourseDetailsPage />
          </PermissionGuard>
        }
        path=":universityId/courses/:courseId"
      />
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
