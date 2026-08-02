import { useRef, useState } from "react";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { leadService } from "@/modules/lead/leadService";
import { type ImportLeadsResult } from "@/modules/lead/leadApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type ImportLeadsDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import so the caller can refresh the leads list. */
  onImported: () => void;
};

export function ImportLeadsDialog({ open, onClose, onImported }: ImportLeadsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportLeadsResult | null>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await leadService.importLeads(file);
      setResult(res);
      if (res.imported > 0) onImported();
    } catch (err) {
      setError(getApiErrorMessage(err, "Import failed. Check the file format and try again."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Import Leads from CSV</DialogTitle>
      <DialogContent dividers>
        {result ? (
          <Stack spacing={2}>
            <Alert severity={result.skipped > 0 ? "warning" : "success"}>
              Imported <strong>{result.imported}</strong> of {result.totalSubmitted} row(s).
              {result.skipped > 0 ? ` ${result.skipped} skipped.` : ""}
            </Alert>
            {result.skippedReasons?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Skipped rows
                </Typography>
                <List dense sx={{ maxHeight: 220, overflow: "auto", bgcolor: "action.hover", borderRadius: 1 }}>
                  {result.skippedReasons.map((s) => (
                    <ListItem key={s.row}>
                      <ListItemText primary={`Row ${s.row}`} secondary={s.reason} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Upload a .csv file of leads. The first row should be headers. Rows that fail
              validation are skipped and reported back with the reason.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileRounded />}
              sx={{ alignSelf: "flex-start", textTransform: "none" }}
            >
              {file ? "Change file" : "Choose CSV file"}
              <input
                ref={inputRef}
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
            </Button>
            {file && (
              <Typography variant="body2">
                Selected: <strong>{file.name}</strong> ({Math.ceil(file.size / 1024)} KB)
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading} sx={{ textTransform: "none" }}>
          {result ? "Close" : "Cancel"}
        </Button>
        {!result && (
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            variant="contained"
            startIcon={isUploading ? <CircularProgress color="inherit" size={16} /> : <UploadFileRounded />}
            sx={{ textTransform: "none" }}
          >
            {isUploading ? "Importing..." : "Import"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
