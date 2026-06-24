import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SuperAdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function SuperAdminPageHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: SuperAdminPageHeaderProps) {
  return (
    <Stack
      alignItems={{ xs: "stretch", sm: "center" }}
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      spacing={2}
    >
      <Stack spacing={0.5}>
        <Typography color="text.secondary" variant="overline">
          {eyebrow}
        </Typography>
        <Typography variant="h4">{title}</Typography>
        {subtitle ? (
          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      {actions}
    </Stack>
  );
}
