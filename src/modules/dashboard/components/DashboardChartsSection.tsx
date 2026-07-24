import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type {
  DashboardActivityChartPointDto,
  DashboardPerformanceMetricDto,
} from "@/modules/dashboard/dashboard.types";

function SectionCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "#f1f5f9",
          px: 2.5,
          py: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function WeeklyActivityCard({
  points,
  title = "Weekly Activity",
}: {
  points: DashboardActivityChartPointDto[];
  title?: string;
}) {
  const maxValue = Math.max(...points.flatMap((point) => [point.activities, point.tasks]), 1);

  return (
    <SectionCard title={title}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ bgcolor: "#0f5ad4", borderRadius: "50%", height: 8, width: 8 }} />
            <Typography sx={{ fontSize: 12 }}>Activities</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ bgcolor: "#10b981", borderRadius: "50%", height: 8, width: 8 }} />
            <Typography sx={{ fontSize: 12 }}>Tasks</Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            alignItems: "end",
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
            minHeight: 140,
          }}
        >
          {points.map((point) => (
            <Stack key={point.label} spacing={0.75} sx={{ alignItems: "center" }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "end", height: 110, width: "100%" }}>
                <Box
                  sx={{
                    bgcolor: "rgba(15,90,212,0.85)",
                    borderRadius: "6px 6px 0 0",
                    flex: 1,
                    height: `${(point.activities / maxValue) * 100}%`,
                    minHeight: 8,
                  }}
                />
                <Box
                  sx={{
                    bgcolor: "rgba(16,185,129,0.85)",
                    borderRadius: "6px 6px 0 0",
                    flex: 1,
                    height: `${(point.tasks / maxValue) * 100}%`,
                    minHeight: 8,
                  }}
                />
              </Stack>
              <Typography sx={{ color: "#64748b", fontSize: 10, textAlign: "center" }}>{point.label}</Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </SectionCard>
  );
}

function formatMetricDisplay(value: number, unit?: string) {
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }

  if (unit) {
    return `${value.toLocaleString("en-IN")}${unit}`;
  }

  return value.toLocaleString("en-IN");
}

export function PerformanceCard({ metrics }: { metrics: DashboardPerformanceMetricDto[] }) {
  return (
    <SectionCard title="Performance">
      <Stack spacing={1.5}>
        {metrics.map((metric) => {
          const isPercent = metric.unit === "%";
          const progressValue = isPercent ? Math.min(Math.max(metric.value, 0), 100) : 0;

          return (
            <Stack direction="row" key={metric.label} spacing={1.25} sx={{ alignItems: "center" }}>
              <Typography sx={{ flex: 1, fontSize: 13 }}>{metric.label}</Typography>
              {isPercent ? (
                <Box sx={{ flex: 2 }}>
                  <LinearProgress
                    sx={{
                      bgcolor: "#f1f5f9",
                      borderRadius: 0.5,
                      height: 7,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: metric.color,
                        borderRadius: 0.5,
                      },
                    }}
                    value={progressValue}
                    variant="determinate"
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 2 }} />
              )}
              <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: "right", width: 56 }}>
                {formatMetricDisplay(metric.value, metric.unit)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
