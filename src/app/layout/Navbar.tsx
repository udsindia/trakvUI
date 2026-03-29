import { useEffect, useMemo } from "react";
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { DesktopNav } from "@/app/layout/navbar/DesktopNav";
import { MobileNav } from "@/app/layout/navbar/MobileNav";
import { UserMenu } from "@/app/layout/navbar/UserMenu";
import { getNavigationItems } from "@/app/layout/navbar/navigation";

export const NAVBAR_HEIGHT = 72;

type NavbarProps = {
  modules: ResolvedModule[];
  mobileNavigationOpen: boolean;
  notificationsCount: number;
  tenantName: string;
  userName: string;
  userRoles: string[];
  onLogout: () => void;
  onCloseMobileNavigation: () => void;
  onOpenMobileNavigation: () => void;
};

export function Navbar({
  modules,
  mobileNavigationOpen,
  notificationsCount,
  tenantName,
  userName,
  userRoles,
  onLogout,
  onCloseMobileNavigation,
  onOpenMobileNavigation,
}: NavbarProps) {
  const theme = useTheme();
  const isDesktopNavigation = useMediaQuery(theme.breakpoints.up("lg"));
  const navigationItems = useMemo(() => getNavigationItems(modules), [modules]);

  useEffect(() => {
    if (isDesktopNavigation && mobileNavigationOpen) {
      onCloseMobileNavigation();
    }
  }, [isDesktopNavigation, mobileNavigationOpen, onCloseMobileNavigation]);

  return (
    <>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          top: 0,
          zIndex: (currentTheme) => currentTheme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            gap: 2,
            justifyContent: "space-between",
            minHeight: `${NAVBAR_HEIGHT}px !important`,
            px: { xs: 2, md: 3 },
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2.5 }}
            sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
          >
            <IconButton
              edge="start"
              sx={{ display: { xs: "inline-flex", lg: "none" } }}
              onClick={onOpenMobileNavigation}
            >
              <MenuRounded />
            </IconButton>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
              <Box
                sx={{
                  alignItems: "center",
                  background:
                    "linear-gradient(135deg, rgba(15,90,212,1) 0%, rgba(0,137,123,1) 100%)",
                  borderRadius: 2.5,
                  color: "common.white",
                  display: "grid",
                  height: 42,
                  placeItems: "center",
                  width: 42,
                }}
              >
                <Typography variant="subtitle2">ET</Typography>
              </Box>

              <Stack sx={{ minWidth: 0 }} spacing={0.25}>
                <Typography noWrap variant="subtitle1">
                  EduTrack
                </Typography>
                <Typography color="text.secondary" noWrap variant="body2">
                  {tenantName}
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, minWidth: 0 }}>
              <DesktopNav items={navigationItems} />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
            <IconButton aria-label="notifications">
              <Badge badgeContent={notificationsCount} color="primary">
                <NotificationsNoneRounded />
              </Badge>
            </IconButton>

            <UserMenu userName={userName} userRoles={userRoles} onLogout={onLogout} />
          </Stack>
        </Toolbar>
      </AppBar>

      <MobileNav
        items={navigationItems}
        open={mobileNavigationOpen}
        tenantName={tenantName}
        topOffset={NAVBAR_HEIGHT}
        onClose={onCloseMobileNavigation}
      />
    </>
  );
}
