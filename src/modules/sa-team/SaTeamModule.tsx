import { Navigate, Route, Routes } from "react-router-dom";
import { SaLoginPage } from "./pages/SaLoginPage";
import { SaSetPasswordPage } from "./pages/SaSetPasswordPage";
import { SaUsersPage } from "./pages/SaUsersPage";
import { SaRolesPage } from "./pages/SaRolesPage";
import { SaLayout } from "./components/SaLayout";
import { saAuthService } from "./saAuthService";

function SaAuthGuard({ children }: { children: React.ReactNode }) {
  const session = saAuthService.restore();
  if (!session) return <Navigate replace to="/sa/login" />;
  return <>{children}</>;
}

export default function SaTeamModule() {
  return (
    <Routes>
      <Route path="login" element={<SaLoginPage />} />
      <Route path="set-password" element={<SaSetPasswordPage />} />
      <Route
        path="*"
        element={
          <SaAuthGuard>
            <SaLayout />
          </SaAuthGuard>
        }
      >
        <Route path="team" element={<SaUsersPage />} />
        <Route path="roles" element={<SaRolesPage />} />
        <Route index element={<Navigate replace to="team" />} />
      </Route>
    </Routes>
  );
}
