import { useRef, useState, type ChangeEvent } from "react";
import { DownloadRounded, UploadRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import {
  UNIVERSITY_IMPORT_FIELDS,
  UNIVERSITY_IMPORT_GROUPS,
  UNIVERSITY_IMPORT_REQUIRED,
  IMPORT_FIELD_LABELS,
} from "@/config/universities/importFields";
import {
  ImportColumnMapper,
  autoMapHeaders,
} from "@/modules/universities/components/ImportColumnMapper";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import { universitiesCatalogQueryKey } from "@/modules/universities/universitiesCatalogService";
import type {
  UniversityDuplicateAction,
  UniversityImportCommitItem,
  UniversityImportPreviewResponse,
  UniversityImportResultResponse,
} from "@/modules/universities/universitiesApi.types";

type UniversityImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Two-phase university import: preview the CSV, resolve duplicates, then commit.
 * Nothing is written until the user confirms.
 *
 * Mirrors CourseImportDialog, with two differences that come from the backend:
 *   - rows describing the same university collapse into one preview row (hence rowRef
 *     rather than a single line number), and
 *   - duplicates offer UPDATE as well as SKIP/CREATE.
 *
 * Universities only. Courses are imported from their own button, against universities
 * that already exist. Parsing is lenient: only university_name and country_code are
 * fatal, and a bad optional cell is dropped with a warning rather than failing the row.
 *
 * Both phases are guarded by UNIVERSITY_MANAGE (UniversityImportService), so hosts
 * should gate the trigger on the same permission.
 */
export function UniversityImportDialog({ open, onClose }: UniversityImportDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[] | null>(null);
  const [mappingNotice, setMappingNotice] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<UniversityImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<UniversityImportResultResponse | null>(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState<
    Record<string, UniversityDuplicateAction>
  >({});

  const resetPreview = () => {
    setPreviewResult(null);
    setCommitResult(null);
    setImportError(null);
  };

  const handleDownloadTemplate = async () => {
    setImportError(null);
    try {
      const csv = await universitiesApi.downloadUniversityImportTemplate();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "university-import-template.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to download the CSV template.",
      );
    }
  };

  const handleSelectImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      resetPreview();
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      resetPreview();
      setImportError("Please choose a CSV file (.csv).");
      return;
    }

    setSelectedFile(file);
    resetPreview();
    void detectColumns(file);
  };

  /**
   * Reads the file's own headers so the mapping step can be shown before previewing.
   * A failure here is not fatal: the preview still runs and the backend falls back to
   * matching header text, exactly as it did before mapping existed.
   */
  const detectColumns = async (file: File) => {
    setMappingNotice(null);
    try {
      const headers = await universitiesApi.detectUniversityImportColumns(file);
      setDetectedHeaders(headers);
      setMapping(autoMapHeaders(UNIVERSITY_IMPORT_FIELDS, headers));
    } catch (error) {
      setDetectedHeaders(null);
      setMapping({});
      // Not fatal — preview still works off header-name matching. But it must not be
      // silent: a missing mapping step with no explanation is impossible to diagnose,
      // and the usual cause is a server that predates this endpoint.
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      setMappingNotice(
        status === 404
          ? "Column mapping is unavailable — the server does not have this endpoint yet. Restart the backend to enable it. You can still import if the file uses our column names."
          : "Could not read this file's column headers, so the mapping step is unavailable. You can still import if the file uses our column names.",
      );
    }
  };

  const handlePreviewImport = async () => {
    if (!selectedFile) {
      setImportError("Please choose a CSV file to preview.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setCommitResult(null);
    setDuplicateDecisions({});

    try {
      const result = await universitiesApi.previewUniversityImport(selectedFile, mapping);
      setPreviewResult(result);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to preview the import.");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult) {
      return;
    }

    setCommitting(true);
    setImportError(null);

    const universities: UniversityImportCommitItem[] = previewResult.universities.map((row) => ({
      name: row.name,
      countryCode: row.countryCode,
      city: row.city,
      universityType: row.universityType,
      qsRanking: row.qsRanking,
      website: row.website,
      livingCostCurrency: row.livingCostCurrency,
      livingCostAmount: row.livingCostAmount,
      onDuplicate: row.status === "DUPLICATE" ? duplicateDecisions[row.rowRef] ?? "SKIP" : "SKIP",
    }));

    try {
      const result = await universitiesApi.commitUniversityImport({ universities });
      setCommitResult(result);
      setPreviewResult(null);
      if (result.created > 0 || result.updated > 0) {
        await queryClient.invalidateQueries({ queryKey: universitiesCatalogQueryKey });
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to complete the import.");
    } finally {
      setCommitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDetectedHeaders(null);
    setMapping({});
    setMappingNotice(null);
    setPreviewResult(null);
    setCommitResult(null);
    setImportError(null);
    setDuplicateDecisions({});
    setImporting(false);
    setCommitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const hasPreviewRows = (previewResult?.universities.length ?? 0) > 0;
  const partialCount =
    previewResult?.universities.filter((row) => (row.warnings?.length ?? 0) > 0).length ?? 0;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <DialogTitle>Import universities</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!commitResult ? (
            <>
              <Alert severity="info">
                Upload a CSV using the template headers. Only university_name and country_code
                are required — every other cell is optional, and anything that can&apos;t be read
                is dropped with a warning rather than failing the row. Country codes are 2-letter
                ISO (GB, not GBR); university_type is PUBLIC, PRIVATE or RESEARCH_INTENSIVE. Use
                Import courses to add courses to these universities afterwards. Nothing is written
                until you review the preview and confirm.
              </Alert>
              <Stack
                alignItems={{ xs: "stretch", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
              >
                <Button
                  startIcon={<DownloadRounded />}
                  onClick={handleDownloadTemplate}
                  variant="outlined"
                >
                  Download CSV template
                </Button>
                <Button component="label" startIcon={<UploadRounded />} variant="contained">
                  Choose file CSV
                  <input
                    accept=".csv,text/csv"
                    hidden
                    ref={fileInputRef}
                    type="file"
                    onChange={handleSelectImportFile}
                  />
                </Button>
              </Stack>
              {selectedFile ? (
                <Typography color="text.secondary" variant="body2">
                  Selected file: {selectedFile.name}
                </Typography>
              ) : null}

              {mappingNotice && !previewResult ? (
                <Alert severity="warning">{mappingNotice}</Alert>
              ) : null}

              {selectedFile && detectedHeaders && !previewResult ? (
                <ImportColumnMapper
                  groups={UNIVERSITY_IMPORT_GROUPS}
                  headers={detectedHeaders}
                  labels={IMPORT_FIELD_LABELS}
                  requiredFields={UNIVERSITY_IMPORT_REQUIRED}
                  value={mapping}
                  onChange={setMapping}
                />
              ) : null}

            </>
          ) : null}

          {importError ? <Alert severity="error">{importError}</Alert> : null}
          {importing || committing ? <LinearProgress /> : null}

          {previewResult && !commitResult ? (
            <>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip
                  color="success"
                  label={`${previewResult.summary.newUniversities} new`}
                  size="small"
                />
                <Chip
                  color="warning"
                  label={`${previewResult.summary.duplicateUniversities} duplicate`}
                  size="small"
                />
                <Chip
                  color="error"
                  label={`${previewResult.summary.invalidRows} invalid`}
                  size="small"
                />
                {partialCount > 0 ? (
                  <Chip color="info" label={`${partialCount} partial`} size="small" variant="outlined" />
                ) : null}
              </Stack>

              {hasPreviewRows ? (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Line</TableCell>
                        <TableCell>University</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.universities.map((row) => (
                        <TableRow key={row.rowRef}>
                          <TableCell>{row.rowRef}</TableCell>
                          <TableCell>
                            {row.name} ({row.countryCode})
                            {row.city ? (
                              <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                                {row.city}
                              </Typography>
                            ) : null}
                            {row.warnings?.length ? (
                              <Typography color="warning.main" sx={{ fontSize: 11 }}>
                                {row.warnings.join("; ")}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>{row.universityType ?? "—"}</TableCell>
                          <TableCell>
                            <Chip
                              color={row.status === "NEW" ? "success" : "warning"}
                              label={row.status}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {row.status === "DUPLICATE" ? (
                              <Select
                                size="small"
                                sx={{ fontSize: 12, minWidth: 150 }}
                                value={duplicateDecisions[row.rowRef] ?? "SKIP"}
                                onChange={(event) =>
                                  setDuplicateDecisions((prev) => ({
                                    ...prev,
                                    [row.rowRef]: event.target.value as UniversityDuplicateAction,
                                  }))
                                }
                              >
                                <MenuItem value="SKIP">Skip (keep existing)</MenuItem>
                                <MenuItem value="UPDATE">Update existing</MenuItem>
                                <MenuItem value="CREATE">Create anyway</MenuItem>
                              </Select>
                            ) : (
                              <Typography color="text.secondary" variant="body2">
                                Will be created
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning">
                  {previewResult.totalRows === 0
                    ? "The headers are valid but the file has no data rows — nothing to import."
                    : "No importable universities were found in this file."}
                </Alert>
              )}

              {previewResult.invalidRows.length > 0 ? (
                <Box>
                  <Typography sx={{ mb: 0.5 }} variant="subtitle2">
                    Invalid rows (won&apos;t be imported)
                  </Typography>
                  <List dense sx={{ maxHeight: 160, overflow: "auto" }}>
                    {previewResult.invalidRows.map((row) => (
                      <ListItem key={row.line} disableGutters sx={{ py: 0 }}>
                        <ListItemText
                          primaryTypographyProps={{ fontSize: 12.5 }}
                          primary={`Line ${row.line}: ${row.errors.join("; ")}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : null}
            </>
          ) : null}

          {commitResult ? (
            <>
              <Alert severity={commitResult.failed > 0 ? "warning" : "success"}>
                {commitResult.created} created, {commitResult.updated} updated,{" "}
                {commitResult.skipped} skipped, {commitResult.failed} failed.
              </Alert>
              {commitResult.results.length > 0 ? (
                <List dense sx={{ maxHeight: 240, overflow: "auto" }}>
                  {commitResult.results.map((result) => (
                    <ListItem
                      key={`${result.name}-${result.countryCode}`}
                      disableGutters
                      sx={{ py: 0 }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ fontSize: 12.5 }}
                        primary={`${result.name} (${result.countryCode}) — ${result.action}`}
                        secondary={result.errors.length > 0 ? result.errors.join("; ") : null}
                        secondaryTypographyProps={{ color: "error", fontSize: 11.5 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          {commitResult ? "Close" : "Cancel"}
        </Button>
        {!commitResult && !previewResult ? (
          <Button
            disabled={!selectedFile || importing}
            onClick={handlePreviewImport}
            sx={{ textTransform: "none" }}
            variant="contained"
          >
            Preview
          </Button>
        ) : null}
        {previewResult && !commitResult ? (
          <Button
            disabled={committing || !hasPreviewRows}
            onClick={handleConfirmImport}
            sx={{ textTransform: "none" }}
            variant="contained"
          >
            Confirm import
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
