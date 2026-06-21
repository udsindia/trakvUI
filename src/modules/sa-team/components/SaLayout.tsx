import GroupRounded from "@mui/icons-material/GroupRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SecurityRounded from "@mui/icons-material/SecurityRounded";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";

const DRAWER_WIDTH = 220;
const SA_TEAL = "#0d7a7a";

const navItems = [
  { label: "SA Users", to: "/sa/team", icon: <GroupRounded /> },
  { label: "Roles & Permissions", to: "/sa/roles", icon: <SecurityRounded /> },
];

export function SaLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    saAuthService.clear();
    navigate("/sa/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: SA_TEAL,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, letterSpacing: 0.5 }}>
            VUTrak SuperAdmin
          </Typography>
          <Tooltip title="Sign out">
            <IconButton color="inherit" onClick={handleLogout} aria-label="Sign out">
              <LogoutRounded />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Left Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Toolbar /> {/* offset for AppBar */}
        <Box sx={{ overflow: "auto", pt: 1 }}>
          <List disablePadding>
            {navItems.map((item) => (
              <ListItem key={item.to} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    "&.active": {
                      bgcolor: `${SA_TEAL}18`,
                      color: SA_TEAL,
                      "& .MuiListItemIcon-root": { color: SA_TEAL },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          p: 3,
          mt: "64px", // AppBar height
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
