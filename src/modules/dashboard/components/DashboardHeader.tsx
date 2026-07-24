import { Box, Stack, Typography } from "@mui/material";
import type { DashboardPeriod } from "@/modules/dashboard/dashboardDateRange";

type DashboardHeaderProps = {
  greeting: string;
  period: DashboardPeriod;
  subtitle: string;
  onPeriodChange: (period: DashboardPeriod) => void;
};

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
];

export function DashboardHeader({
  greeting,
  period,
  subtitle,
  onPeriodChange,
}: DashboardHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" }, flexShrink: 0, justifyContent: "space-between" }}
    >
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {greeting} 👋
        </Typography>
        <Typography sx={{ color: "text.disabled", fontSize: 11, fontWeight: 500, mt: 0.125 }}>
          {subtitle}
        </Typography>
      </Box>

      <Stack direction="row" spacing={0.625} sx={{ alignItems: "center" }}>
        <Typography sx={{ color: "text.disabled", fontSize: 10, fontWeight: 600 }}>
          Period:
        </Typography>
        {PERIODS.map((item) => {
          const active = period === item.id;

          return (
            <Typography
              component="button"
              key={item.id}
              sx={{
                background: active ? "#E6F7F9" : "#fff",
                border: "1.5px solid",
                borderColor: active ? "primary.main" : "divider",
                borderRadius: "10px",
                color: active ? "text.primary" : "text.secondary",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 700,
                px: 1.25,
                py: 0.5,
                transition: ".12s",
                "&:hover": {
                  borderColor: "primary.main",
                  color: active ? "text.primary" : "primary.main",
                },
              }}
              onClick={() => onPeriodChange(item.id as DashboardPeriod)}
            >
              {item.label}
            </Typography>
          );
        })}
      </Stack>
    </Stack>
  );
}
