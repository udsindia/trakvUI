import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { Navbar, NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  closeMobileNavigation,
  openMobileNavigation,
  selectMobileNavigationOpen,
} from "@/app/store/slices/shellSlice";

type MainLayoutProps = {
  modules: ResolvedModule[];
  notificationsCount: number;
  tenantName: string;
  userName: string;
  userRoles: string[];
  onLogout: () => void;
};

export function MainLayout({
  modules,
  notificationsCount,
  tenantName,
  userName,
  userRoles,
  onLogout,
}: MainLayoutProps) {
  const dispatch = useAppDispatch();
  const mobileNavigationOpen = useAppSelector(selectMobileNavigationOpen);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Navbar
        mobileNavigationOpen={mobileNavigationOpen}
        modules={modules}
        notificationsCount={notificationsCount}
        tenantName={tenantName}
        userName={userName}
        userRoles={userRoles}
        onLogout={onLogout}
        onCloseMobileNavigation={() => dispatch(closeMobileNavigation())}
        onOpenMobileNavigation={() => dispatch(openMobileNavigation())}
      />

      <Box
        component="main"
        sx={{
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ mx: "auto", minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
