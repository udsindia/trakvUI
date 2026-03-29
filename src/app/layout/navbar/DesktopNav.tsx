import { Stack } from "@mui/material";
import type { NavigationItem } from "@/app/layout/navbar/navigation";
import { NavItem } from "@/app/layout/navbar/NavItem";

type DesktopNavProps = {
  items: NavigationItem[];
};

export function DesktopNav({ items }: DesktopNavProps) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
        minWidth: 0,
        overflowX: "auto",
        pb: 0.5,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {items.map((item) => (
        <NavItem key={item.id} item={item} variant="desktop" />
      ))}
    </Stack>
  );
}
