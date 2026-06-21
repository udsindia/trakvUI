import { useMemo } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import ListAltRounded from "@mui/icons-material/ListAltRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { MobileMenuButton } from "@/app/layout/Sidebar";
import { TOPBAR_HEIGHT } from "@/app/layout/layoutConstants";
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
    { icon: "✅", label: "Create Task", href: "/activities/tasks" },
  ];

  const actionButtons = quickActions.length ? quickActions : defaultQuickActions;

  const actionButtonIcons = [AddRounded, AssignmentRounded, TaskAltRounded];

  const primaryButtonSx = {
    bgcolor: "primary.main",
    borderRadius: 2,
    color: "#fff",
    display: { xs: "none", sm: "inline-flex" },
    fontSize: 11,
    fontWeight: 700,
    minWidth: 0,
    px: 1.25,
    py: 0.625,
    textTransform: "none",
    whiteSpace: "nowrap",
    "&:hover": { bgcolor: "primary.dark" },
  } as const;

  const secondaryButtonSx = {
    ...primaryButtonSx,
    bgcolor: "#fff",
    border: "1px solid",
    borderColor: "divider",
    color: "text.primary",
    "&:hover": { bgcolor: "#F0F9FA", borderColor: "primary.main" },
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
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{pageTitle}</Typography>
        <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>
          {formatPageSubtitle(tenantName)}
        </Typography>
      </Box>

      <TextField
        placeholder="Search leads, students, apps…"
        size="small"
        sx={{
          display: { xs: "none", sm: "block" },
          flex: 1,
          maxWidth: 240,
          ml: 1.5,
          "& .MuiOutlinedInput-root": {
            bgcolor: "#F0F4F8",
            borderRadius: 2,
            fontSize: 11,
            height: 32,
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: "text.disabled", fontSize: 14 }} />
              </InputAdornment>
            ),
          },
        }}
      />

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
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            height: 32,
            position: "relative",
            width: 32,
          }}
        >
          <NotificationsNoneRounded sx={{ fontSize: 14 }} />
          {notificationsCount > 0 ? (
            <Box
              sx={{
                bgcolor: "secondary.main",
                border: "1.5px solid #fff",
                borderRadius: "50%",
                height: 5,
                position: "absolute",
                right: 5,
                top: 5,
                width: 5,
              }}
            />
          ) : null}
        </IconButton>

        <IconButton
          aria-label="tasks"
          component={RouterLink}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: { xs: "none", sm: "inline-flex" },
            height: 32,
            width: 32,
          }}
          to="/activities/tasks"
        >
          <ListAltRounded sx={{ fontSize: 14 }} />
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
