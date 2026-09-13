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
  /** A closed application has no "now" — every stage is history. */
  closed?: boolean;
};

/**
 * Progress drawn as an interlocking chevron path.
 *
 * Sized to the container rather than to its content: every stage takes an equal share of
 * the width and its name wraps, so nine stages fit a card without scrolling. Laid out to
 * fit the text instead, it ran off the side and had to be dragged.
 *
 * Wrapping buys a second line, which is where the dates and the dwell time go — the
 * information this shape is usually accused of losing. "6 days here" on the stage in play
 * is the number worth the space; it is what turns a picture of progress into a prompt to
 * chase something.
 */
export function ApplicationStageChevrons({
  stages,
  currentStageId,
  closed,
}: ApplicationStageFlowProps) {
  if (stages.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No stages recorded for this application.
      </Typography>
    );
  }

  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);
  const NOTCH = 11;

  return (
    <Stack
      direction="row"
      aria-label="Application progress"
      // A floor per stage so a very narrow window scrolls rather than crushing the names
      // into single letters; above that they simply share the width.
      sx={{ width: "100%", overflowX: "auto" }}
    >
      {stages.map((stage, index) => {
        const cleared = Boolean(stage.exitedAt) || (closed && Boolean(stage.enteredAt));
        const isCurrent = !closed && index === currentIndex;
        const dwell = isCurrent ? daysSince(stage.enteredAt) : null;
        const clearedOn = shortDate(stage.exitedAt ?? stage.enteredAt);
        const meta =
          isCurrent && dwell !== null ? dwellLabel(dwell) : cleared && clearedOn ? clearedOn : "";

        return (
          <Box
            key={stage.id}
            sx={{
              flex: "1 1 0",
              minWidth: 82,
              bgcolor: cleared ? DONE : isCurrent ? NOW : "#EEF3F7",
              color: cleared || isCurrent ? "#FFFFFF" : AHEAD,
              minHeight: 54,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pl: index === 0 ? "10px" : `${NOTCH + 8}px`,
              pr: "10px",
              py: 0.75,
              ml: index === 0 ? 0 : `-${NOTCH}px`,
              // A point on the right and a matching bite on the left, so the pieces
              // interlock instead of overlapping.
              clipPath:
                index === 0
                  ? `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%)`
                  : index === stages.length - 1
                    ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${NOTCH}px 50%)`
                    : `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%, ${NOTCH}px 50%)`,
            }}
          >
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: isCurrent ? 700 : 600,
                lineHeight: 1.2,
                overflowWrap: "break-word",
                hyphens: "auto",
              }}
            >
              {stage.stageName}
            </Typography>
            {meta ? (
              <Typography
                sx={{
                  fontSize: 9.5,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                  mt: 0.25,
                  // Quieter than the name: it is supporting detail, not the label.
                  opacity: cleared || isCurrent ? 0.82 : 1,
                }}
              >
                {meta}
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Stack>
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
