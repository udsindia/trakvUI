import { Navigate, Route, Routes } from "react-router-dom";
import type { AuthenticatedUser } from "@/app/auth/auth.types";
import { LoginPage } from "@/app/auth/LoginPage";
import { MainLayout } from "@/app/layout/MainLayout";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { AuthGuard, ModuleGuard } from "@/app/router/guards";
import { ROLE_LABELS, type RoleKey } from "@/config/roles/roles";
import { FeedbackState } from "@/shared/components/FeedbackState";

type AppRouterProps = {
  defaultModulePath: string;
  modules: ResolvedModule[];
  navigationModules: ResolvedModule[];
  notificationsCount: number;
  roles: RoleKey[];
  tenantName: string;
  user: AuthenticatedUser | null;
  onLogout: () => void;
};

export function AppRouter({
  defaultModulePath,
  modules,
  navigationModules,
  notificationsCount,
  roles,
  tenantName,
  user,
  onLogout,
}: AppRouterProps) {
  const userName = user?.name ?? "Guest User";
  const userRoles = roles.map((role) => ROLE_LABELS[role]);

  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      <Route element={<AuthGuard />}>
        <Route
          element={
            <MainLayout
              modules={navigationModules}
              notificationsCount={notificationsCount}
              tenantName={tenantName}
              userName={userName}
              userRoles={userRoles}
              onLogout={onLogout}
            />
          }
          path="/"
        >
          <Route element={<Navigate replace to={defaultModulePath} />} index />
          <Route
            element={
              <FeedbackState
                eyebrow="Access Control"
                title="You do not have access to this area"
                description="RBAC is active and the current user does not satisfy the role or permission requirements for the requested route."
              />
            }
            path="unauthorized"
          />
          {modules.map((module) => (
            <Route
              key={module.key}
              element={<ModuleGuard module={module} />}
              path={`${module.path}/*`}
            />
          ))}
          <Route
            element={
              <FeedbackState
                eyebrow="Not Found"
                title="The requested route does not exist"
                description="The application shell is active, but only the module landing routes defined in the registry are available right now."
              />
            }
            path="*"
          />
        </Route>
      </Route>

      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}
