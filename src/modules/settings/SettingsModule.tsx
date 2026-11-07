import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { getDefaultSettingsPath, settingsRoutes } from "@/modules/settings/settingsRoutes";

export default function SettingsModule() {
  const { permissions, roles, tenant } = useAuth();
  const defaultPath = getDefaultSettingsPath(permissions, roles);
  // Pages of a module the tenant's industry switches off fall through to the default page.
  const routes = settingsRoutes.filter(
    (route) => !route.requiredModule || tenant?.enabledModules?.[route.requiredModule] !== false,
  );

  return (
    <Routes>
      {routes.map(
        ({ Component, index, key, path, requiredPermissions, anyOfPermissions }) => (
          <Route
            key={key}
            element={
              <PermissionGuard allOf={requiredPermissions} anyOf={anyOfPermissions}>
                <Component />
              </PermissionGuard>
            }
            index={index}
            path={path}
          />
        ),
      )}
      {/* Absolute: a relative "team" from a splat match appends to the unmatched path
          (/settings/stages/team/team/...) instead of replacing it. */}
      <Route element={<Navigate replace to={`/settings/${defaultPath}`} />} path="*" />
    </Routes>
  );
}
