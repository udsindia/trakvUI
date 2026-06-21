import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
} from "@/app/layout/layoutConstants";
import { Sidebar } from "@/app/layout/Sidebar";
import { Topbar } from "@/app/layout/Topbar";
import { getNavigationItems } from "@/app/layout/navbar/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  closeMobileNavigation,
  openMobileNavigation,
  selectMobileNavigationOpen,
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
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
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const navigationItems = getNavigationItems(modules);
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        items={navigationItems}
        mobileOpen={mobileNavigationOpen}
        primaryRole={userRoles[0] ?? "User"}
        userInitials={userInitials}
        userName={userName}
        onCloseMobile={() => dispatch(closeMobileNavigation())}
        onToggleCollapse={() => dispatch(toggleSidebarCollapsed())}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          ml: { xs: 0, md: `${sidebarWidth}px` },
          overflow: "hidden",
          transition: "margin-left .22s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Topbar
          modules={modules}
          notificationsCount={notificationsCount}
          tenantName={tenantName}
          userName={userName}
          userRoles={userRoles}
          onLogout={onLogout}
          onOpenMobileNavigation={() => dispatch(openMobileNavigation())}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            px: { xs: 2, md: 2 },
            py: { xs: 1.25, md: 1.25 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
