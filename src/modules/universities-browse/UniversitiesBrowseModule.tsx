import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { UniversitiesBrowsePage } from "@/modules/universities-browse/UniversitiesBrowsePage";

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
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
