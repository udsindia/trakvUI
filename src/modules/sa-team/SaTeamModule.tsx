import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SaLayout } from "@/modules/sa-team/components/SaLayout";
import { SaDashboardPage } from "@/modules/sa-team/pages/SaDashboardPage";
import { SaLoginPage } from "@/modules/sa-team/pages/SaLoginPage";
import { SaMetaAdsConfigPage } from "@/modules/sa-team/pages/SaMetaAdsConfigPage";
import { SaOnboardTenantPage } from "@/modules/sa-team/pages/SaOnboardTenantPage";
import { SaRolesPage } from "@/modules/sa-team/pages/SaRolesPage";
import { SaSetPasswordPage } from "@/modules/sa-team/pages/SaSetPasswordPage";
import { SaTenantsPage } from "@/modules/sa-team/pages/SaTenantsPage";
import { SaUniversitiesPage } from "@/modules/sa-team/pages/SaUniversitiesPage";
import { SaUniversityDetailRoutePage } from "@/modules/sa-team/pages/SaUniversityDetailRoutePage";
import { SaUsersPage } from "@/modules/sa-team/pages/SaUsersPage";
import { SaWhatsAppConfigPage } from "@/modules/sa-team/pages/SaWhatsAppConfigPage";
import { saAuthService } from "@/modules/sa-team/saAuthService";

function SaAuthGuard() {
  const session = saAuthService.restore();
  if (!session) {
    return <Navigate replace to="/sa/login" />;
  }
  return <Outlet />;
}

export default function SaTeamModule() {
  return (
    <Routes>
      <Route path="login" element={<SaLoginPage />} />
      <Route path="set-password" element={<SaSetPasswordPage />} />
      <Route element={<SaAuthGuard />}>
        <Route element={<SaLayout />}>
          <Route index element={<Navigate replace to="dashboard" />} />
          <Route path="dashboard" element={<SaDashboardPage />} />
          <Route path="tenants" element={<SaTenantsPage />} />
          <Route path="onboard" element={<SaOnboardTenantPage />} />
          <Route path="whatsapp" element={<SaWhatsAppConfigPage />} />
          <Route path="meta-ads" element={<SaMetaAdsConfigPage />} />
          <Route path="universities" element={<SaUniversitiesPage />} />
          <Route path="universities/:universityId" element={<SaUniversityDetailRoutePage />} />
          <Route path="team" element={<SaUsersPage />} />
          <Route path="roles" element={<SaRolesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
