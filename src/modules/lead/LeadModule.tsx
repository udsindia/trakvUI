import type { PropsWithChildren } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import type { PermissionKey } from "@/config/permissions/permissions";
import { leadRoutes } from "@/modules/lead/leadRoutes";

function LeadPermissionGuard({
  children,
  requiredPermissions,
}: PropsWithChildren<{ requiredPermissions?: PermissionKey[] }>) {
  const { hasPermissions } = useAuth();

  if (requiredPermissions && !hasPermissions(requiredPermissions)) {
    return <Navigate replace to="/unauthorized" />;
  }

  return children;
}

export default function LeadModule() {
  return (
    <Routes>
      {leadRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
        <Route
          key={key}
          element={
            <LeadPermissionGuard requiredPermissions={requiredPermissions}>
              <Component />
            </LeadPermissionGuard>
          }
          index={index}
          path={path}
        />
      ))}
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
