import { useMemo, useState } from "react";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

type UserMenuProps = {
  userName: string;
  userRoles: string[];
  onLogout: () => void;
};

export function UserMenu({ userName, userRoles, onLogout }: UserMenuProps) {
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
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

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Button
        color="inherit"
        endIcon={<LogoutRounded />}
        sx={{ display: { xs: "none", sm: "inline-flex" } }}
        variant="outlined"
        onClick={onLogout}
      >
        Logout
      </Button>

      <IconButton onClick={(event) => setProfileAnchor(event.currentTarget)}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2">{userName}</Typography>
          <Typography color="text.secondary" variant="body2">
            {userRoles.join(" · ")}
          </Typography>
        </Box>
        <Divider />
        <MenuItem disabled>Profile settings coming soon</MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            onLogout();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </Stack>
  );
}
