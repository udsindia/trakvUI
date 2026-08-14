import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { DownloadRounded, TuneRounded, UploadRounded } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { studentsApi, type StudentOption } from "@/modules/applications/studentsApi";
import { shortlistApi } from "@/modules/universities/shortlistApi";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { CourseSearchCard } from "@/modules/universities/components/CourseSearchCard";
import { ShortlistTray } from "@/modules/universities/components/ShortlistTray";
import sampleCsvUrl from "@/assets/course-import-sample.csv?url";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import type {
  CourseImportCommitItem,
  CourseImportPreviewResponse,
  CourseImportResultResponse,
} from "@/modules/universities/universitiesApi.types";
import {
  buildCourseSearchFilterConfig,
  getCourseSearchDefaultFilterValues,
  getCourseSearchSliderFallbacks,
} from "@/modules/universities/courseSearchFilterConfig";
import { universitiesCatalogQueryKey } from "@/modules/universities/universitiesCatalogService";
import { toAlpha2CountryCode } from "@/modules/universities/universitiesMappers";
import {
  buildCourseSearchResults,
  filterCourseSearchResults,
  getCountryCounts,
  sortCourseSearchResults,
} from "@/modules/universities/courseSearchUtils";
import { useCountries, useUniversitiesCatalog } from "@/modules/universities/useUniversitiesCatalog";
import {
  courseDetailsPath,
  universityDetailsPath,
} from "@/modules/universities/universitiesRoutePaths";
import {
  universitiesContentSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import type {
  CourseLevel,
  CourseSearchFilters,
  CourseSortOption,
} from "@/modules/universities/universities.types";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import type { FilterPanelValue, FilterPanelValues } from "@/shared/components/FilterPanel";
import { FilterPanel } from "@/shared/components/FilterPanel";

const { defaults: defaultSearchSettings, filters: filterKeys } = courseSearchSettings;
const sliderFallbacks = getCourseSearchSliderFallbacks();

function countActiveFilters(
  values: FilterPanelValues,
  filterConfig: ReturnType<typeof buildCourseSearchFilterConfig>,
  defaults: FilterPanelValues,
): number {
  return filterConfig.reduce((count, filter) => {
    const value = values[filter.key];
    switch (filter.type) {
      case "checkbox-group":
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
      case "slider": {
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value as [number, number];
          const defaultValue = defaults[filter.key] as [number, number] | undefined;
          if (defaultValue && (min !== defaultValue[0] || max !== defaultValue[1])) {
            return count + 1;
          }
        }
        return count;
      }
      default:
        return count;
    }
  }, 0);
}

function asStringArray(value: FilterPanelValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.every((entry) => typeof entry === "string") ? value : [];
}

function asNumberRange(
  value: FilterPanelValue | undefined,
  fallback: [number, number],
): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return fallback;
  }

  const [min, max] = value;
  if (typeof min !== "number" || typeof max !== "number") {
    return fallback;
  }

  return [min, max];
}

function toSearchFilters(
  filterValues: FilterPanelValues,
  query: string,
  sort: CourseSortOption,
): CourseSearchFilters {
  return {
    query,
    countries: asStringArray(filterValues[filterKeys.country.key]),
    levels: asStringArray(filterValues[filterKeys.level.key]) as CourseLevel[],
    intakes: asStringArray(filterValues[filterKeys.intake.key]),
    tuitionRange: asNumberRange(filterValues[filterKeys.tuition.key], sliderFallbacks.tuition),
    ieltsRange: asNumberRange(filterValues[filterKeys.ielts.key], sliderFallbacks.ielts),
    eligibleOnly: false,
    matchStudent: false,
    sort,
  };
}

