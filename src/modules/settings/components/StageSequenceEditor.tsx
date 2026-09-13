import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { Alert, Button, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";

/** One stage while it is being edited. `key` keeps React rows stable through a rename. */
export type DraftStage = { key: string; name: string; active: boolean };

let draftKeySeed = 0;
export const nextStageKey = () => `stage-${(draftKeySeed += 1)}`;

export function toDraftStages(stages: { name: string; active: boolean }[]): DraftStage[] {
  return stages.map((stage) => ({
    key: nextStageKey(),
    name: stage.name,
    active: stage.active,
  }));
}

/** What is wrong with a draft, if anything — the same rules the server enforces. */
export function validateStages(draft: DraftStage[]) {
  const trimmed = draft.map((stage) => stage.name.trim());
  const hasBlank = trimmed.some((name) => name.length === 0);
  const duplicate = trimmed.find(
    (name, index) =>
      name.length > 0 &&
      trimmed.findIndex((other) => other.toLowerCase() === name.toLowerCase()) !== index,
  );
  return { hasBlank, duplicate, valid: draft.length > 0 && !hasBlank && !duplicate };
}

type StageSequenceEditorProps = {
  stages: DraftStage[];
  onChange: (stages: DraftStage[]) => void;
  /** Read-only when the viewer cannot manage settings. */
  disabled?: boolean;
};

/**
 * The stage list, reorderable and renameable.
 *
 * Extracted so the settings screen, the add-university drawer and the university page all
 * edit a sequence the same way. Three copies of "a list you can drag stages around in" is
 * three places for the validation to drift apart from what the server will accept.
 *
 * Controlled: it owns no state, so whoever renders it decides what saving means — which
 * differs by caller. Creating a university has no applications to reconcile; changing an
 * existing one does.
 *
 * Rows drag, and the up/down buttons stay. Drag is faster with a mouse and unusable
 * without one, so removing the buttons would make reordering keyboard-inaccessible.
 */
export function StageSequenceEditor({ stages, onChange, disabled }: StageSequenceEditorProps) {
  const { hasBlank, duplicate } = validateStages(stages);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (index: number, delta: number) => {
    const next = [...stages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /**
   * Dragging lifts a stage out and drops it in, rather than swapping with its neighbour —
   * moving the first stage to the end should not send the last one to the front.
   */
  const dropAt = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...stages];
    const [lifted] = next.splice(dragIndex, 1);
    next.splice(target, 0, lifted);
    onChange(next);
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <>
      <Stack spacing={1}>
        {stages.map((stage, index) => (
          <Stack
            key={stage.key}
            direction="row"
            spacing={1}
            draggable={!disabled}
            sx={{
              alignItems: "center",
              opacity: dragIndex === index ? 0.4 : 1,
              // A line where it would land, rather than moving the rows around under the
              // cursor: the list is short and shuffling it mid-drag is disorienting.
              borderTop: overIndex === index && dragIndex !== null && dragIndex > index
                ? "2px solid" : "2px solid transparent",
              borderBottom: overIndex === index && dragIndex !== null && dragIndex < index
                ? "2px solid" : "2px solid transparent",
              borderTopColor: overIndex === index && dragIndex !== null && dragIndex > index
                ? "primary.main" : "transparent",
              borderBottomColor: overIndex === index && dragIndex !== null && dragIndex < index
                ? "primary.main" : "transparent",
            }}
            onDragEnd={endDrag}
            onDragOver={(event) => {
              event.preventDefault();
              setOverIndex(index);
            }}
            onDragStart={() => setDragIndex(index)}
            onDrop={(event) => {
              event.preventDefault();
              dropAt(index);
              endDrag();
            }}
          >
            {!disabled ? (
              <DragIndicatorRounded
                aria-hidden
                sx={{ color: "text.disabled", cursor: "grab", fontSize: 18, flexShrink: 0 }}
              />
            ) : null}
            <Typography
              color="text.disabled"
              sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums", width: 22 }}
            >
              {index + 1}.
            </Typography>
            <TextField
              disabled={disabled}
              error={stage.name.trim().length === 0}
              fullWidth
              size="small"
              value={stage.name}
              onChange={(event) =>
                onChange(
                  stages.map((candidate) =>
                    candidate.key === stage.key
                      ? { ...candidate, name: event.target.value }
                      : candidate,
                  ),
                )
              }
            />
            {!disabled ? (
              <>
                <Tooltip title="Move up">
                  <span>
                    <IconButton disabled={index === 0} size="small" onClick={() => move(index, -1)}>
                      <ArrowUpwardRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      disabled={index === stages.length - 1}
                      size="small"
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownwardRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remove stage">
                  <span>
                    <IconButton
                      disabled={stages.length <= 1}
                      size="small"
                      sx={{ color: "error.main" }}
                      onClick={() => onChange(stages.filter((c) => c.key !== stage.key))}
                    >
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            ) : null}
          </Stack>
        ))}
      </Stack>

      {!disabled ? (
        <Button
          size="small"
          startIcon={<AddRounded />}
          sx={{ mt: 1.5, textTransform: "none" }}
          onClick={() => onChange([...stages, { key: nextStageKey(), name: "", active: true }])}
        >
          Add stage
        </Button>
      ) : null}

      {duplicate ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          “{duplicate}” appears twice. Stage names must be unique.
        </Alert>
      ) : null}
      {hasBlank ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Every stage needs a name.
        </Alert>
      ) : null}
    </>
  );
}
