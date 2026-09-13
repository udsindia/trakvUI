import { useEffect, useState } from "react";
import {
  Button,
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
  /** The one-line restatement under it, naming the leads affected. */
  summary: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
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
  saving,
  onCancel,
  onConfirm,
}: LeadChangeCommentDialogProps) {
  const [comment, setComment] = useState("");

  // Cleared on each open, so a remark about one lead never follows you onto the next.
  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={saving ? undefined : onCancel}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && !saving) {
          event.preventDefault();
          onConfirm(comment);
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={saving} sx={{ textTransform: "none" }} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={saving}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={() => onConfirm(comment)}
        >
          {saving ? "Saving…" : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
