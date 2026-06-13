import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SettingsPageHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
};

export function SettingsPageHeader({ actions, eyebrow, title }: SettingsPageHeaderProps) {
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
      </Stack>
      {actions}
    </Stack>
  );
}
