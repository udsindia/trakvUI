import { useLocation, useNavigate } from "react-router-dom";
import { Tab, Tabs } from "@mui/material";
import { useAuth } from "@/app/auth/authHooks";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";

/**
 * "Applications | Commissions" above the applications list.
 *
 * Renders nothing for anyone without commission access, so a counsellor's screen is
 * exactly what it was.
 */
export function ApplicationsSectionTabs() {
  const { hasPermissions } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!hasPermissions([PERMISSIONS.COMMISSION_VIEW])) return null;

  const value = pathname.startsWith(applicationsRoutePaths.commissions)
    ? applicationsRoutePaths.commissions
    : applicationsRoutePaths.dashboard;

  return (
    <Tabs
      sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0.5, textTransform: "none" } }}
      value={value}
      onChange={(_event, next: string) => navigate(next)}
    >
      <Tab label="Applications" value={applicationsRoutePaths.dashboard} />
      <Tab label="Commissions" value={applicationsRoutePaths.commissions} />
    </Tabs>
  );
}
