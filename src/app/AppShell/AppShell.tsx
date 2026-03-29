import { BrowserRouter } from "react-router-dom";
import { useAppShell } from "@/app/AppShell/useAppShell";
import { AppRouter } from "@/app/router/AppRouter";
import { AppProviders } from "@/app/store/AppProviders";

function AppShellRuntime() {
  const {
    defaultModulePath,
    modules,
    navigationModules,
    notificationsCount,
    onLogout,
    roles,
    tenant,
    user,
  } = useAppShell();

  return (
    <BrowserRouter>
      <AppRouter
        defaultModulePath={defaultModulePath}
        modules={modules}
        navigationModules={navigationModules}
        notificationsCount={notificationsCount}
        roles={roles}
        tenantName={tenant?.tenantName ?? "EduTrack"}
        user={user}
        onLogout={onLogout}
      />
    </BrowserRouter>
  );
}

export function AppShell() {
  return (
    <AppProviders>
      <AppShellRuntime />
    </AppProviders>
  );
}
