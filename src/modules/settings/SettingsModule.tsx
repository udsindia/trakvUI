import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { getDefaultSettingsPath, settingsRoutes } from "@/modules/settings/settingsRoutes";

export default function SettingsModule() {
  const { permissions, roles } = useAuth();
  const defaultPath = getDefaultSettingsPath(permissions, roles);

  return (
    <Routes>
      {settingsRoutes.map(
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
      <Route element={<Navigate replace to={defaultPath} />} path="*" />
    </Routes>
  );
}
