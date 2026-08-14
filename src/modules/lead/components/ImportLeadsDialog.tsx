import { type ChangeEvent, useRef, useState } from "react";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
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
  "college",
  "countriesOfInterest",
  "intakeMonth",
  "year",
  "fieldOfStudy",
  "currentStudyLevel",
  "isWhatsAppAvailable",
  "englishProficiencyTest",
  "englishProficiencyTestScore",
];

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  emailAddress: "Email Address",
  countryCode: "Country Code",
  phoneNo: "Phone Number",
  leadSource: "Lead Source",
  college: "College Name",
  countriesOfInterest: "Countries of Interest",
  intakeMonth: "Intake Month",
  year: "Intake Year",
  fieldOfStudy: "Field of Study",
  currentStudyLevel: "Current Study Level",
  isWhatsAppAvailable: "WhatsApp Available",
  englishProficiencyTest: "English Proficiency Test",
  englishProficiencyTestScore: "English Proficiency Test Score",
};

/** Strips case/spacing/punctuation so "First Name" / "first_name" both match "firstName". */
function normalizeHeader(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort guess at our field -> the file's column, mirroring the backend's own fallback. */
function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of EXPECTED_HEADERS) {
    const match = headers.find((h) => normalizeHeader(h) === normalizeHeader(field));
    if (match) mapping[field] = match;
  }
  return mapping;
}

type ImportLeadsDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import so the caller can refresh the list. */
  onImported: () => void;
};

export function ImportLeadsDialog({ open, onClose, onImported }: ImportLeadsDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[] | null>(null);
  const [detectingHeaders, setDetectingHeaders] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isFromCollege, setIsFromCollege] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setDetectedHeaders(null);
    setDetectingHeaders(false);
    setMapping({});
    setIsFromCollege(false);
    setCollegeName("");
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setResult(null);
    setError(null);
    setFile(selected);
    setDetectedHeaders(null);
    setMapping({});
    if (!selected) return;

    setDetectingHeaders(true);
    try {
      const headers = await leadApi.detectImportColumns(selected);
      setDetectedHeaders(headers);
      setMapping(autoMapHeaders(headers));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not read that file. Please check it's a valid .csv or .xlsx file.";
      setError(message);
    } finally {
      setDetectingHeaders(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const cleanMapping = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v));
      const res = await leadApi.importLeads(
        file,
        cleanMapping,
        isFromCollege ? collegeName.trim() : undefined,
      );
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

  const showMapping = Boolean(detectedHeaders) && !result;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Import Leads from CSV</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isFromCollege}
                  disabled={busy}
                  onChange={(e) => setIsFromCollege(e.target.checked)}
                />
              }
              label="This data is from a college"
            />
            {isFromCollege ? (
              <TextField
                autoFocus
                disabled={busy}
                fullWidth
                helperText="Applied to every lead in this file — Lead Source will be set to College."
                label="College Name"
                placeholder="Enter the college's name"
                required
                size="small"
                sx={{ mt: 1 }}
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
              />
            ) : null}
          </Box>

          {!showMapping ? (
            <>
              <Alert severity="info">
                Upload a <b>.csv</b> or <b>.xlsx</b> file. If its columns don&apos;t already match
                ours, you&apos;ll get a chance to map them next:
              </Alert>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {EXPECTED_HEADERS.map((h) => (
                  <Chip key={h} label={FIELD_LABELS[h]} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                ))}
              </Box>
            </>
          ) : (
            <>
              <Alert severity="info">
                We matched what we could automatically — adjust any that look wrong, then import.
              </Alert>
              <Stack spacing={1}>
                {EXPECTED_HEADERS.filter(
                  (field) => !isFromCollege || (field !== "leadSource" && field !== "college"),
                ).map((field) => (
                  <Stack key={field} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 12.5, width: 160, flexShrink: 0 }}>
                      {FIELD_LABELS[field]}
                      {field === "firstName" ? " *" : ""}
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        displayEmpty
                        value={mapping[field] ?? ""}
                        onChange={(e) =>
                          setMapping((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                      >
                        <MenuItem value="">
                          <em>Not in file</em>
                        </MenuItem>
                        {(detectedHeaders ?? []).map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                ))}
              </Stack>
            </>
          )}

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
            onChange={handleFileChange}
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
              {detectingHeaders ? "Reading columns…" : file ? file.name : "No file selected"}
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
          disabled={
            !file ||
            busy ||
            detectingHeaders ||
            (showMapping && !mapping.firstName) ||
            (isFromCollege && !collegeName.trim())
          }
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ textTransform: "none", borderRadius: "9px" }}
        >
          {busy ? "Importing…" : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
