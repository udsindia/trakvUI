import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type PageHeaderProps = {
  actions?: ReactNode;
  title: string;
  subtitle: string;
};

export function PageHeader({
  actions,
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2.5}
      sx={{
        alignItems: { md: "center" },
        justifyContent: "space-between",
        px: { xs: 2.5, md: 3.5 },
        py: { xs: 2.25, md: 2.75 },
      }}
    >
      <Stack spacing={0.5}>
        <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="body2">
          {subtitle}
        </Typography>
        <Typography sx={{ fontSize: { xs: 28, md: 32 }, lineHeight: 1.1 }} variant="h5">
          {title}
        </Typography>
      </Stack>

      {actions ? <Box sx={{ width: { xs: "100%", md: "auto" } }}>{actions}</Box> : null}
    </Stack>
  );
}
