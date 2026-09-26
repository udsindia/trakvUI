import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { universitiesRoutes } from "@/modules/universities/universitiesRoutes";

export default function UniversitiesModule() {
  return (
    <Routes>
      {universitiesRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
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
