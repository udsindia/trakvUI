import { Box, Stack, Typography } from "@mui/material";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import type { DashboardKpiAccent, DashboardKpiDto } from "@/modules/dashboard/dashboard.types";

/**
 * Editorial stat band.
 *
 * One hairline-ruled surface split into cells, rather than four separate cards
 * with accent bars. The figure carries the weight (serif, tabular), the label
 * recedes, and colour is spent only where it means something: the accent dot
 * identifies the metric, the delta colour reports direction.
 */

/** Metric identity — a quiet marker, not a decorative slab. */
const ACCENT_DOT: Record<DashboardKpiAccent, string> = {
  blue: "#2B7B97",
  green: "#0E9F6E",
  orange: "#F38118",
  purple: "#8B5CF6",
  red: "#DC4B4B",
};

/** Direction of travel — semantic, deliberately separate from the brand accent. */
const DELTA_COLORS = {
  down: "error.main",
  flat: "warning.main",
  up: "success.main",
} as const;

function KpiCell({ kpi }: { kpi: DashboardKpiDto }) {
  const DeltaIcon =
    kpi.deltaTone === "up"
      ? TrendingUpRounded
      : kpi.deltaTone === "down"
        ? TrendingDownRounded
        : AccessTimeRounded;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        minWidth: 0,
        px: 2.25,
        py: 1.75,
      }}
    >
      <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", minWidth: 0 }}>
        <Box
          sx={{
            bgcolor: ACCENT_DOT[kpi.accent],
            borderRadius: "50%",
            flexShrink: 0,
            height: 7,
            width: 7,
          }}
        />
        <Typography
          noWrap
          sx={{
            color: "text.disabled",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
          }}
        >
          {kpi.label}
        </Typography>
      </Stack>

      <Typography component="div" variant="figure" sx={{ mt: 0.75 }}>
        {kpi.value}
      </Typography>

      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.625 }}>
        <DeltaIcon sx={{ color: DELTA_COLORS[kpi.deltaTone], fontSize: 13 }} />
        <Typography
          noWrap
          sx={{ color: DELTA_COLORS[kpi.deltaTone], fontSize: 10.5, fontWeight: 700 }}
        >
          {kpi.delta}
        </Typography>
      </Stack>
    </Box>
  );
}

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpiDto[] }) {
  return (
    <Box
      sx={{
        // The 1px grid gap renders as the hairline rule between cells, so the
        // dividers stay correct at every breakpoint without nth-child rules.
        bgcolor: "divider",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(16,40,52,.05)",
        display: "grid",
        flexShrink: 0,
        gap: "1px",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        overflow: "hidden",
      }}
    >
      {kpis.map((kpi) => (
        <KpiCell key={kpi.label} kpi={kpi} />
      ))}
    </Box>
  );
}
