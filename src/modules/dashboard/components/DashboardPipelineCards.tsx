import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type {
  DashboardApplicationPipelineDto,
  DashboardLeadPipelineDto,
} from "@/modules/dashboard/dashboard.types";

function PipelineTrack({
  pipeline,
  totalLabel,
}: {
  pipeline: DashboardLeadPipelineDto | DashboardApplicationPipelineDto;
  totalLabel: string;
}) {
  const maxCount = Math.max(...pipeline.stages.map((stage) => stage.count), 1);

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          borderRadius: 1.25,
          display: "flex",
          height: 52,
          overflow: "hidden",
        }}
      >
        {pipeline.stages.map((stage) => (
          <Box
            key={stage.label}
            sx={{
              alignItems: "center",
              bgcolor: stage.color,
              color: "#fff",
              display: "flex",
              flex: stage.count,
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
              px: 0.5,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>{stage.count}</Typography>
            <Typography sx={{ fontSize: 10, lineHeight: 1.2, opacity: 0.82 }}>{stage.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {pipeline.stages.map((stage) => (
          <Typography key={stage.label} sx={{ color: "#94a3b8", fontSize: 11 }}>
            {Math.round((stage.count / maxCount) * 100)}%
          </Typography>
        ))}
      </Box>
      <Typography sx={{ color: "#94a3b8", fontSize: 11, textAlign: "right" }}>{totalLabel}</Typography>
    </Stack>
  );
}

function PipelineCard({
  children,
  pillColor,
  pillLabel,
  title,
}: {
  children: React.ReactNode;
  pillColor: "blue" | "purple";
  pillLabel: string;
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e2e8f0",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "#f1f5f9",
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
            {title}
          </Typography>
        </Box>
        <Chip
          color={pillColor === "blue" ? "primary" : "secondary"}
          label={pillLabel}
          size="small"
          sx={pillColor === "purple" ? { bgcolor: "#ede9fe", color: "#7c3aed" } : undefined}
        />
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function LeadPipelineCard({ pipeline }: { pipeline: DashboardLeadPipelineDto }) {
  return (
    <PipelineCard
      pillColor="blue"
      pillLabel={`${pipeline.stages[0]?.count ?? 0} new`}
      title="Lead Pipeline"
    >
      <PipelineTrack pipeline={pipeline} totalLabel={`${pipeline.total} total leads in funnel`} />
    </PipelineCard>
  );
}

export function ApplicationPipelineCard({ pipeline }: { pipeline: DashboardApplicationPipelineDto }) {
  return (
    <PipelineCard
      pillColor="purple"
      pillLabel={`${pipeline.total} active`}
      title="Application Pipeline"
    >
      <PipelineTrack pipeline={pipeline} totalLabel={`${pipeline.total} active applications`} />
    </PipelineCard>
  );
}
