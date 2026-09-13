import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { StudentProfileFields } from "@/modules/students/components/StudentProfileFields";
import type { UpdateStudentPayload } from "@/modules/students/studentsApi";

type EnrolStudentDialogProps = {
  open: boolean;
  /** The lead becoming a student, for the dialog to name. */
  leadName: string;
  saving: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: (input: { comment: string; profile: UpdateStudentPayload }) => void;
};

const emptyProfile: UpdateStudentPayload = {};

/**
 * Shown on the way into Enrolled, which is the moment a lead becomes a student.
 *
 * A lead carries a name, a phone number and a rough idea of where they want to study. A
 * student needs a date of birth, a passport and a real academic record, and enrolment is
 * when somebody actually has that in front of them — asking later means a Students list
 * full of half-filled rows nobody goes back to.
 *
 * Everything is optional all the same. The enrolment itself must not be blocked by a
 * passport expiry date the counsellor has not been given yet; the point is to ask at the
 * right moment, not to refuse.
 */
export function EnrolStudentDialog({
  open,
  leadName,
  saving,
  errorMessage,
  onCancel,
  onConfirm,
}: EnrolStudentDialogProps) {
  const [profile, setProfile] = useState<UpdateStudentPayload>(emptyProfile);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setProfile(emptyProfile);
      setComment("");
    }
  }, [open]);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onCancel}>
      <DialogTitle sx={{ pb: 0.5 }}>Enrol {leadName}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          This creates the student record. Anything you add now saves onto it — all of it
          optional, and editable later on the student&rsquo;s page.
        </Alert>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        <StudentProfileFields disabled={saving} value={profile} onChange={setProfile} />

        <TextField
          fullWidth
          multiline
          disabled={saving}
          helperText="Optional. Shows on the lead's timeline."
          label="Comment"
          minRows={2}
          size="small"
          sx={{ mt: 2 }}
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
          onClick={() => onConfirm({ comment, profile })}
        >
          {saving ? "Enrolling…" : "Enrol student"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
