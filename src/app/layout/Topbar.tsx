import { useMemo } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import ListAltRounded from "@mui/icons-material/ListAltRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import type { Theme } from "@mui/material/styles";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { MobileMenuButton } from "@/app/layout/Sidebar";
import { SERIF } from "@/shared/ui/vutrakTheme";
import { TOPBAR_HEIGHT } from "@/app/layout/layoutConstants";
import { GlobalSearch } from "@/app/layout/navbar/GlobalSearch";
import { getNavigationItems } from "@/app/layout/navbar/navigation";
import { UserMenu } from "@/app/layout/navbar/UserMenu";
import type { DashboardQuickAction } from "@/modules/dashboard/dashboard.types";

type TopbarProps = {
  modules: ResolvedModule[];
  notificationsCount: number;
  quickActions?: DashboardQuickAction[];
  tenantName: string;
  userName: string;
  userRoles: string[];
  onLogout: () => void;
  onOpenMobileNavigation: () => void;
};

function formatPageSubtitle(tenantName: string) {
  const now = new Date();
  const datePart = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${datePart} · ${tenantName}`;
}

function resolvePageTitle(pathname: string, modules: ResolvedModule[]) {
  const navigationItems = getNavigationItems(modules);

  for (const item of navigationItems) {
    if (item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`))) {
      return item.label;
    }

    for (const child of item.children ?? []) {
      if (child.to && (pathname === child.to || pathname.startsWith(`${child.to}/`))) {
        return child.label;
      }
    }
  }

  return "Dashboard";
}

export function Topbar({
  modules,
  notificationsCount,
  quickActions = [],
  tenantName,
  userName,
  userRoles,
  onLogout,
  onOpenMobileNavigation,
}: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = resolvePageTitle(location.pathname, modules);
  const initials = useMemo(
    () =>
      userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [userName],
  );

  const defaultQuickActions: DashboardQuickAction[] = [
    { icon: "➕", label: "New Lead", href: "/leads/create" },
    { icon: "📄", label: "New Application", href: "/applications/create" },
    // { icon: "✅", label: "Tasks", href: "/activities/tasks" },
  ];

  const actionButtons = quickActions.length ? quickActions : defaultQuickActions;

  const actionButtonIcons = [AddRounded, AssignmentRounded, TaskAltRounded];

  const primaryButtonSx = {
    background: (theme: Theme) =>
      `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.primary.dark} 100%)`,
    border: "1px solid",
    borderColor: "primary.dark",
    borderRadius: "9px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 4px 13px rgba(243,129,24,.28)",
    color: "#fff",
    display: { xs: "none", sm: "inline-flex" },
    fontSize: 11.5,
    fontWeight: 700,
    minWidth: 0,
    px: 1.375,
    py: 0.75,
    textTransform: "none",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "linear-gradient(135deg, #FFAE59 0%, #FF952B 100%)",
      borderColor: "primary.main",
    },
  } as const;

  const secondaryButtonSx = {
    ...primaryButtonSx,
    background: "#fff",
    borderColor: "divider",
    boxShadow: "none",
    color: "text.primary",
    "&:hover": { background: "#F7FAFC", borderColor: "secondary.main", color: "secondary.main" },
  } as const;

  const iconButtonSx = {
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "9px",
    color: "text.secondary",
    height: 32,
    width: 32,
    "&:hover": { borderColor: "secondary.main", color: "secondary.main" },
  } as const;

  return (
    <Box
      component="header"
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        display: "flex",
        flexShrink: 0,
        gap: 1,
        height: TOPBAR_HEIGHT,
        px: 2,
      }}
    >
      <MobileMenuButton onClick={onOpenMobileNavigation} />

      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            fontFamily: SERIF,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.3px",
            lineHeight: 1.15,
          }}
        >
          {pageTitle}
        </Typography>
        <Typography noWrap sx={{ color: "text.disabled", fontSize: 10, mt: 0.125 }}>
          {formatPageSubtitle(tenantName)}
        </Typography>
      </Box>

      <GlobalSearch />

      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", ml: "auto" }}>
        {actionButtons.map((action, index) => {
          const ActionIcon = actionButtonIcons[index] ?? AddRounded;

          return (
            <Button
              key={action.label}
              startIcon={<ActionIcon sx={{ fontSize: 14 }} />}
              sx={index === 0 ? primaryButtonSx : secondaryButtonSx}
              onClick={() => {
                if (!action.href.startsWith("#")) {
                  navigate(action.href);
                }
              }}
            >
              {action.label}
            </Button>
          );
        })}

        <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", sm: "block" }, my: 1.25 }} />

        <IconButton
          aria-label="notifications"
          sx={{ ...iconButtonSx, position: "relative" }}
        >
          <NotificationsNoneRounded sx={{ fontSize: 15 }} />
          {notificationsCount > 0 ? (
            <Box
              sx={{
                bgcolor: "primary.main",
                border: "1.5px solid #fff",
                borderRadius: "50%",
                height: 7,
                position: "absolute",
                right: 5,
                top: 5,
                width: 7,
              }}
            />
          ) : null}
        </IconButton>

        <IconButton
          aria-label="tasks"
          component={RouterLink}
          sx={{ ...iconButtonSx, display: { xs: "none", sm: "inline-flex" } }}
          to="/activities/tasks"
        >
          <ListAltRounded sx={{ fontSize: 15 }} />
        </IconButton>

        <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", sm: "block" }, my: 1.25 }} />

        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <UserMenu userName={userName} userRoles={userRoles} onLogout={onLogout} />
        </Box>

        <Avatar
          sx={{
            background: "linear-gradient(135deg, #007A87, #15A6B8)",
            cursor: "pointer",
            display: { xs: "flex", sm: "none" },
            fontSize: 10,
            fontWeight: 700,
            height: 30,
            width: 30,
          }}
        >
          {initials}
        </Avatar>
      </Stack>
    </Box>
  );
}
