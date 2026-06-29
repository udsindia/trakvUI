import AddBusinessRounded from "@mui/icons-material/AddBusinessRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import CampaignRounded from "@mui/icons-material/CampaignRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SecurityRounded from "@mui/icons-material/SecurityRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from "@mui/material";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";

const DRAWER_WIDTH = 240;
const SA_TEAL = "#0d7a7a";

interface NavItem {
  label: string;
  to: string;
  Icon: React.ElementType;
  permission?: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    heading: "Platform",
    items: [
      { label: "Dashboard", to: "/sa/dashboard", Icon: DashboardRounded, permission: SA_PERMISSIONS.DASHBOARD_VIEW },
      { label: "Tenants", to: "/sa/tenants", Icon: BusinessRounded, permission: SA_PERMISSIONS.TENANTS_VIEW },
    ],
  },
  {
    heading: "Onboarding",
    items: [
      { label: "Onboard Tenant", to: "/sa/onboard", Icon: AddBusinessRounded, permission: SA_PERMISSIONS.TENANTS_ONBOARD },
    ],
  },
  {
    heading: "Integrations",
    items: [
      { label: "Meta Ads Config", to: "/sa/meta-ads", Icon: CampaignRounded, permission: SA_PERMISSIONS.META_CONFIG_VIEW },
      { label: "WhatsApp Config", to: "/sa/whatsapp", Icon: WhatsAppIcon, permission: SA_PERMISSIONS.WHATSAPP_CONFIG_VIEW },
    ],
  },
  {
    heading: "Team",
    items: [
      { label: "SA Users", to: "/sa/team", Icon: GroupsRounded, permission: SA_PERMISSIONS.USERS_MANAGE },
      { label: "Roles & Permissions", to: "/sa/roles", Icon: SecurityRounded, permission: SA_PERMISSIONS.ROLES_MANAGE },
    ],
  },
];

function NavItemRow({ item }: { item: NavItem }) {
  const { label, to, Icon } = item;
  return (
    <NavLink to={to} style={{ textDecoration: "none", color: "inherit" }}>
      {({ isActive }) => (
        <ListItemButton
          selected={isActive}
          sx={{
            borderRadius: 1,
            mx: 1,
            "&.Mui-selected": { bgcolor: "#e0f2f2" },
            "&.Mui-selected .MuiListItemIcon-root": { color: SA_TEAL },
            "&.Mui-selected .MuiListItemText-primary": { color: SA_TEAL, fontWeight: 700 },
            "&.Mui-selected:hover": { bgcolor: "#c8ecec" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Icon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={label} primaryTypographyProps={{ variant: "body2" }} />
        </ListItemButton>
      )}
    </NavLink>
  );
}

export function SaLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    saAuthService.clear();
    navigate("/sa/login");
  }

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || saAuthService.hasPermission(item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{ bgcolor: SA_TEAL, zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography sx={{ flexGrow: 1, fontWeight: 700 }} variant="h6">
            VUTrak SuperAdmin
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutRounded />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            pt: 8,
          },
        }}
      >
        {visibleSections.map((section, idx) => (
          <Box key={section.heading}>
            {idx > 0 && <Divider sx={{ my: 0.5 }} />}
            <List
              disablePadding
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{ fontSize: "0.7rem", letterSpacing: "0.08em", lineHeight: 2 }}
                >
                  {section.heading}
                </ListSubheader>
              }
            >
              {section.items.map((item) => (
                <NavItemRow key={item.to} item={item} />
              ))}
            </List>
          </Box>
        ))}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, pt: 12 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
