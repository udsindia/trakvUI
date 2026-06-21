import { Box, Stack, Typography } from "@mui/material";
import type { DashboardPipelineStageDto } from "@/modules/dashboard/dashboard.types";

const FILL_GRADIENTS = [
  "linear-gradient(90deg, #007A87, #15A6B8)",
  "linear-gradient(90deg, #1393A0, #48C5D3)",
  "linear-gradient(90deg, #10B981, #34D399)",
  "linear-gradient(90deg, #F5820D, #FFB04A)",
  "linear-gradient(90deg, #8B5CF6, #A78BFA)",
];

type PipelineBarsProps = {
  stages: DashboardPipelineStageDto[];
};

export function PipelineBars({ stages }: PipelineBarsProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <Stack spacing={0.75}>
      {stages.map((stage, index) => {
        const widthPercent = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0);

        return (
          <Stack direction="row" key={stage.label} spacing={0.875} sx={{ alignItems: "center" }}>
            <Typography
              sx={{
                color: "text.secondary",
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 600,
                width: 68,
              }}
            >
              {stage.label}
            </Typography>
            <Box
              sx={{
                bgcolor: "#F1F5F9",
                borderRadius: 1.5,
                flex: 1,
                height: 21,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  background: FILL_GRADIENTS[index % FILL_GRADIENTS.length],
                  borderRadius: 1.5,
                  color: "#fff",
                  display: "flex",
                  fontSize: 9,
                  fontWeight: 700,
                  height: "100%",
                  pl: 0.875,
                  transition: "width .6s cubic-bezier(.4,0,.2,1)",
                  width: `${widthPercent}%`,
                }}
              >
                {stage.count > 0 && widthPercent > 15 ? stage.count : null}
              </Box>
            </Box>
            <Typography
              sx={{
                color: "text.disabled",
                flexShrink: 0,
                fontSize: 9,
                textAlign: "right",
                width: 28,
              }}
            >
              {Math.round((stage.count / maxCount) * 100)}%
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
