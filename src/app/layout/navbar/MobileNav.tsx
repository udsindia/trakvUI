import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type { NavigationItem } from "@/app/layout/navbar/navigation";
import { NavItem } from "@/app/layout/navbar/NavItem";

type MobileNavProps = {
  items: NavigationItem[];
  open: boolean;
  tenantName: string;
  topOffset: number;
  onClose: () => void;
};

const MOBILE_DRAWER_WIDTH = 320;

export function MobileNav({
  items,
  open,
  tenantName,
  topOffset,
  onClose,
}: MobileNavProps) {
  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          boxSizing: "border-box",
          height: `calc(100% - ${topOffset}px)`,
          top: `${topOffset}px`,
          width: MOBILE_DRAWER_WIDTH,
        },
      }}
      open={open}
      sx={{ display: { xs: "block", lg: "none" } }}
      variant="temporary"
      onClose={onClose}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
          sx={{ alignItems: "center", px: 2, py: 1.75 }}
        >
          <Box>
            <Typography variant="subtitle1">Navigation</Typography>
            <Typography color="text.secondary" variant="body2">
              {tenantName}
            </Typography>
          </Box>

          <IconButton aria-label="Close navigation" edge="end" onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>

        <Divider />

        <Stack spacing={0.5} sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
          {items.map((item) => (
            <NavItem key={item.id} item={item} variant="mobile" onNavigate={onClose} />
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}
