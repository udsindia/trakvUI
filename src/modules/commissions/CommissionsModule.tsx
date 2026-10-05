import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { CommissionsPage } from "@/modules/commissions/pages/CommissionsPage";

export default function CommissionsModule() {
  return (
    <Routes>
      <Route
        index
        element={
          <PermissionGuard permission={PERMISSIONS.COMMISSION_VIEW}>
            <CommissionsPage />
          </PermissionGuard>
        }
      />
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
