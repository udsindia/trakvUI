import { Box, Paper, Stack, Typography } from "@mui/material";
import type { DashboardKpiAccent, DashboardKpiDto } from "@/modules/dashboard/dashboard.types";

const ACCENT_COLORS: Record<DashboardKpiAccent, string> = {
  blue: "#0f5ad4",
  green: "#10b981",
  orange: "#f59e0b",
  purple: "#7c3aed",
  red: "#ef4444",
};

const ICON_BACKGROUNDS: Record<DashboardKpiAccent, string> = {
  blue: "#eff6ff",
  green: "#f0fdf4",
  orange: "#fffbeb",
  purple: "#f3f0ff",
  red: "#fef2f2",
};

const DELTA_COLORS = {
  down: "#ef4444",
  flat: "#94a3b8",
  up: "#10b981",
} as const;

function KpiCard({ kpi }: { kpi: DashboardKpiDto }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: 2,
        overflow: "hidden",
        p: 2.5,
        position: "relative",
        "&::before": {
          bgcolor: ACCENT_COLORS[kpi.accent],
          content: '""',
          height: 3,
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        },
      }}
    >
      <Stack spacing={1.5}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: ICON_BACKGROUNDS[kpi.accent],
            borderRadius: 1.5,
            display: "flex",
            fontSize: 20,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          {kpi.icon}
        </Box>
        <Stack spacing={0.5}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {kpi.label}
          </Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{kpi.value}</Typography>
          <Typography sx={{ color: DELTA_COLORS[kpi.deltaTone], fontSize: 12, fontWeight: 500 }}>
            {kpi.delta}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpiDto[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </Box>
  );
}
