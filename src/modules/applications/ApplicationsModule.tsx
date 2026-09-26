import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { applicationsRoutes } from "@/modules/applications/applicationsRoutes";

export default function ApplicationsModule() {
  return (
    <Routes>
      {applicationsRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
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

