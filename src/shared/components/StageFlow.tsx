import { Box, Stack, Tooltip, Typography } from "@mui/material";

/**
 * Two ways of drawing a stage sequence, deliberately not the same.
 *
 * An application has a position and a history: it is a journey. A university's template has
 * neither — it is a plan for journeys that have not started. Drawing both with one widget
 * would say they are the same kind of thing.
 */

const INK = "#122B40";
const DONE = "#0B7A57";
const NOW = "#B35A00";
const AHEAD = "#8FA6B4";
const RAIL = "#DCE6EE";

/** Matches the application API's stage shape, so no mapping is needed at the call site. */
export type FlowStage = {
  id: string;
  stageName: string;
  enteredAt?: string | null;
  exitedAt?: string | null;
};

const shortDate = (iso?: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/** Whole days since a stage was entered — what a counsellor is actually chasing. */
const daysSince = (iso?: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const days = Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
  return days < 0 ? null : days;
};

const dwellLabel = (days: number) =>
  days === 0 ? "today" : days === 1 ? "1 day here" : `${days} days here`;

type ApplicationStageFlowProps = {
  stages: FlowStage[];
  currentStageId?: string | null;
  /** A closed application has no "now" — the rail is history all the way through. */
  closed?: boolean;
};

/**
 * Where one application has actually got to.
 *
 * The rail is solid behind the current stage and dashed ahead of it. That is the whole
 * idea: what has happened is known, what is coming is not, and saying so with the line
 * itself means the distinction survives greyscale, colour-blindness and a printout — it
 * does not rest on green-versus-grey.
 *
 * Cleared stages carry the date they cleared. The current one carries how long it has sat
 * there, which is the number nobody could read off the old stepper and the one that
 * actually prompts a phone call.
 */
export function ApplicationStageFlow({ stages, currentStageId, closed }: ApplicationStageFlowProps) {
  if (stages.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No stages recorded for this application.
      </Typography>
    );
  }

  const currentIndex = stages.findIndex((stage) => stage.id && stage.id === currentStageId);

  return (
    <Box
      aria-label="Application progress"
      // Nine or ten stages will not fit a narrow screen, and squeezing them would cost the
      // labels. Scrolls in its own track so the page itself never moves sideways.
      sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: 6 } }}
    >
      <Stack direction="row" sx={{ minWidth: "min-content", pt: 0.5 }}>
        {stages.map((stage, index) => {
          const cleared = Boolean(stage.exitedAt) || (closed && Boolean(stage.enteredAt));
          const isCurrent = !closed && index === currentIndex;
          const ahead = !cleared && !isCurrent;
          const dwell = isCurrent ? daysSince(stage.enteredAt) : null;
          const cleared_on = shortDate(stage.exitedAt ?? stage.enteredAt);

          return (
            <Box
              key={stage.id}
              // Fixed width rather than content width: a rail with uneven gaps stops
              // reading as a measured journey, and it gives two-word labels room to wrap
              // instead of colliding with their neighbours.
              sx={{ flex: "0 0 116px", position: "relative" }}
            >
              {/*
                The connector belongs to the gap before this node, so the switch from solid
                to dashed lands exactly at the current position.
              */}
              {index > 0 ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 9,
                    right: "50%",
                    width: "100%",
                    borderTop: index <= currentIndex || (closed && index <= stages.length - 1)
                      ? `2px solid ${DONE}`
                      : `2px dashed ${RAIL}`,
                  }}
                />
              ) : null}

              <Stack spacing={0.75} sx={{ alignItems: "center", position: "relative" }}>
                <Tooltip title={stage.stageName}>
                  <Box
                    sx={{
                      width: isCurrent ? 20 : 14,
                      height: isCurrent ? 20 : 14,
                      borderRadius: "50%",
                      bgcolor: cleared ? DONE : isCurrent ? NOW : "#FFFFFF",
                      border: ahead ? `2px solid ${RAIL}` : "none",
                      // The ring is what makes "you are here" readable at a glance without
                      // relying on the colour alone.
                      boxShadow: isCurrent ? `0 0 0 4px rgba(179,90,0,.16)` : "none",
                      mt: isCurrent ? "-3px" : 0,
                      zIndex: 1,
                    }}
                  />
                </Tooltip>

                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: isCurrent ? 700 : cleared ? 600 : 500,
                    color: isCurrent ? NOW : cleared ? INK : AHEAD,
                    textAlign: "center",
                    lineHeight: 1.3,
                    px: 0.75,
                    // Two lines is the most any of these names needs; a third would push
                    // the dates out of alignment across the rail.
                    minHeight: 30,
                  }}
                >
                  {stage.stageName}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontVariantNumeric: "tabular-nums",
                    color: isCurrent ? NOW : "#93A7B4",
                    fontWeight: isCurrent ? 600 : 400,
                    minHeight: 14,
                  }}
                >
                  {isCurrent && dwell !== null
                    ? dwellLabel(dwell)
                    : cleared && cleared_on
                      ? cleared_on
                      : ""}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

type StageSequenceFlowProps = {
  stages: { name: string }[];
};

/**
 * The stages applications to a university will follow.
 *
 * A plan, not a journey: nothing here has happened, so nothing is highlighted and no dates
 * appear. Even weight throughout is the point — picking one out would imply a position
 * this has no business claiming.
 *
 * Vertical, and connected. Laid out as wrapping pills it read as a row of tags, with the
 * numbers doing all the work of showing order; a rail threading through says "sequence"
 * without being read. Horizontal would have meant either scrolling or connectors left
 * dangling at the end of every wrapped row, and it would have looked like the application
 * journey, which is exactly the thing this is not.
 *
 * The last stage gets a ring rather than a number. These sequences all end somewhere
 * definite — a visa, an enrolment — and marking the destination is structural, not a claim
 * about state.
 */
export function StageSequenceFlow({ stages }: StageSequenceFlowProps) {
  if (stages.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No stages defined.
      </Typography>
    );
  }

  return (
    <Box aria-label="Stage sequence">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <Stack
            key={`${stage.name}-${index}`}
            direction="row"
            spacing={1.5}
            // Stretch, so the marker column is as tall as its row and the rail can span
            // the whole gap. Left to its content height it drew 6px stubs instead of a line.
            sx={{ alignItems: "stretch", position: "relative" }}
          >
            <Box sx={{ position: "relative", flexShrink: 0, width: 22 }}>
              {/* The rail runs between markers, so it stops at the destination. */}
              {!isLast ? (
                <Box
                  sx={{
                    position: "absolute",
                    left: "10px",
                    top: "22px",
                    bottom: 0,
                    // "1px", not 1: MUI reads a number of 1 or less as a percentage for
                    // width, so 1 drew a block the full width of the column.
                    width: "1px",
                    bgcolor: RAIL,
                  }}
                />
              ) : null}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  bgcolor: isLast ? "#FFFFFF" : "#EEF3F7",
                  color: isLast ? DONE : INK,
                  border: isLast ? `2px solid ${DONE}` : "none",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {isLast ? "" : index + 1}
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: isLast ? 600 : 500,
                color: INK,
                pb: isLast ? 0 : 1.5,
                pt: "2px",
              }}
            >
              {stage.name}
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
}
