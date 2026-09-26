import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import type {
  DashboardLeadPipelineDto,
  DashboardPerformanceMetricDto,
} from "@/modules/dashboard/dashboard.types";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";
import { PipelineBars } from "@/modules/dashboard/components/PipelineBars";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

type DashboardLeadsSectionProps = {
  leadsScope: string;
  performance?: DashboardPerformanceMetricDto[];
  pipeline?: DashboardLeadPipelineDto;
  showUnassigned: boolean;
};

function formatMetric(value: number, unit?: string) {
  if (unit === "%") return `${value}%`;
  if (unit) return `${value}${unit}`;
  return String(value);
}

const STAGE_PILL_COLORS = [
  { bg: "#EFF6FF", text: "#1D4ED8" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#FDF4FF", text: "#86198F" },
  { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#F1F5F9", text: "#475569" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
      <Typography sx={{ color: "text.disabled", fontSize: 12 }}>{message}</Typography>
    </Box>
  );
}

export function DashboardLeadsSection({ leadsScope, performance, pipeline }: DashboardLeadsSectionProps) {
  const stages = pipeline?.stages ?? [];
  const total = pipeline?.total ?? 0;

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack spacing={1} sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={leadRoutePaths.dashboard}>
                Full view →
              </RouterLink>
            </PanelLink>
          }
          title="Lead Pipeline"
        >
          {stages.length > 0 ? (
            <PipelineBars stages={stages} />
          ) : (
            <EmptyState message="No data available" />
          )}
        </PanelCard>

        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={leadRoutePaths.dashboard}>
                All leads →
              </RouterLink>
            </PanelLink>
          }
          grow
          title={leadsScope}
        >
          {stages.length > 0 ? (
            <Stack sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <Box
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  pb: 0.75,
                  px: 0.5,
                }}
              >
                <Typography
                  sx={{
                    color: "text.disabled",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Stage
                </Typography>
                <Typography
                  sx={{
                    color: "text.disabled",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Leads
                </Typography>
              </Box>

              {stages.map((stage, index) => {
                const pill = STAGE_PILL_COLORS[index % STAGE_PILL_COLORS.length];

                return (
                  <Box
                    key={stage.label}
                    sx={{
                      alignItems: "center",
                      borderBottom: "1px solid #F8FAFC",
                      display: "flex",
                      justifyContent: "space-between",
                      px: 0.5,
                      py: 0.875,
                      "&:hover": { bgcolor: "#FAFBFF" },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{stage.label}</Typography>
                    <Box
                      sx={{
                        bgcolor: pill.bg,
                        borderRadius: 10,
                        color: pill.text,
                        fontSize: 10,
                        fontWeight: 700,
                        minWidth: 28,
                        px: 1,
                        py: 0.375,
                        textAlign: "center",
                      }}
                    >
                      {stage.count}
                    </Box>
                  </Box>
                );
              })}

              <Box
                sx={{
                  alignItems: "center",
                  borderTop: "1.5px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 0.5,
                  px: 0.5,
                  pt: 0.875,
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800 }}>{total}</Typography>
              </Box>
            </Stack>
          ) : (
            <EmptyState message="No lead data available" />
          )}
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        {/* <PanelCard grow title="Lead Source (Mock)">
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              justifyContent: "center",
              minHeight: 140,
            }}
          >
            <Box
              sx={{
                background: "conic-gradient(#007A87 0 38%, #10B981 38% 60%, #F5820D 60% 74%, #0EA5E9 74% 86%, #25D366 86% 94%, #9CA3AF 94% 100%)",
                borderRadius: "50%",
                height: 120,
                position: "relative",
                width: 120,
                "&::after": {
                  bgcolor: "#fff",
                  borderRadius: "50%",
                  content: '""',
                  height: 72,
                  left: "50%",
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 72,
                },
              }}
            />
          </Box>
          <Stack direction="row" sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", pt: 1 }}>
            {[
              { value: "524", label: "Meta Ads", color: "primary.main" },
              { value: "312", label: "Referral", color: "success.main" },
              { value: "198", label: "Walk-in", color: "secondary.main" },
            ].map((stat) => (
              <Box key={stat.label} sx={{ textAlign: "center" }}>
                <Typography sx={{ color: stat.color, fontSize: 15, fontWeight: 800 }}>{stat.value}</Typography>
                <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Stack>
        </PanelCard> */}

        <PanelCard title="Conversion Snapshot">
          {performance && performance.length > 0 ? (
            <Stack direction="row" sx={{ justifyContent: "space-around", textAlign: "center" }}>
              {performance.slice(0, 3).map((metric) => (
                <Box key={metric.label}>
                  <Typography sx={{ color: metric.color, fontSize: 16, fontWeight: 800 }}>
                    {formatMetric(metric.value, metric.unit)}
                  </Typography>
                  <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{metric.label}</Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState message="No data available" />
          )}
        </PanelCard>
      </Stack>
    </Stack>
  );
}
