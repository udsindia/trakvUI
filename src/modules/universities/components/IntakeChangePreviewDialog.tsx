import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import {
  INTAKE_STATUS_LABELS,
  type IntakeChangePreview,
  type IntakeStatus,
} from "@/modules/universities/universityIntakesApi";

type IntakeChangePreviewDialogProps = {
  open: boolean;
  loading: boolean;
  saving: boolean;
  preview: IntakeChangePreview | null;
  universityName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const statusLabel = (status: string | null) =>
  status ? (INTAKE_STATUS_LABELS[status as IntakeStatus] ?? status) : "—";

/**
 * Shown between pressing Save and the save happening.
 *
 * The figures come from the server running the same comparison the save will, so this
 * cannot promise one thing and do another. Its job is to turn "this may affect courses"
 * into two numbers, because a warning about change in the abstract is one people learn to
 * click through.
 */
export function IntakeChangePreviewDialog({
  open,
  loading,
  saving,
  preview,
  universityName,
  onCancel,
  onConfirm,
}: IntakeChangePreviewDialogProps) {
  const updated = preview?.coursesUpdated ?? 0;
  const asked = preview?.coursesNeedingConfirmation ?? 0;
  const nothingToDo = !loading && updated === 0 && asked === 0;

  // Months are the same across courses far more often than not, so the two lists are
  // collapsed rather than repeated per course.
  const changedMonths = Array.from(
    new Map(
      (preview?.changes ?? [])
        .flatMap((change) => change.months)
        .filter((month) => month.action !== "NO_LONGER_IN_CALENDAR")
        .map((month) => [
          `${month.month}${month.year}${month.from}${month.to}`,
          month,
        ]),
    ).values(),
  );

  const askedCourses = (preview?.changes ?? []).filter((change) => change.custom);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onCancel}>
      <DialogTitle sx={{ pb: 1 }}>Save the {universityName} intake calendar?</DialogTitle>

      <DialogContent>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={26} />
          </Stack>
        ) : nothingToDo ? (
          <Alert severity="success">
            No course is affected. This changes what courses added from now on start with.
          </Alert>
        ) : (
          <>
            {updated > 0 ? (
              <Typography sx={{ mb: 1.5 }} variant="body2">
                <strong>{updated}</strong> course{updated === 1 ? "" : "s"} follow
                {updated === 1 ? "s" : ""} this calendar and will be brought into line.
              </Typography>
            ) : null}

            {changedMonths.length > 0 ? (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "#e3eaf0",
                  borderRadius: "10px",
                  px: 2,
                  py: 1.25,
                  mb: asked > 0 ? 2 : 0,
                }}
              >
                {changedMonths.map((month) => (
                  <Typography
                    key={`${month.month}${month.year}${month.to}`}
                    sx={{ fontSize: 13, py: 0.3 }}
                  >
                    <strong>
                      {month.month} {month.year}
                    </strong>{" "}
                    {month.action === "ADDED"
                      ? `— added as ${statusLabel(month.to)}`
                      : `— ${statusLabel(month.from)} → ${statusLabel(month.to)}`}
                  </Typography>
                ))}
              </Box>
            ) : null}

            {asked > 0 ? (
              <Alert severity="warning">
                <strong>{asked}</strong> course{asked === 1 ? " has" : "s have"} set intakes
                of their own and will <strong>not</strong> be changed. They will be asked to
                confirm on the course page:{" "}
                {askedCourses.map((change) => change.courseName).join(", ")}.
              </Alert>
            ) : null}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={saving} sx={{ textTransform: "none" }} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={loading || saving}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={onConfirm}
        >
          {saving ? "Saving…" : updated > 0 ? `Save and update ${updated}` : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
