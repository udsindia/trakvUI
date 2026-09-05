import { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import StarOutlineRounded from "@mui/icons-material/StarOutlineRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import UploadRounded from "@mui/icons-material/UploadRounded";
import { useNavigate } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { CourseImportDialog } from "@/modules/universities/components/CourseImportDialog";
import { UniversityImportDialog } from "@/modules/universities/components/UniversityImportDialog";
import { UniversityFormDrawer } from "@/modules/sa-team/components/UniversityFormDrawer";
import {
  useCountries,
  useUniversitiesCatalog,
  useUniversityCourses,
  useUniversityMutations,
} from "@/modules/universities/useUniversitiesCatalog";
import type { UniversityInput } from "@/modules/universities/universitiesCatalogService";
import type { University } from "@/modules/universities/universities.types";
import { universityDetailsPath, courseDetailsPath } from "@/modules/universities/universitiesRoutePaths";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { dataTableSx } from "@/shared/ui/tableStyles";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { useResizableColumn } from "@/modules/universities-browse/useResizableColumn";

/* -----------------------------------------------------------------------
   Colour palette for university crests — cycles through brand tones
----------------------------------------------------------------------- */
const CREST_COLORS = [
  "#2E39C9",
  "#7A3EA8",
  "#0C9268",
  "#A8760F",
  "#2566C7",
  "#CE4038",
  "#1F6E86",
  "#D96F0E",
];

function getCrestColor(index: number) {
  return CREST_COLORS[index % CREST_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* -----------------------------------------------------------------------
   Sub-components
----------------------------------------------------------------------- */
function UniversityCrest({
  color,
  initials,
  size = 38,
}: {
  color: string;
  initials: string;
  size?: number;
}) {
  return (
    <Box
      sx={{
        alignItems: "center",
        background: color,
        borderRadius: "8px",
        color: "#fff",
        display: "flex",
        flexShrink: 0,
        fontFamily: "Georgia, serif",
        fontSize: size > 34 ? 14 : 12,
        fontWeight: 600,
        height: size,
        justifyContent: "center",
        letterSpacing: "-0.5px",
        width: size,
      }}
    >
      {initials}
    </Box>
  );
}

/* -----------------------------------------------------------------------
   Main page
----------------------------------------------------------------------- */
export function UniversitiesBrowsePage() {
  const navigate = useNavigate();
  const { data: catalog, isLoading } = useUniversitiesCatalog();

  const universities = catalog?.universities ?? [];

  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [shortlistedCourseIds, setShortlistedCourseIds] = useState<string[]>([]);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  // Both imports write to the shared catalogue; their services guard every phase with
  // UNIVERSITY_MANAGE, so the triggers are gated on the same permission.
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [universityImportDialogOpen, setUniversityImportDialogOpen] = useState(false);
  const { hasPermissions } = useAuth();
  const canImportCourses = hasPermissions([PERMISSIONS.UNIVERSITIES_MANAGE]);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const { saveUniversityMutation } = useUniversityMutations();
  const { width: listWidth, isDragging, resizeHandleProps } = useResizableColumn();

  const handleSaveUniversity = async (input: UniversityInput) => {
    const isEdit = Boolean(editingUniversity);
    try {
      await saveUniversityMutation.mutateAsync({
        ...input,
        id: editingUniversity?.id,
      });
      setAddDrawerOpen(false);
      setEditingUniversity(null);
      setSnack({
        message: isEdit ? "University updated" : "University added",
        severity: "success",
      });
    } catch (error) {
      setSnack({
        message: getApiErrorMessage(error, `Failed to ${isEdit ? "update" : "add"} university`),
        severity: "error",
      });
    }
  };

  const {
    data: countries = [],
    isLoading: countriesLoading,
    isError: countriesError,
  } = useCountries();

  const filteredUniversities = useMemo(() => {
    let result = universities;

    if (selectedCountry) {
      result = result.filter((u) => u.country === selectedCountry);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((u) =>
        [u.name, u.shortName, u.city, u.country].some((field) =>
          (field ?? "").toLowerCase().includes(q),
        ),
      );
    }

    return result;
  }, [universities, searchQuery, selectedCountry]);

  // The right-hand pane follows the filtered list: a search that no longer contains the
  // selected university falls back to the first match rather than showing a stale one.
  const displayedUniversityId =
    (selectedUniversityId && filteredUniversities.some((u) => u.id === selectedUniversityId)
      ? selectedUniversityId
      : filteredUniversities[0]?.id) ?? null;

  const selectedUniversity = universities.find((u) => u.id === displayedUniversityId);

  // Only the selected university's courses are fetched — see fetchCatalog for why the
  // catalogue no longer pulls every university's courses up front.
  const { data: coursesForSelected = [], isLoading: coursesLoading } =
    useUniversityCourses(displayedUniversityId ?? undefined);

  const shortlistedCourses = useMemo(
    () => coursesForSelected.filter((c) => shortlistedCourseIds.includes(c.id)),
    [coursesForSelected, shortlistedCourseIds],
  );

  const handleToggleShortlist = (courseId: string) => {
    setShortlistedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        // Pinned to the viewport so the two panes scroll inside the page rather than
        // dragging the whole page down with them.
        height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 1,
          px: 2.75,
          py: 1.375,
        }}
      >
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: "text.disabled", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          placeholder="University, city or country…"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": { fontSize: 12.5 },
            width: 230,
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Box
          sx={{
            alignSelf: "stretch",
            background: "divider",
            mx: 0.5,
            width: "1px",
          }}
        />

        {/* Country filter chips */}
        <Stack direction="row" spacing={0.75}>
          {countries.map((country) => {
            const isActive = selectedCountry === country.name;
            return (
              <Chip
                key={country.name}
                clickable
                color={isActive ? "primary" : undefined}
                label={country.name}
                size="small"
                sx={{ fontSize: 11.5, fontWeight: 600 }}
                variant={isActive ? "filled" : "outlined"}
                onClick={() => setSelectedCountry((prev) => (prev === country.name ? null : country.name))}
              />
            );
          })}
        </Stack>

        <Box sx={{ flex: 1 }} />

        {shortlistedCourses.length > 0 && (
          <Chip
            color="warning"
            label={`${shortlistedCourses.length} shortlisted`}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
        {canImportCourses ? (
          <Button
            size="small"
            startIcon={<UploadRounded />}
            sx={{ textTransform: "none" }}
            variant="outlined"
            onClick={() => setUniversityImportDialogOpen(true)}
          >
            Import universities
          </Button>
        ) : null}
        {canImportCourses ? (
          <Button
            size="small"
            startIcon={<UploadRounded />}
            sx={{ textTransform: "none" }}
            variant="outlined"
            onClick={() => setImportDialogOpen(true)}
          >
            Import courses
          </Button>
        ) : null}
        <Button
          size="small"
          startIcon={<AddRounded />}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={() => {
            setEditingUniversity(null);
            setAddDrawerOpen(true);
          }}
        >
          Add university
        </Button>
      </Box>

      <UniversityImportDialog
        open={universityImportDialogOpen}
        onClose={() => setUniversityImportDialogOpen(false)}
      />

      <CourseImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />

      {/* ---- Split panel: institution list + course table ---- */}
      <Box
        sx={{
          display: "grid",
          flex: 1,
          gap: 0,
          // The middle track is the drag handle. Stacked on small screens, where there is
          // no room to split and nothing to resize.
          gridTemplateColumns: { xs: "1fr", lg: `${listWidth}px 7px 1fr` },
          minHeight: { xs: 500, lg: 0 },
        }}
      >
        {/* Left: institution list */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflowY: "auto",
            p: 1.5,
          }}
        >
          <Typography
            sx={{
              color: "text.disabled",
              flexShrink: 0,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 1,
              mb: 1,
              px: 1,
              textTransform: "uppercase",
            }}
          >
            Institutions&nbsp;
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 600 }}>
              · {filteredUniversities.length} of {universities.length}
            </Box>
          </Typography>

          {isLoading ? (
            <Typography color="text.secondary" sx={{ fontSize: 13, px: 1, py: 3 }}>
              Loading universities…
            </Typography>
          ) : (
            filteredUniversities.map((university, index) => {
              const isActive = university.id === displayedUniversityId;
              // The selected row shows the count we actually fetched; the rest use the
              // denormalised counter, which can lag for rows created before it was
              // maintained (see docs/migration-university-course-count-backfill.sql).
              const courseCount =
                isActive && !coursesLoading
                  ? coursesForSelected.length
                  : university.courseCount ?? 0;
              return (
                <Box
                  key={university.id}
                  onClick={() => setSelectedUniversityId(university.id)}
                  sx={{
                    alignItems: "center",
                    border: "1px solid",
                    borderColor: isActive ? "primary.main" : "transparent",
                    borderRadius: 1.5,
                    bgcolor: isActive ? "primary.50" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    gap: 1.375,
                    mb: 0.25,
                    px: 1.125,
                    py: 0.875,
                    transition: "background .13s",
                    "&:hover": {
                      bgcolor: isActive ? "primary.50" : "action.hover",
                    },
                  }}
                >
                  <UniversityCrest
                    color={getCrestColor(index)}
                    initials={getInitials(university.name)}
                    size={32}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{
                        color: isActive ? "primary.main" : "text.primary",
                        fontSize: 12.5,
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {university.name}
                    </Typography>
                    <Typography noWrap sx={{ color: "text.disabled", fontSize: 10.5, mt: 0.25 }}>
                      {university.city}, {university.country}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: isActive ? "primary.main" : "text.disabled",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {courseCount}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>

        {/* Drag handle between the two panes */}
        <Box
          {...resizeHandleProps}
          sx={{
            bgcolor: isDragging ? "primary.main" : "divider",
            cursor: "col-resize",
            display: { xs: "none", lg: "block" },
            flexShrink: 0,
            // The bar itself is hairline-thin; the column around it is the grab target.
            backgroundClip: "content-box",
            borderLeft: "3px solid transparent",
            borderRight: "3px solid transparent",
            transition: "background-color .15s",
            "&:hover": { bgcolor: "primary.main" },
            "&:focus-visible": { bgcolor: "primary.main", outline: "none" },
          }}
        />

        {/* Right: selected university + courses */}
        <Box sx={{ minHeight: 0, minWidth: 0, overflowX: "hidden", overflowY: "auto", p: 2 }}>
          {selectedUniversity ? (
            <>
              {/* University header card */}
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  mb: 2,
                  overflow: "hidden",
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.75,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <UniversityCrest
                      color={getCrestColor(
                        universities.findIndex((u) => u.id === selectedUniversity.id),
                      )}
                      initials={getInitials(selectedUniversity.name)}
                      size={40}
                    />
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: "Georgia, serif",
                          fontSize: 16,
                          fontWeight: 600,
                          lineHeight: 1.2,
                        }}
                      >
                        {selectedUniversity.name}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.25 }}>
                        {selectedUniversity.city}, {selectedUniversity.country}
                        &nbsp;·&nbsp;{coursesLoading
                          ? "…"
                          : `${coursesForSelected.length} courses`}
                        {selectedUniversity.qsRank
                          ? `&nbsp;·&nbsp;QS #${selectedUniversity.qsRank}`
                          : ""}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {canImportCourses ? (
                      <Button
                        size="small"
                        startIcon={<EditRounded />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                        onClick={() => {
                          setEditingUniversity(selectedUniversity);
                          setAddDrawerOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      sx={{ textTransform: "none" }}
                      variant="outlined"
                      onClick={() => navigate(universityDetailsPath(selectedUniversity.id))}
                    >
                      View University
                    </Button>
                  </Stack>
                </Stack>

                {/* Courses table */}
                <TableContainer>
                  <Table sx={dataTableSx}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fbfe" }}>
                        {["Course", "Level", "Duration", "Intake", "Entry", "Tuition", "Shortlist"].map(
                          (header) => (
                            <TableCell
                              key={header}
                              sx={{
                                color: "text.disabled",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textAlign: header === "Shortlist" ? "center" : "left",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {header}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {coursesLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 4, textAlign: "center" }}>
                            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                              Loading courses…
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : coursesForSelected.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 4, textAlign: "center" }}>
                            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                              No courses found for this university.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        coursesForSelected.map((course) => {
                          const isShortlisted = shortlistedCourseIds.includes(course.id);
                          return (
                            <TableRow
                              key={course.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() =>
                                navigate(courseDetailsPath(selectedUniversity.id, course.id))
                              }
                            >
                              <TableCell sx={{ fontSize: 12.5, fontWeight: 600, maxWidth: 220 }}>
                                {course.name}
                              </TableCell>
                              {/* <TableCell>
                                <Box
                                  component="span"
                                  sx={{
                                    bgcolor: "action.hover",
                                    borderRadius: 0.75,
                                    color: "text.secondary",
                                    fontFamily: "monospace",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    px: 0.875,
                                    py: 0.25,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {course.id}
                                </Box>
                              </TableCell> */}
                              <TableCell>
                                <Chip
                                  label={course.levelLabel}
                                  size="small"
                                  sx={{ fontSize: 10.5, fontWeight: 600 }}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ color: "text.secondary", fontSize: 12.5 }}>
                                {course.duration}
                              </TableCell>
                              <TableCell sx={{ color: "text.secondary", fontSize: 12.5 }}>
                                {course.intakes[0] ?? "—"}
                              </TableCell>
                              <TableCell sx={{ color: "text.disabled", fontSize: 11.5 }}>
                                {course.ieltsLabel}
                              </TableCell>
                              <TableCell sx={{ fontSize: 12.5, fontWeight: 600 }}>
                                {formatTuitionLakhs(course.tuitionLakhs)}
                              </TableCell>
                              <TableCell
                                sx={{ textAlign: "center" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleShortlist(course.id);
                                }}
                              >
                                <Box
                                  component="button"
                                  sx={{
                                    background: "none",
                                    border: 0,
                                    color: isShortlisted ? "warning.main" : "text.disabled",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    fontSize: 18,
                                    lineHeight: 1,
                                    p: 0.25,
                                    transition: "color .12s",
                                    "&:hover": { color: "warning.main" },
                                  }}
                                  title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                                >
                                  {isShortlisted ? (
                                    <StarRounded sx={{ fontSize: 20 }} />
                                  ) : (
                                    <StarOutlineRounded sx={{ fontSize: 20 }} />
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Shortlist panel */}
              {shortlistedCourses.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        Course shortlist
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.25 }}>
                        Stored against the student's record by course ID · drives the application
                        step
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      sx={{ textTransform: "none" }}
                      variant="contained"
                    >
                      Create applications
                    </Button>
                  </Stack>
                  <TableContainer>
                    <Table sx={dataTableSx}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fbfe" }}>
                          {["Course", "University", "Added", ""].map((header) => (
                            <TableCell
                              key={header}
                              sx={{
                                color: "text.disabled",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shortlistedCourses.map((course) => {
                          const uni = universities.find((u) => u.id === course.universityId);
                          return (
                            <TableRow key={course.id} hover>
                              <TableCell>
                                <Box
                                  component="span"
                                  sx={{
                                    bgcolor: "action.hover",
                                    borderRadius: 0.75,
                                    color: "text.secondary",
                                    fontFamily: "monospace",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    px: 0.875,
                                    py: 0.25,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {course.id}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: 12.5, fontWeight: 600 }}>
                                {course.name}
                              </TableCell>
                              <TableCell sx={{ color: "text.secondary", fontSize: 12.5 }}>
                                {uni?.name ?? "—"}
                              </TableCell>
                              <TableCell sx={{ color: "text.disabled", fontSize: 11.5 }}>
                                Just now
                              </TableCell>
                              <TableCell sx={{ textAlign: "right" }}>
                                <Button
                                  size="small"
                                  sx={{ fontSize: 11.5, textTransform: "none" }}
                                  variant="outlined"
                                  onClick={() => handleToggleShortlist(course.id)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          ) : (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                {isLoading ? "Loading universities…" : "Select a university from the list to view its courses."}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <UniversityFormDrawer
        open={addDrawerOpen}
        university={editingUniversity}
        onClose={() => {
          setAddDrawerOpen(false);
          setEditingUniversity(null);
        }}
        onSave={handleSaveUniversity}
      />

      <Snackbar
        autoHideDuration={3000}
        open={Boolean(snack)}
        onClose={() => setSnack(null)}
      >
        {snack ? (
          <Alert severity={snack.severity} sx={{ width: "100%" }} onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Paper>
  );
}
