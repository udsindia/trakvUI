import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { superAdminRoutes } from "@/modules/super-admin/superAdminRoutes";

export default function SuperAdminModule() {
  return (
    <Routes>
      {superAdminRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
        <Route
          key={key}
          element={
            <PermissionGuard allOf={requiredPermissions}>
              <Component />
            </PermissionGuard>
          }
          index={index}
          path={path}
        />
      ))}
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
