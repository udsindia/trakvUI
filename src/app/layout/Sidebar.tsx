import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import AltRouteRounded from "@mui/icons-material/AltRouteRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import {
  isNavigationItemActive,
  type NavigationItem,
} from "@/app/layout/navbar/navigation";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
  TOPBAR_HEIGHT,
} from "@/app/layout/layoutConstants";
import { SERIF } from "@/shared/ui/vutrakTheme";

type SidebarNavItemProps = {
  collapsed: boolean;
  item: NavigationItem;
  onNavigate?: () => void;
};

function SidebarNavItem({ collapsed, item, onNavigate }: SidebarNavItemProps) {
  const location = useLocation();
  const sidebar = useTheme().palette.sidebar;
  const active = isNavigationItemActive(location.pathname, item);

  if (!item.to) {
    return null;
  }

  const content = (
    <Box
      component={NavLink}
      sx={{
        alignItems: "center",
        background: active ? sidebar.activeBg : "transparent",
        // Explicit px: the theme radius multiplier would round nav rows into
        // pills, which fights the squarer Meridian chrome.
        borderRadius: "8px",
        boxShadow: active ? sidebar.activeShadow : "none",
        color: active ? sidebar.activeText : sidebar.text,
        display: "flex",
        fontSize: 12.5,
        fontWeight: 600,
        gap: 1.25,
        mb: 0.25,
        px: 1.125,
        py: 1,
        textDecoration: "none",
        transition: "background .12s, color .12s",
        whiteSpace: "nowrap",
        "&:hover": {
          bgcolor: active ? undefined : sidebar.hoverBg,
          color: active ? sidebar.activeText : sidebar.hoverText,
        },
        "& .MuiSvgIcon-root": {
          fontSize: 17,
          width: 17,
        },
      }}
      to={item.to}
      onClick={onNavigate}
    >
      <Box sx={{ flexShrink: 0, textAlign: "center", width: 17 }}>{item.icon}</Box>
      {!collapsed ? (
        <>
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            {item.label}
          </Box>
        </>
      ) : null}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip placement="right" title={item.label}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

type SidebarContentProps = {
  collapsed: boolean;
  items: NavigationItem[];
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  primaryRole: string;
  showCollapseToggle?: boolean;
  userInitials: string;
  userName: string;
};

function SidebarContent({
  collapsed,
  items,
  onNavigate,
  onToggleCollapse,
  primaryRole,
  showCollapseToggle = true,
  userInitials,
  userName,
}: SidebarContentProps) {
  const sidebar = useTheme().palette.sidebar;
  const mainItems = items.filter((item) =>
    ["dashboard", "lead", "students", "applications", "universities", "universities-browse"].includes(
      item.id,
    ),
  );
  const activitiesItem = items.find((item) => item.id === "activities");
  const tasksItem = activitiesItem?.children?.find((child) => child.id.endsWith(".tasks"));
  const engageItems = [
    ...(activitiesItem
      ? [{ ...activitiesItem, to: "/activities/feed", children: undefined }]
      : []),
    ...(tasksItem
      ? [
          {
            ...tasksItem,
            id: "tasks",
            label: "Tasks",
            icon: <TaskAltRounded />,
          },
        ]
      : []),
  ];
  const settingsItem = items.find((item) => item.id === "settings");
  // Keyed on the child's suffix rather than chained ternaries, so the next settings
  // page is one line here instead of another branch.
  const adminIcons: Record<string, ReactNode> = {
    team: <PeopleRounded />,
    stages: <AltRouteRounded />,
  };
  const adminItems =
    settingsItem?.children?.map((child) => ({
      ...child,
      icon: adminIcons[child.id.split(".").pop() ?? ""] ?? <AdminPanelSettingsRounded />,
    })) ?? [];

  const renderGroup = (label: string, groupItems: NavigationItem[]) => {
    if (!groupItems.length) {
      return null;
    }

    return (
      <Box key={label}>
        {!collapsed ? (
          <Typography
            sx={{
              color: sidebar.mutedText,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 1.1,
              px: 1.125,
              pb: 0.75,
              pt: 1.5,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
        ) : null}
        {groupItems.map((item) => (
          <SidebarNavItem
            collapsed={collapsed}
            item={item}
            key={item.id}
            onNavigate={onNavigate}
          />
        ))}
      </Box>
    );
  };

  return (
    <Stack sx={{ height: "100%" }}>
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: sidebar.line,
          flexShrink: 0,
          height: TOPBAR_HEIGHT,
          overflow: "hidden",
          px: 1.5,
          whiteSpace: "nowrap",
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            background: sidebar.brandGradient,
            borderRadius: "9px",
            color: "#fff",
            display: "flex",
            flexShrink: 0,
            fontFamily: SERIF,
            fontSize: 15,
            fontWeight: 600,
            height: 30,
            justifyContent: "center",
            width: 30,
          }}
        >
          T
        </Box>
        {!collapsed ? (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: sidebar.strongText,
                fontFamily: SERIF,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                lineHeight: 1.1,
              }}
            >
              VUTrak
            </Typography>
            <Typography
              noWrap
              sx={{
                color: sidebar.mutedText,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Education CRM
            </Typography>
          </Box>
        ) : null}
        {showCollapseToggle && onToggleCollapse ? (
          <IconButton
            size="small"
            sx={{
              border: "1px solid",
              borderColor: sidebar.line,
              borderRadius: "7px",
              color: sidebar.text,
              height: 26,
              ml: "auto",
              width: 26,
              "&:hover": { bgcolor: sidebar.hoverBg },
            }}
            onClick={onToggleCollapse}
          >
            <ChevronLeftRounded
              sx={{
                fontSize: 14,
                transform: collapsed ? "rotate(180deg)" : "none",
                transition: "transform .22s",
              }}
            />
          </IconButton>
        ) : null}
      </Stack>

      <Box sx={{ flex: 1, overflowX: "hidden", overflowY: "auto", px: 0.875, py: 1 }}>
        {renderGroup("Main", mainItems)}
        {renderGroup("Engage", engageItems)}
        {renderGroup("Admin", adminItems)}
      </Box>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: sidebar.line,
          flexShrink: 0,
          px: 0.875,
          py: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={1.125}
          sx={{
            alignItems: "center",
            bgcolor: collapsed ? "transparent" : sidebar.inset,
            borderRadius: "10px",
            cursor: "pointer",
            overflow: "hidden",
            px: 1.125,
            py: 0.875,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: sidebar.hoverBg },
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              // Steel-teal, so the orange gradient stays reserved for the
              // active nav row and primary CTAs.
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.dark})`,
              borderRadius: "50%",
              color: "#fff",
              display: "flex",
              flexShrink: 0,
              fontSize: 10.5,
              fontWeight: 700,
              height: 30,
              justifyContent: "center",
              width: 30,
            }}
          >
            {userInitials}
          </Box>
          {!collapsed ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ color: sidebar.strongText, fontSize: 11.5, fontWeight: 700, lineHeight: 1.25 }}
              >
                {userName}
              </Typography>
              <Typography noWrap sx={{ color: sidebar.mutedText, fontSize: 9.5 }}>
                {primaryRole}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}

type SidebarProps = {
  collapsed: boolean;
  items: NavigationItem[];
  mobileOpen: boolean;
  primaryRole: string;
  userInitials: string;
  userName: string;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export function Sidebar({
  collapsed,
  items,
  mobileOpen,
  primaryRole,
  userInitials,
  userName,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      <Box
        component="aside"
        sx={{
          background: (theme) => theme.palette.sidebar.bg,
          borderRight: "1px solid",
          borderColor: (theme) => theme.palette.sidebar.line,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          left: 0,
          overflow: "hidden",
          position: "fixed",
          top: 0,
          transition: "width .22s cubic-bezier(.4,0,.2,1)",
          width: sidebarWidth,
          zIndex: (theme) => theme.zIndex.drawer,
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          items={items}
          primaryRole={primaryRole}
          userInitials={userInitials}
          userName={userName}
          onToggleCollapse={onToggleCollapse}
        />
      </Box>

      <Drawer
        ModalProps={{ keepMounted: true }}
        open={mobileOpen}
        PaperProps={{ sx: { background: (theme) => theme.palette.sidebar.bg } }}
        sx={{ display: { xs: "block", md: "none" } }}
        variant="temporary"
        onClose={onCloseMobile}
      >
        {/* Full height so SidebarContent's `height: 100%` resolves and the
            user chip pins to the bottom instead of floating mid-drawer. */}
        <Box sx={{ height: "100%", width: SIDEBAR_WIDTH }}>
          <SidebarContent
            collapsed={false}
            items={items}
            primaryRole={primaryRole}
            showCollapseToggle={false}
            userInitials={userInitials}
            userName={userName}
            onNavigate={onCloseMobile}
          />
        </Box>
      </Drawer>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      edge="start"
      sx={{ display: { md: "none" } }}
      onClick={onClick}
    >
      <MenuRounded />
    </IconButton>
  );
}
