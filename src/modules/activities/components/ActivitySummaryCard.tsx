import { memo, type ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Paper, Stack, Typography } from "@mui/material";

type ActivitySummaryCardProps = {
  accentColor: string;
  icon: ReactNode;
  label: string;
  value: number;
};

function ActivitySummaryCardComponent({
  accentColor,
  icon,
  label,
  value,
}: ActivitySummaryCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.25,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Stack
          sx={{
            alignItems: "center",
            bgcolor: alpha(accentColor, 0.14),
            borderRadius: "50%",
            color: accentColor,
            height: 48,
            justifyContent: "center",
            width: 48,
          }}
        >
          {icon}
        </Stack>

        <Stack spacing={0.25}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export const ActivitySummaryCard = memo(ActivitySummaryCardComponent);
