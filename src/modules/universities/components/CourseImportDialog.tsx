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
import sampleCsvUrl from "@/assets/course-import-sample.csv?url";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import { universitiesCatalogQueryKey } from "@/modules/universities/universitiesCatalogService";
import type {
  CourseImportCommitItem,
  CourseImportPreviewResponse,
  CourseImportResultResponse,
} from "@/modules/universities/universitiesApi.types";

type CourseImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Two-phase course import: preview the CSV, resolve duplicates, then commit.
 * Nothing is written until the user confirms.
 *
 * Owns all of its own state and clears it on close, so the host page only tracks
 * whether the dialog is open. The backend guards both phases with UNIVERSITY_MANAGE
 * (CourseImportService), so hosts should gate the trigger on the same permission.
 */
export function CourseImportDialog({ open, onClose }: CourseImportDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<CourseImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CourseImportResultResponse | null>(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, "SKIP" | "CREATE">>({});

  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = sampleCsvUrl;
    link.download = "course-import-sample.csv";
    link.click();
  };

  const handleSelectImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setPreviewResult(null);
      setCommitResult(null);
      setImportError(null);
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv")) {
      setSelectedFile(null);
      setPreviewResult(null);
      setCommitResult(null);
      setImportError("Please choose a CSV file (.csv).");
      return;
    }

    setSelectedFile(file);
    setPreviewResult(null);
    setCommitResult(null);
    setImportError(null);
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
      const result = await universitiesApi.previewCourseImport(selectedFile);
      setPreviewResult(result);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to preview the import.");
    } finally {
      setImporting(false);
    }
  };

  const handleToggleDuplicateDecision = (line: number, createAnyway: boolean) => {
    setDuplicateDecisions((prev) => ({ ...prev, [line]: createAnyway ? "CREATE" : "SKIP" }));
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.courses.length === 0) return;

    setCommitting(true);
    setImportError(null);

    try {
      const items: CourseImportCommitItem[] = previewResult.courses.map((row) => ({
        universityId: row.universityId,
        universityName: row.universityName,
        countryCode: row.countryCode,
        courseName: row.courseName,
        code: row.code,
        studyLevel: row.studyLevel,
        subjectArea: row.subjectArea,
        durationMonths: row.durationMonths,
        tuitionCurrency: row.tuitionCurrency,
        tuitionAmount: row.tuitionAmount,
        courseUrl: row.courseUrl,
        applicationFeeCurrency: row.applicationFeeCurrency,
        applicationFeeAmount: row.applicationFeeAmount,
        livingCostCurrency: row.livingCostCurrency,
        livingCostAmount: row.livingCostAmount,
        courseStartDate: row.courseStartDate,
        courseEndDate: row.courseEndDate,
        pgwpEligible: row.pgwpEligible,
        scholarshipNote: row.scholarshipNote,
        onDuplicate: duplicateDecisions[row.line] ?? "SKIP",
      }));

      const result = await universitiesApi.commitCourseImport({ courses: items });
      setCommitResult(result);
      if (result.created > 0) {
        queryClient.invalidateQueries({ queryKey: universitiesCatalogQueryKey });
        queryClient.invalidateQueries({ queryKey: ["universities"] });
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import the file.");
    } finally {
      setCommitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportError(null);
    setPreviewResult(null);
    setCommitResult(null);
    setDuplicateDecisions({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <DialogTitle>Import courses</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!commitResult ? (
            <>
              <Alert severity="info">
                Upload a CSV file using the exact headers below. The required columns are
                university_name, country_code, and course_name. Nothing is written until you
                review the preview and confirm.
              </Alert>
              <Stack
                alignItems={{ xs: "stretch", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
              >
                <Button startIcon={<DownloadRounded />} onClick={handleDownloadSample} variant="outlined">
                  Download sample CSV
                </Button>
                <Button component="label" startIcon={<UploadRounded />} variant="contained">
                  Choose file CSV
                  <input
                    accept=".csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
            </>
          ) : null}

          {importError ? <Alert severity="error">{importError}</Alert> : null}
          {importing || committing ? <LinearProgress /> : null}

          {previewResult && !commitResult ? (
            <>
              <Stack direction="row" spacing={1}>
                <Chip color="success" label={`${previewResult.summary.newCourses} new`} size="small" />
                <Chip color="warning" label={`${previewResult.summary.duplicateCourses} duplicate`} size="small" />
                <Chip color="error" label={`${previewResult.summary.invalidRows} invalid`} size="small" />
              </Stack>

              {previewResult.courses.length > 0 ? (
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Line</TableCell>
                        <TableCell>University</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.courses.map((row) => (
                        <TableRow key={row.line}>
                          <TableCell>{row.line}</TableCell>
                          <TableCell>{row.universityName} ({row.countryCode})</TableCell>
                          <TableCell>{row.courseName}</TableCell>
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
                                sx={{ fontSize: 12, minWidth: 130 }}
                                value={duplicateDecisions[row.line] ?? "SKIP"}
                                onChange={(event) =>
                                  handleToggleDuplicateDecision(row.line, event.target.value === "CREATE")
                                }
                              >
                                <MenuItem value="SKIP">Skip (keep existing)</MenuItem>
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
              ) : null}

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
                Imported {commitResult.created} course{commitResult.created === 1 ? "" : "s"}
                {commitResult.skipped ? `, skipped ${commitResult.skipped}` : ""}
                {commitResult.failed ? `, failed ${commitResult.failed}` : ""}.
              </Alert>
              <List dense sx={{ maxHeight: 260, overflow: "auto" }}>
                {commitResult.results.map((r, i) => (
                  <ListItem key={`${r.name}-${i}`} disableGutters sx={{ py: 0 }}>
                    <ListItemText
                      primaryTypographyProps={{ fontSize: 12.5 }}
                      primary={`${r.action}: ${r.name} (${r.universityName})`}
                      secondaryTypographyProps={{ fontSize: 11.5, color: "error.main" }}
                      secondary={r.errors.length > 0 ? r.errors.join("; ") : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        {commitResult ? (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            {previewResult ? (
              <Button
                disabled={committing || previewResult.courses.length === 0}
                onClick={handleConfirmImport}
                variant="contained"
              >
                Confirm import
              </Button>
            ) : (
              <Button disabled={importing || !selectedFile} onClick={handlePreviewImport} variant="contained">
                Preview import
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
