import { useEffect, useState } from "react";
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
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { callRecordsService } from "@/modules/call-records/callRecordsService";
import type { CallRecordingRow } from "@/modules/call-records/callRecords.types";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type CallRecordingPlayerDialogProps = {
  recording: CallRecordingRow | null;
  onClose: () => void;
};

/**
 * Fetches the audio as an authenticated blob (not a public/presigned URL — the backend streams
 * it through the normal JWT-protected endpoint) and plays it from an object URL.
 */
export function CallRecordingPlayerDialog({ recording, onClose }: CallRecordingPlayerDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!recording) {
      setObjectUrl(null);
      setError(undefined);
      return;
    }

    let cancelled = false;
    let url: string | null = null;
    setLoading(true);
    setError(undefined);

    callRecordsService
      .getAudioBlob(recording.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Could not load the recording."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [recording]);

  const handleDownload = () => {
    if (!objectUrl || !recording) return;
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${recording.externalId}.${recording.mimeType.split("/")[1] ?? "ogg"}`;
    link.click();
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={Boolean(recording)} onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>{recording?.employeeName}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography color="text.secondary" variant="body2">
            {recording?.phoneNumber} · {recording?.direction}
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : objectUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio autoPlay controls src={objectUrl} style={{ width: "100%" }} />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          disabled={!objectUrl}
          startIcon={<DownloadRounded />}
          variant="contained"
          onClick={handleDownload}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
