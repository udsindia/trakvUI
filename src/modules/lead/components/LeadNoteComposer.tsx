import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { leadApi } from "@/modules/lead/leadApi";

/** activities.outcome_notes is TEXT, but a note longer than this is a document, not a note. */
const MAX_NOTE_LENGTH = 2000;

type LeadNoteComposerProps = {
  leadId: string;
};

/** Today in the viewer's zone as yyyy-mm-dd, the earliest follow-up date worth offering. */
function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Adds a dated note to the lead's timeline, optionally with a follow-up date.
 *
 * A follow-up is a date on the note rather than a separate form because that is how it is
 * decided: "they want a quote after the 5th, call them then". The backend turns the date
 * into a task for whoever wrote the note.
 */
export function LeadNoteComposer({ leadId }: LeadNoteComposerProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");

  const save = useMutation({
    mutationFn: () =>
      leadApi.addNote(
        leadId,
        note.trim(),
        // 10:00 local on the chosen day: a follow-up is a day's work, not an appointment.
        followUpOn ? new Date(`${followUpOn}T10:00:00`) : null,
      ),
    onSuccess: async () => {
      setNote("");
      setFollowUpOn("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads", leadId, "timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
      ]);
    },
  });

  const canSave = note.trim().length > 0 && !save.isPending;

  return (
    <Stack spacing={1.25}>
      <TextField
        fullWidth
        minRows={2}
        multiline
        placeholder="Add a note: what was discussed, what they asked for…"
        size="small"
        value={note}
        inputProps={{ "aria-label": "New note", maxLength: MAX_NOTE_LENGTH }}
        onChange={(event) => setNote(event.target.value)}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <TextField
          label="Follow up on (optional)"
          size="small"
          type="date"
          value={followUpOn}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: todayIso() }}
          sx={{ width: { xs: "100%", sm: 210 } }}
          onChange={(event) => setFollowUpOn(event.target.value)}
        />
        <Button
          disabled={!canSave}
          sx={{ alignSelf: { xs: "flex-end", sm: "auto" }, textTransform: "none" }}
          variant="contained"
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : followUpOn ? "Save note & follow-up" : "Save note"}
        </Button>
      </Stack>
      {save.isError ? (
        <Alert severity="error" onClose={() => save.reset()}>
          The note could not be saved. Please try again.
        </Alert>
      ) : null}
    </Stack>
  );
}
