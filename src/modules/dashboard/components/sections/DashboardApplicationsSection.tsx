import { Link as RouterLink } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { DashboardApplicationPipelineDto } from "@/modules/dashboard/dashboard.types";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";
import { PipelineBars } from "@/modules/dashboard/components/PipelineBars";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi, mapOutcomeToStage } from "@/modules/applications/applicationsApi";
import type { ApplicationStage } from "@/modules/applications/applicationForm.types";

const STAGE_STYLES: Record<ApplicationStage, { bgcolor: string; color: string }> = {
  Draft: { bgcolor: "#F1F5F9", color: "#475569" },
  Submitted: { bgcolor: "#EEF2FF", color: "#4338CA" },
  Processing: { bgcolor: "#FEF3C7", color: "#92400E" },
  "Visa Applied": { bgcolor: "#EFF6FF", color: "#1D4ED8" },
  "Visa Approved": { bgcolor: "#DCFCE7", color: "#166534" },
  "Visa Rejected": { bgcolor: "#FEE2E2", color: "#991B1B" },
  Completed: { bgcolor: "#D1FAE5", color: "#065F46" },
};

function relativeDate(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = diff / 3_600_000;
  if (hours < 24) return "Today";
  if (hours < 48) return "Yesterday";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
      <Typography sx={{ color: "text.disabled", fontSize: 12 }}>{message}</Typography>
    </Box>
  );
}

type DashboardApplicationsSectionProps = {
  pipeline?: DashboardApplicationPipelineDto;
};

export function DashboardApplicationsSection({ pipeline }: DashboardApplicationsSectionProps) {
  const { data: rawApplications, isLoading } = useQuery({
    queryKey: ["dashboard-recent-applications"],
    queryFn: () => applicationsApi.getApplications(),
    staleTime: 30_000,
    retry: 1,
  });

  const recentApplications = [...(rawApplications ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((app) => {
      const stage = mapOutcomeToStage(app.outcome);

      return {
        id: app.id,
        studentName: app.studentName?.trim() || "Unknown student",
        targetUniversity: app.universityName ?? "—",
        course: app.courseName ?? "—",
        stage,
        createdAt: app.createdAt,
      };
    });

  const stages = pipeline?.stages ?? [];

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack spacing={1} sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={applicationsRoutePaths.dashboard}>
                All applications →
              </RouterLink>
            </PanelLink>
          }
          title="Application Status"
        >
          {stages.length > 0 ? (
            <PipelineBars stages={stages} />
          ) : (
            <EmptyState message="Pipeline data unavailable" />
          )}
        </PanelCard>

        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={applicationsRoutePaths.dashboard}>
                View all →
              </RouterLink>
            </PanelLink>
          }
          grow
          title="Recent Applications"
        >
          {isLoading ? (
            <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", py: 3 }}>
              <CircularProgress size={20} />
            </Box>
          ) : recentApplications.length > 0 ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {recentApplications.map((app) => {
                const stageStyle = STAGE_STYLES[app.stage] ?? {
                  bgcolor: "#F1F5F9",
                  color: "#475569",
                };

                return (
                  <Stack
                    direction="row"
                    key={app.id}
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      borderBottom: "1px solid #F8FAFC",
                      py: 0.75,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{app.studentName}</Typography>
                      <Typography noWrap sx={{ color: "text.disabled", fontSize: 9 }}>
                        {app.targetUniversity} · {app.course}
                      </Typography>
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        ...stageStyle,
                        borderRadius: 10,
                        fontSize: 9,
                        fontWeight: 700,
                        px: 0.875,
                        py: 0.25,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.stage}
                    </Box>
                    <Typography sx={{ color: "text.disabled", fontSize: 9, whiteSpace: "nowrap" }}>
                      {relativeDate(app.createdAt)}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          ) : (
            <EmptyState message="No applications yet" />
          )}
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard title="Student Snapshot">
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 80 }}>
            <Typography sx={{ color: "text.disabled", fontSize: 12, textAlign: "center" }}>
              Student snapshot
              <br />
              coming soon
            </Typography>
          </Box>
        </PanelCard>

        <PanelCard grow title="Top Destinations">
          <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", minHeight: 100 }}>
            <Typography sx={{ color: "text.disabled", fontSize: 12, textAlign: "center" }}>
              Destination breakdown
              <br />
              coming soon
            </Typography>
          </Box>
        </PanelCard>
      </Stack>
    </Stack>
  );
}
