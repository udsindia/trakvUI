import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

type LeadChangeCommentDialogProps = {
  open: boolean;
  /** What is about to happen, e.g. "Move to Prospective" — the dialog's title. */
  title: string;
  /**
   * Offer to raise a task alongside the change. Handing a lead over is the case that wants
   * it: the new owner needs to know what to do next, and saying so in a comment nobody is
   * assigned to is how follow-ups get lost.
   */
  offerTask?: boolean;
  /** The one-line restatement under it, naming the leads affected. */
  summary: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (input: {
    comment: string;
    task?: { title: string; dueDate: string } | null;
  }) => void;
};

/**
 * Asks why, on the way to changing a lead's stage or its owner.
 *
 * The comment is optional and the dialog says so: a counsellor moving a lead through the
 * obvious next stage should not have to justify it, while the one handing a difficult lead
 * to someone else usually wants to explain. Making it required would produce a column of
 * full stops.
 *
 * Enter confirms, so the quick path is type-nothing-and-press-Enter rather than reaching
 * for the mouse.
 */
export function LeadChangeCommentDialog({
  open,
  title,
  summary,
  offerTask = false,
  saving,
  onCancel,
  onConfirm,
}: LeadChangeCommentDialogProps) {
  const [comment, setComment] = useState("");
  const [wantsTask, setWantsTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [error, setError] = useState("");

  // Cleared on each open, so a remark about one lead never follows you onto the next.
  useEffect(() => {
    if (open) {
      setComment("");
      setWantsTask(false);
      setTaskTitle("");
      setTaskDue("");
      setError("");
    }
  }, [open]);

  const submit = () => {
    const wanted = offerTask && wantsTask;
    if (wanted && !taskTitle.trim()) {
      setError("Give the task a title, or untick it.");
      return;
    }
    if (wanted && !taskDue) {
      setError("Give the task a due date.");
      return;
    }
    onConfirm({
      comment,
      task: wanted ? { title: taskTitle.trim(), dueDate: taskDue } : null,
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={saving ? undefined : onCancel}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && !saving) {
          event.preventDefault();
          submit();
        }
      }}
    >
      <DialogTitle sx={{ pb: 0.5 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1.5 }}>
          {summary}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          helperText="Optional. Shows on the lead's timeline with what changed."
          label="Comment"
          minRows={2}
          size="small"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />

        {offerTask ? (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={wantsTask}
                  disabled={saving}
                  size="small"
                  onChange={(event) => setWantsTask(event.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: 13 }}>Also create a task for them</Typography>}
              sx={{ mt: 1 }}
            />

            {wantsTask ? (
              <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                <TextField
                  disabled={saving}
                  fullWidth
                  label="Task"
                  placeholder="What should they do first?"
                  size="small"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                />
                <TextField
                  InputLabelProps={{ shrink: true }}
                  disabled={saving}
                  helperText="Assigned to the new owner, against this lead."
                  label="Due"
                  size="small"
                  type="date"
                  value={taskDue}
                  onChange={(event) => setTaskDue(event.target.value)}
                />
              </Stack>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Typography color="error" sx={{ fontSize: 12.5, mt: 1 }}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={saving} sx={{ textTransform: "none" }} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={saving}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={submit}
        >
          {saving ? "Saving…" : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