export function CourseSearchPage() {
  const navigate = useNavigate();
  const { data: catalog, isLoading, isError } = useUniversitiesCatalog();
  const { data: countries = [] } = useCountries();
  const universities = catalog?.universities ?? [];
  const courses = catalog?.courses ?? [];

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getCourseSearchDefaultFilterValues(
      buildCourseSearchFilterConfig({
        countryCounts: {},
      }),
    ),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<CourseSortOption>(defaultSearchSettings.sort);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Student context for shortlisting (a shortlist belongs to a student) ──────
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students", "options"],
    queryFn: studentsApi.getStudents,
  });

  const preselectId = searchParams.get("studentId");
  useEffect(() => {
    if (preselectId && !selectedStudent) {
      const match = students.find((s) => s.id === preselectId);
      if (match) setSelectedStudent(match);
    }
  }, [preselectId, students, selectedStudent]);

  const studentId = selectedStudent?.id ?? null;

  const { data: shortlistIds = [] } = useQuery({
    queryKey: ["shortlist", studentId],
    queryFn: () => shortlistApi.getShortlistedCourseIds(studentId as string),
    enabled: !!studentId,
  });

  const shortlistMutation = useMutation({
    mutationFn: ({ courseId, add }: { courseId: string; add: boolean }) =>
      add
        ? shortlistApi.addToShortlist(studentId as string, courseId)
        : shortlistApi.removeFromShortlist(studentId as string, courseId),
    onSettled: () => {
      if (studentId) queryClient.invalidateQueries({ queryKey: ["shortlist", studentId] });
    },
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<CourseImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CourseImportResultResponse | null>(null);
  // Per-row decision for DUPLICATE rows, keyed by the row's source CSV line — defaults to
  // SKIP (leave the existing course alone) unless the user explicitly opts to create anyway.
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, "SKIP" | "CREATE">>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseResults = useMemo(
    () => buildCourseSearchResults(courses, universities),
    [courses, universities],
  );

  const countryCounts = useMemo(() => getCountryCounts(baseResults), [baseResults]);

  const countryFilterOptions = useMemo(() => {
    const apiOptions = countries
      .map((country) => ({
        label: country.name,
        value: toAlpha2CountryCode(country.code),
      }))
      .filter((option) => option.label && option.value);

    if (apiOptions.length > 0) {
      return apiOptions;
    }

    return courseSearchSettings.filters.country.options.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  }, [countries]);

  const filterConfig = useMemo(() => {
    const config = buildCourseSearchFilterConfig({ countryCounts });
    return config.map((filter) => {
      if (filter.type !== "checkbox-group" || filter.key !== filterKeys.country.key) {
        return filter;
      }

      return {
        ...filter,
        options: countryFilterOptions.map((option) => ({
          label: filterKeys.country.showCounts
            ? `${option.label} (${countryCounts[option.value] ?? 0})`
            : option.label,
          value: option.value,
        })),
      };
    });
  }, [countryCounts, countryFilterOptions]);

  const defaultFilterValues = useMemo(
    () => getCourseSearchDefaultFilterValues(filterConfig),
    [filterConfig],
  );
  const activeFilterCount = countActiveFilters(filterValues, filterConfig, defaultFilterValues);

  const filteredResults = useMemo(() => {
    const filters = toSearchFilters(filterValues, searchQuery, sort);
    const filtered = filterCourseSearchResults(baseResults, filters);
    return sortCourseSearchResults(filtered, sort);
  }, [baseResults, filterValues, searchQuery, sort]);

  const shortlistItems = useMemo(
    () => baseResults.filter((result) => shortlistIds.includes(result.id)),
    [baseResults, shortlistIds],
  );

  const handleToggleShortlist = (courseId: string) => {
    if (!studentId) return;
    const add = !shortlistIds.includes(courseId);
    // Optimistic cache update so the button flips instantly; onSettled resyncs.
    queryClient.setQueryData<string[]>(["shortlist", studentId], (prev = []) =>
      add ? [...prev, courseId] : prev.filter((id) => id !== courseId),
    );
    shortlistMutation.mutate({ courseId, add });
  };

  const handleClearFilters = () => {
    setFilterValues(defaultFilterValues);
    setSort(defaultSearchSettings.sort);
    setSearchQuery("");
  };

  const handleApplyFilters = (values: FilterPanelValues) => {
    setFilterValues(values);
    setDrawerOpen(false);
  };

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

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportError(null);
    setPreviewResult(null);
    setCommitResult(null);
    setDuplicateDecisions({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={[
        universitiesPagePaperSx,
        { height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` } },
      ]}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={0.5}
              sx={{ alignItems: "center" }}
            >
              <Autocomplete
                getOptionLabel={(option) => option.name || option.email || option.id}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                options={students}
                size="small"
                sx={{ width: { xs: "100%", md: 230 } }}
                value={selectedStudent}
                onChange={(_, value) => setSelectedStudent(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Shortlist for"
                    placeholder="Select student"
                  />
                )}
              />
              <GlobalSearchBar
                placeholder={courseSearchSettings.search.placeholder}
                sx={{ width: { xs: "100%", md: 300 } }}
                value={searchQuery}
                onSearch={setSearchQuery}
              />
              <Badge
                badgeContent={activeFilterCount}
                color="primary"
                overlap="rectangular"
                sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontWeight: 700 } }}
              >
                <Button
                  startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
                  variant="outlined"
                  sx={{
                    borderRadius: "9px",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setDrawerOpen(true)}
                  size="small"
                >
                  Filters
                </Button>
              </Badge>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  sx={{ fontSize: 13 }}
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CourseSortOption)}
                >
                  {courseSearchSettings.sort.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                startIcon={<UploadRounded sx={{ fontSize: 18 }} />}
                sx={{ borderRadius: "9px", textTransform: "none", whiteSpace: "nowrap" }}
                variant="contained"
                onClick={() => setImportDialogOpen(true)}
                size="small"
              >
                Import courses
              </Button>
            </Stack>
          }
          subtitle=""
          title=""
        />
      </Box>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <Box sx={[universitiesContentSx, { display: "flex", flexDirection: "column" }]}>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2.75 }}>
            {isLoading ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Loading courses...
              </Typography>
            ) : isError ? (
              <Typography color="error" sx={{ py: 4, textAlign: "center" }}>
                Failed to load courses. Please try again.
              </Typography>
            ) : (
              <>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "space-between",
                    mb: 1.75,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                      {filteredResults.length}
                    </Box>{" "}
                    courses found
                  </Typography>
                  <Chip
                    clickable
                    label="Reset filters"
                    size="small"
                    sx={{
                      borderColor: "divider",
                      borderRadius: "8px",
                      color: "text.secondary",
                      display: { xs: "none", lg: "inline-flex" },
                      fontWeight: 600,
                    }}
                    variant="outlined"
                    onClick={handleClearFilters}
                  />
                </Stack>

                <Stack spacing={1.25}>
                  {filteredResults.map((result) => (
                    <CourseSearchCard
                      key={result.id}
                      isShortlisted={shortlistIds.includes(result.id)}
                      result={result}
                      shortlistDisabled={!studentId}
                      shortlistDisabledReason="Select a student to shortlist for"
                      studentName={selectedStudent?.name}
                      onAddToShortlist={() => handleToggleShortlist(result.id)}
                      onViewCourse={() =>
                        navigate(courseDetailsPath(result.universityId, result.id))
                      }
                      onViewUniversity={() =>
                        navigate(universityDetailsPath(result.universityId))
                      }
                    />
                  ))}

                  {filteredResults.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No courses match your search.
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        Try clearing filters or searching by course, university, or city.
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </>
            )}
          </Box>

          <ShortlistTray
            items={shortlistItems}
            onRemove={(courseId) => handleToggleShortlist(courseId)}
            onSend={() => undefined}
          />
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        slotProps={{ paper: { sx: { display: "flex", flexDirection: "column", width: { xs: "100%", sm: 360 } } } }}
        onClose={() => setDrawerOpen(false)}
      >
        <FilterPanel
          applyButtonLabel={courseSearchSettings.filterPanel.applyButtonLabel}
          filtersConfig={filterConfig}
          sx={{ height: "100%" }}
          title={courseSearchSettings.filterPanel.title}
          values={filterValues}
          width="100%"
          onApplyFilters={handleApplyFilters}
          onFiltersChange={setFilterValues}
        />
      </Drawer>

      <Dialog fullWidth maxWidth="md" open={importDialogOpen} onClose={handleCloseImportDialog}>
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
                      Invalid rows (won't be imported)
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
            <Button onClick={handleCloseImportDialog} variant="contained">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseImportDialog}>Cancel</Button>
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
    </Paper>
  );
}
