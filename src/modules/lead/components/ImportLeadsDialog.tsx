import { useRef, useState } from "react";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { leadApi, type LeadImportResult } from "@/modules/lead/leadApi";

const EXPECTED_HEADERS = [
  "firstName",
  "lastName",
  "emailAddress",
  "countryCode",
  "phoneNo",
  "leadSource",
  "countriesOfInterest",
  "intakeMonth",
  "year",
  "fieldOfStudy",
  "currentStudyLevel",
  "isWhatsAppAvailable",
];

type ImportLeadsDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import so the caller can refresh the list. */
  onImported: () => void;
};

export function ImportLeadsDialog({ open, onClose, onImported }: ImportLeadsDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setBusy(false);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleDownloadSample = () => {
    const csv = EXPECTED_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lead-import-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await leadApi.importLeads(file);
      setResult(res);
      if (res.imported > 0) onImported();
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Import failed. Please check the file and try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Import Leads from CSV</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Upload a <b>.csv</b> or <b>.xlsx</b> file with a header row using these columns
            (extra columns are ignored):
          </Alert>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {EXPECTED_HEADERS.map((h) => (
              <Chip key={h} label={h} size="small" variant="outlined" sx={{ fontSize: 11 }} />
            ))}
          </Box>
          <Typography color="text.disabled" sx={{ fontSize: 11.5 }}>
            Rows missing a first name, or with a phone/email that already exists, are skipped and
            reported below.
          </Typography>

          <Divider />

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => {
              setResult(null);
              setError(null);
              setFile(e.target.files?.[0] ?? null);
            }}
          />
          <Stack
            alignItems={{ xs: "stretch", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <Button
              variant="outlined"
              startIcon={<DownloadRounded />}
              onClick={handleDownloadSample}
              disabled={busy}
              sx={{ textTransform: "none", borderRadius: "9px" }}
            >
              Download sample CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileRounded />}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              sx={{ textTransform: "none", borderRadius: "9px" }}
            >
              Choose file
            </Button>
            <Typography variant="body2" sx={{ color: file ? "text.primary" : "text.disabled" }}>
              {file ? file.name : "No file selected"}
            </Typography>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Alert severity={result.skippedReasons.length ? "warning" : "success"}>
              <Typography sx={{ fontWeight: 600 }} variant="body2">
                Imported {result.imported} lead{result.imported === 1 ? "" : "s"}
                {result.skippedReasons.length
                  ? `, skipped ${result.skippedReasons.length}`
                  : ""}
                .
              </Typography>
              {result.skippedReasons.length ? (
                <List dense sx={{ mt: 0.5, maxHeight: 180, overflow: "auto" }}>
                  {result.skippedReasons.map((s, i) => (
                    <ListItem key={`${s.row}-${i}`} disableGutters sx={{ py: 0 }}>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: 12.5 }}
                        primary={`Row ${s.row}: ${s.reason}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : null}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={busy} sx={{ textTransform: "none" }}>
          {result ? "Close" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!file || busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ textTransform: "none", borderRadius: "9px" }}
        >
          {busy ? "Importing…" : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
