import { Box, Stack, Typography } from "@mui/material";
import type { PlatformChartPoint, PlatformKpi } from "@/modules/super-admin/superAdmin.types";

const ACCENT_BORDER = {
  blue: "#007A87",
  green: "#10B981",
  orange: "#F5820D",
  purple: "#8B5CF6",
  red: "#EF4444",
} as const;

export function PlatformKpiGrid({ kpis }: { kpis: PlatformKpi[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(6, minmax(0, 1fr))",
        },
      }}
    >
      {kpis.map((kpi) => (
        <Box
          key={kpi.label}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(229,231,235,.5)",
            borderLeft: "4px solid",
            borderLeftColor: ACCENT_BORDER[kpi.accent],
            borderRadius: 2.5,
            boxShadow: "0 4px 16px rgba(0,0,0,.07)",
            p: "10px 12px",
          }}
        >
          <Typography sx={{ fontSize: 20, mb: 0.5 }}>{kpi.icon}</Typography>
          <Typography
            sx={{
              color: "text.disabled",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {kpi.label}
          </Typography>
          <Typography sx={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{kpi.value}</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 9, fontWeight: 600, mt: 0.25 }}>
            {kpi.delta}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function PlatformBarChart({
  points,
  valueSuffix = "",
}: {
  points: PlatformChartPoint[];
  valueSuffix?: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <Stack spacing={1.25}>
      {points.map((point) => (
        <Stack key={point.label} spacing={0.5}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{point.label}</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
              {point.value}
              {valueSuffix}
            </Typography>
          </Stack>
          <Box
            sx={{
              bgcolor: "#F1F5F9",
              borderRadius: 1,
              height: 8,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #007A87, #15A6B8)",
                borderRadius: 1,
                height: "100%",
                width: `${(point.value / maxValue) * 100}%`,
              }}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function PlatformPanelCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid rgba(229,231,235,.5)",
        borderRadius: 2.5,
        boxShadow: "0 4px 16px rgba(0,0,0,.07)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: "11px 13px",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
}
