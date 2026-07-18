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
        borderRadius: 2,
        boxShadow: active ? sidebar.activeShadow : "none",
        color: active ? sidebar.activeText : sidebar.text,
        display: "flex",
        fontSize: 12,
        fontWeight: 600,
        gap: 1.25,
        mb: 0.125,
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
          fontSize: 18,
          width: 18,
        },
      }}
      to={item.to}
      onClick={onNavigate}
    >
      <Box sx={{ flexShrink: 0, textAlign: "center", width: 18 }}>{item.icon}</Box>
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
    ["dashboard", "lead", "applications", "universities"].includes(item.id),
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
  const adminItems =
    settingsItem?.children?.map((child) => ({
      ...child,
      icon: child.id.endsWith(".team") ? <PeopleRounded /> : <AdminPanelSettingsRounded />,
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
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 1.4,
              px: 1.125,
              py: 1,
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
        spacing={1}
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
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
            borderRadius: 2.25,
            color: "#fff",
            display: "flex",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 900,
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          T
        </Box>
        {!collapsed ? (
          <Typography noWrap sx={{ color: sidebar.strongText, fontSize: 14, fontWeight: 800 }}>
            Trakv
          </Typography>
        ) : null}
        {showCollapseToggle && onToggleCollapse ? (
          <IconButton
            size="small"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.75,
              color: sidebar.text,
              height: 26,
              ml: "auto",
              width: 26,
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
          borderColor: "divider",
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
            borderRadius: 2,
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
              background: sidebar.brandGradient,
              borderRadius: "50%",
              color: "#fff",
              display: "flex",
              flexShrink: 0,
              fontSize: 10,
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
              <Typography noWrap sx={{ color: sidebar.strongText, fontSize: 11, fontWeight: 700 }}>
                {userName}
              </Typography>
              <Typography noWrap sx={{ color: sidebar.mutedText, fontSize: 9 }}>
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
          borderColor: "divider",
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
        <Box sx={{ width: SIDEBAR_WIDTH }}>
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
