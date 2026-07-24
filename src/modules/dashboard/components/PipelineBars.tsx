import { Box, Stack, Typography } from "@mui/material";
import type { DashboardPipelineStageDto } from "@/modules/dashboard/dashboard.types";

/**
 * Conversion funnel.
 *
 * Bar length is proportional to the widest stage, and the trailing figure is
 * the **stage-to-stage conversion rate** — where people are actually being
 * lost. (Previously this column showed count/max, which only restated the bar
 * width and told the reader nothing new.)
 */

/** Progression ramp: cool at enquiry, warming toward the committed stages. */
const FILLS = ["#2B7B97", "#0F5AD4", "#7B1FA2", "#B8801A", "#0E9F6E", "#55707C"];

type PipelineBarsProps = {
  stages: DashboardPipelineStageDto[];
};

export function PipelineBars({ stages }: PipelineBarsProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <Stack spacing={0.875}>
      {stages.map((stage, index) => {
        const widthPercent =
          stage.count > 0 ? Math.max((stage.count / maxCount) * 100, 6) : 0;
        // Wide bars can hold their own figure; narrow ones would clip it.
        const labelInside = widthPercent >= 18;
        const previous = index > 0 ? stages[index - 1].count : null;
        const conversion =
          previous && previous > 0 ? Math.round((stage.count / previous) * 100) : null;

        return (
          <Stack direction="row" key={stage.label} spacing={1} sx={{ alignItems: "center" }}>
            <Typography
              noWrap
              sx={{
                color: "text.secondary",
                flexShrink: 0,
                fontSize: 10.5,
                fontWeight: 600,
                width: 72,
              }}
            >
              {stage.label}
            </Typography>

            <Box
              sx={{
                bgcolor: "#EDF1F5",
                borderRadius: "5px",
                flex: 1,
                height: 20,
                minWidth: 0,
                position: "relative",
              }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: FILLS[index % FILLS.length],
                  borderRadius: "5px",
                  color: "#fff",
                  display: "flex",
                  fontSize: 10,
                  fontWeight: 700,
                  height: "100%",
                  pl: 1,
                  transition: "width .6s cubic-bezier(.4,0,.2,1)",
                  width: `${widthPercent}%`,
                }}
              >
                {labelInside ? stage.count : null}
              </Box>

              {!labelInside && stage.count >= 0 ? (
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: 10,
                    fontWeight: 700,
                    left: `calc(${widthPercent}% + 6px)`,
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  {stage.count}
                </Typography>
              ) : null}
            </Box>

            <Typography
              sx={{
                color: conversion === null ? "text.disabled" : "text.secondary",
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                textAlign: "right",
                width: 34,
              }}
              title={conversion === null ? undefined : "Conversion from previous stage"}
            >
              {conversion === null ? "—" : `${conversion}%`}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
