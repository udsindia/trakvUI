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
import type { StageChangePreview } from "@/modules/settings/stageTemplatesApi";

type StageChangePreviewDialogProps = {
  open: boolean;
  loading: boolean;
  saving: boolean;
  preview: StageChangePreview | null;
  scopeLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Shown between pressing Save and the save happening, whenever applications already in
 * flight would be changed.
 *
 * The figures come from the server running the same computation the save will, so this
 * cannot promise one thing and do another. Its job is to turn "this might affect existing
 * applications" into a number, because a warning about change in the abstract is one
 * people learn to click through.
 */
export function StageChangePreviewDialog({
  open,
  loading,
  saving,
  preview,
  scopeLabel,
  onCancel,
  onConfirm,
}: StageChangePreviewDialogProps) {
  const affected = preview?.applicationsAffected ?? 0;
  const needingAction = preview?.applicationsNeedingAction ?? 0;

  // Names are the same across applications far more often than not, so they are collapsed
  // into one list rather than repeated per application.
  const collect = (key: "added" | "removed" | "keptBecausePassed" | "addedBehindCurrent") =>
    Array.from(new Set((preview?.changes ?? []).flatMap((change) => change[key] ?? [])));

  const added = collect("added");
  const behind = collect("addedBehindCurrent");
  const removed = collect("removed");
  const kept = collect("keptBecausePassed");
  const aheadOnly = added.filter((name) => !behind.includes(name));

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={saving ? undefined : onCancel}>
      <DialogTitle sx={{ pb: 1 }}>Save the {scopeLabel} sequence?</DialogTitle>

      <DialogContent>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={26} />
          </Stack>
        ) : affected === 0 ? (
          <Alert severity="success">
            No applications currently in flight are affected. This changes what future
            applications are created with.
          </Alert>
        ) : (
          <>
            <Typography sx={{ mb: 1.5 }} variant="body2">
              This will update <strong>{affected}</strong> application
              {affected === 1 ? "" : "s"} already in flight.
            </Typography>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "#e3eaf0",
                borderRadius: "10px",
                px: 2,
                py: 1.25,
              }}
            >
              {aheadOnly.length > 0 ? (
                <Typography sx={{ fontSize: 13, py: 0.3 }}>
                  <strong>+</strong> {aheadOnly.join(", ")} — added ahead of where those
                  applications are
                </Typography>
              ) : null}
              {removed.length > 0 ? (
                <Typography sx={{ fontSize: 13, py: 0.3 }}>
                  <strong>−</strong> {removed.join(", ")} — removed
                </Typography>
              ) : null}
              {kept.length > 0 ? (
                <Typography color="text.secondary" sx={{ fontSize: 13, py: 0.3 }}>
                  {kept.join(", ")} — removed from the sequence but kept on applications that
                  have already passed it
                </Typography>
              ) : null}
            </Box>

            {needingAction > 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>{needingAction}</strong> application{needingAction === 1 ? "" : "s"} will
                need a counsellor&rsquo;s answer: {behind.join(", ")} sits before the stage
                those applications have already reached, so only the counsellor knows whether
                it happened. They will be asked on the application.
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
          {saving ? "Saving…" : affected > 0 ? `Save and update ${affected}` : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
