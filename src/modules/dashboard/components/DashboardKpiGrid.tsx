import { Box, Stack, Typography } from "@mui/material";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import type { DashboardKpiAccent, DashboardKpiDto } from "@/modules/dashboard/dashboard.types";

const ACCENT_BORDER: Record<DashboardKpiAccent, string> = {
  blue: "#007A87",
  green: "#10B981",
  orange: "#F5820D",
  purple: "#8B5CF6",
  red: "#EF4444",
};

const DELTA_COLORS = {
  down: "#EF4444",
  flat: "#F59E0B",
  up: "#10B981",
} as const;

function KpiCard({ kpi }: { kpi: DashboardKpiDto }) {
  const DeltaIcon =
    kpi.deltaTone === "up"
      ? TrendingUpRounded
      : kpi.deltaTone === "down"
        ? TrendingDownRounded
        : AccessTimeRounded;

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px solid rgba(229,231,235,.5)",
        borderLeft: "4px solid",
        borderLeftColor: ACCENT_BORDER[kpi.accent],
        borderRadius: 2.5,
        boxShadow: "0 4px 16px rgba(0,0,0,.07)",
        display: "flex",
        gap: 1.25,
        p: "10px 12px",
        transition: "transform .18s, box-shadow .18s",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(0,0,0,.09)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.1))",
          flexShrink: 0,
          fontSize: 28,
          height: 38,
          justifyContent: "center",
          width: 38,
        }}
      >
        {kpi.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: "text.disabled",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.6,
            mb: 0.25,
            textTransform: "uppercase",
          }}
        >
          {kpi.label}
        </Typography>
        <Typography sx={{ color: "text.primary", fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>
          {kpi.value}
        </Typography>
        <Stack direction="row" spacing={0.375} sx={{ alignItems: "center", mt: 0.25 }}>
          <DeltaIcon sx={{ color: DELTA_COLORS[kpi.deltaTone], fontSize: 10 }} />
          <Typography sx={{ color: DELTA_COLORS[kpi.deltaTone], fontSize: 9, fontWeight: 700 }}>
            {kpi.delta}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpiDto[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        flexShrink: 0,
        gap: 1,
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
