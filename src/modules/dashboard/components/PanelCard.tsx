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
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(16,40,52,.05)",
        display: "flex",
        flex: grow ? 1 : undefined,
        flexDirection: "column",
        minHeight: grow ? 0 : undefined,
        overflow: "hidden",
        p: "14px 16px",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexShrink: 0, justifyContent: "space-between", mb: 1.25 }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.1px" }}>{title}</Typography>
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
        color: "secondary.main",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10.5,
        fontWeight: 700,
        p: 0,
        "&:hover": { textDecoration: "underline" },
      }}
      onClick={onClick}
    >
      {children}
    </Typography>
  );
}
