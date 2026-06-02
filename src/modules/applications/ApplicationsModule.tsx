import type { PropsWithChildren } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import type { PermissionKey } from "@/config/permissions/permissions";
import { applicationsRoutes } from "@/modules/applications/applicationsRoutes";

function ApplicationPermissionGuard({
  children,
  requiredPermissions,
}: PropsWithChildren<{ requiredPermissions?: PermissionKey[] }>) {
  const { hasPermissions } = useAuth();

  if (requiredPermissions && !hasPermissions(requiredPermissions)) {
    return <Navigate replace to="/unauthorized" />;
  }

  return children;
}

export default function ApplicationsModule() {
  return (
    <Routes>
      {applicationsRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
        <Route
          key={key}
          element={
            <ApplicationPermissionGuard requiredPermissions={requiredPermissions}>
              <Component />
            </ApplicationPermissionGuard>
          }
          index={index}
          path={path}
        />
      ))}
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}

