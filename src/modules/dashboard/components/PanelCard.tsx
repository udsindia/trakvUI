import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PanelCardProps = {
  action?: ReactNode;
  children: ReactNode;
  grow?: boolean;
  title: string;
};

export function PanelCard({ action, children, grow = false, title }: PanelCardProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid rgba(229,231,235,.5)",
        borderRadius: 2.5,
        boxShadow: "0 4px 16px rgba(0,0,0,.07)",
        display: "flex",
        flex: grow ? 1 : undefined,
        flexDirection: "column",
        minHeight: grow ? 0 : undefined,
        overflow: "hidden",
        p: "11px 13px",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexShrink: 0, justifyContent: "space-between", mb: 1 }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{title}</Typography>
        {action}
      </Stack>
      <Box sx={{ display: "flex", flex: grow ? 1 : undefined, flexDirection: "column", minHeight: grow ? 0 : undefined }}>
        {children}
      </Box>
    </Box>
  );
}

export function PanelLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Typography
      component="button"
      sx={{
        background: "none",
        border: "none",
        color: "primary.main",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 600,
        p: 0,
        "&:hover": { textDecoration: "underline" },
      }}
      onClick={onClick}
    >
      {children}
    </Typography>
  );
}
