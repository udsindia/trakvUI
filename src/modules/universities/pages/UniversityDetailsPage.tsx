import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  AddRounded,
  ChecklistRounded,
  DeleteOutlineRounded,
  EditRounded,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { useAuth } from "@/app/auth/authHooks";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { CourseFormDrawer } from "@/modules/universities/components/CourseFormDrawer";
import { CatalogDeleteDialog } from "@/modules/universities/components/CatalogDeleteDialog";
import { UniversityFormDrawer } from "@/modules/sa-team/components/UniversityFormDrawer";
import { UniversityDefaultsDialog } from "@/modules/universities/components/UniversityDefaultsDialog";
import { DetailPageHeader } from "@/modules/universities/components/UniversitiesBreadcrumb";
import { RequirementRow } from "@/modules/universities/components/RequirementRow";
import { UniversityHero } from "@/modules/universities/components/UniversityHero";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { courseDetailsPath, universitiesRoutePaths } from "@/modules/universities/universitiesRoutePaths";
import {
  useUniversity,
  useUniversityCourses,
  useUniversityMutations,
} from "@/modules/universities/useUniversitiesCatalog";
import {
  fromRequirementDtos,
  type CourseInput,
  type RequirementSet,
  type UniversityInput,
} from "@/modules/universities/universitiesCatalogService";
import {
  getEligibilityChipSx,
  sectionCardHeaderSx,
  sectionCardSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import { FeedbackState } from "@/shared/components/FeedbackState";
import { getApiErrorMessage, isConflictError } from "@/shared/services/http/errorMessage";
import { Snackbar, Alert } from "@mui/material";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import type { Course, EligibilityStatus } from "@/modules/universities/universities.types";
import { dataTableSx } from "@/shared/ui/tableStyles";

function getEligibilityBadge(status: EligibilityStatus, warning?: string) {
  const label =
    status === "eligible" ? "Eligible" : status === "partial" ? warning ?? "Review" : "Not eligible";

  return <Chip label={label} size="small" sx={getEligibilityChipSx(status)} />;
}

export function UniversityDetailsPage() {
  const { universityId } = useParams<{ universityId: string }>();
  const navigate = useNavigate();
  const { data: university, isLoading: universityLoading } = useUniversity(universityId);
  const { data: courses = [], isLoading: coursesLoading } = useUniversityCourses(universityId);
  // Courses can be added one at a time here, as a follow-up to a bulk import that
  // brought in the university without its courses. Same permission the import uses.
  const {
    deleteCourseMutation,
    saveCourseMutation,
    saveUniversityDefaultsMutation,
    saveUniversityMutation,
  } = useUniversityMutations();
  const { hasPermissions } = useAuth();
  const canAddCourse = hasPermissions([PERMISSIONS.UNIVERSITIES_MANAGE]);
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [coursePendingDelete, setCoursePendingDelete] = useState<Course | null>(null);
  const [universityDrawerOpen, setUniversityDrawerOpen] = useState(false);
  const [defaultsDialogOpen, setDefaultsDialogOpen] = useState(false);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" } | null>(
    null,
  );

  // course_id === null marks a university-level default rather than a course's own row.
  // Memoised because CourseFormDrawer keys its "reset the form" effect on this object: a
  // fresh one each render wiped whatever was being typed on the next re-render.
  const universityDefaults = useMemo(
    () =>
      fromRequirementDtos(
        (university?.requirementDtos ?? []).filter((requirement) => !requirement.courseId),
      ),
    [university?.requirementDtos],
  );

  const handleSaveDefaults = async (set: RequirementSet, applyToCourseIds: string[]) => {
    if (!universityId) {
      return;
    }
    const result = await saveUniversityDefaultsMutation.mutateAsync({
      universityId,
      set,
      applyToCourseIds,
      // Every stored row for this university, so the save can update matches in place
      // rather than adding a second copy.
      existing: university?.requirementDtos ?? [],
    });
    setSnack(
      result.failed > 0
        ? { message: `${result.failed} requirement(s) could not be saved.`, severity: "error" }
        : {
            message: `Requirements saved — ${result.created} added, ${result.updated} updated`,
            severity: "success",
          },
    );
  };

  const handleSaveUniversity = async (input: UniversityInput) => {
    try {
      await saveUniversityMutation.mutateAsync({ ...input, id: universityId });
      setUniversityDrawerOpen(false);
      setSnack({ message: "University updated", severity: "success" });
    } catch (error) {
      setSnack({
        message: getApiErrorMessage(error, "Failed to update university"),
        severity: "error",
      });
    }
  };

  const handleDeleteCourse = async (purge: boolean) => {
    if (!coursePendingDelete) {
      return;
    }
    try {
      await deleteCourseMutation.mutateAsync({ courseId: coursePendingDelete.id, purge });
      setSnack({
        message: purge ? "Course deleted" : "Course archived",
        severity: "success",
      });
      setCoursePendingDelete(null);
    } catch (error) {
      // A purge is refused with 409 while a student still has the course shortlisted —
      // say so rather than showing a bare failure.
      setSnack({
        message:
          purge && isConflictError(error)
            ? "This course is linked to a student and cannot be deleted permanently. Archive it instead."
            : getApiErrorMessage(error, "Failed to remove course"),
        severity: "error",
      });
    }
  };

  const handleSaveCourse = async (input: CourseInput) => {
    if (!universityId) {
      return;
    }
    try {
      await saveCourseMutation.mutateAsync({ ...input, universityId });
      setCourseDrawerOpen(false);
      setSnack({
        message: editingCourse ? "Course updated" : "Course added",
        severity: "success",
      });
      setEditingCourse(null);
    } catch (error) {
      // saveCourse throws with a specific message when the course saved but its English
      // test requirements did not — surface that rather than a blanket failure.
      setSnack({
        message: error instanceof Error ? error.message : "Failed to save course",
        severity: "error",
      });
    }
  };

  if (universityLoading || coursesLoading) {
    return <LoadingScreen />;
  }

  if (!university) {
    return (
      <FeedbackState
        description="The university you are looking for does not exist in the course database."
        eyebrow="Courses"
        title="University not found"
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={[
        universitiesPagePaperSx,
        { height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` } },
      ]}
    >
      <DetailPageHeader
        actions={
          <Stack direction="row" spacing={1}>
            {canAddCourse ? (
              <Button
                size="small"
                startIcon={<EditRounded />}
                sx={{ textTransform: "none" }}
                variant="outlined"
                onClick={() => setUniversityDrawerOpen(true)}
              >
                Edit university
              </Button>
            ) : null}
            <Button
              size="small"
              sx={{ textTransform: "none" }}
              variant="contained"
              onClick={() => navigate(universitiesRoutePaths.search)}
            >
              View Courses ({courses.length})
            </Button>
          </Stack>
        }
        breadcrumb={{ universityId: university.id, universityName: university.name }}
      />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <UniversityHero courseCount={courses.length} university={university} />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
            p: { xs: 2, md: 2.75 },
          }}
        >
          <Stack spacing={1.75}>
            <SectionCard title="About">
              <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.65 }}>
                {university.about}
              </Typography>
            </SectionCard>

            <SectionCard title="General Entry Requirements">
              {university.generalRequirements.map((requirement) => (
                <RequirementRow
                  key={requirement.id}
                  detail={requirement.detail}
                  label={requirement.label}
                  status={requirement.status}
                  statusNote={requirement.studentNote}
                />
              ))}
            </SectionCard>

            <Card sx={sectionCardSx}>
              <CardContent sx={{ p: 0 }}>
                <Stack
                  direction="row"
                  sx={[
                    sectionCardHeaderSx,
                    { alignItems: "center", justifyContent: "space-between" },
                  ]}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    Courses at {university.shortName} ({courses.length})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {canAddCourse ? (
                      <Button
                        size="small"
                        startIcon={<ChecklistRounded />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                        onClick={() => setDefaultsDialogOpen(true)}
                      >
                        Default requirements
                      </Button>
                    ) : null}
                    {canAddCourse ? (
                      <Button
                        size="small"
                        startIcon={<AddRounded />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                        onClick={() => {
                          setEditingCourse(null);
                          setCourseDrawerOpen(true);
                        }}
                      >
                        Add course
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      sx={{ textTransform: "none" }}
                      onClick={() => navigate(universitiesRoutePaths.search)}
                    >
                      View all
                    </Button>
                  </Stack>
                </Stack>
                <TableContainer>
                  <Table sx={dataTableSx}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fbfe" }}>
                        {[
                          "Course",
                          "Intake",
                          "Duration",
                          "Tuition",
                          "IELTS",
                          "Eligible?",
                          ...(canAddCourse ? ["Actions"] : []),
                        ].map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              color: "text.secondary",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow
                          key={course.id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => navigate(courseDetailsPath(university.id, course.id))}
                        >
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{course.name}</TableCell>
                          <TableCell>
                            <Chip label={course.intakes[0]} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{course.duration}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatTuitionLakhs(course.tuitionLakhs)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{course.ieltsMin}</TableCell>
                          <TableCell>
                            {getEligibilityBadge(course.eligibilityStatus, course.eligibilityWarning)}
                          </TableCell>
                          {canAddCourse ? (
                            <TableCell
                              sx={{ whiteSpace: "nowrap" }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Edit course">
                                  <IconButton
                                    aria-label={`Edit ${course.name}`}
                                    size="small"
                                    onClick={() => {
                                      setEditingCourse(course);
                                      setCourseDrawerOpen(true);
                                    }}
                                  >
                                    <EditRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove course">
                                  <IconButton
                                    aria-label={`Remove ${course.name}`}
                                    color="error"
                                    size="small"
                                    onClick={() => setCoursePendingDelete(course)}
                                  >
                                    <DeleteOutlineRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={1.75}>
            <SectionCard title="Our Track Record">
              <InfoRow label="Students enrolled" value={`${university.trackRecord.studentsEnrolled} (all time)`} />
              <InfoRow
                highlight
                label="Visas approved"
                value={`${university.trackRecord.visasApproved} / ${university.trackRecord.studentsEnrolled}`}
              />
              <InfoRow
                highlight
                label="Visa success rate"
                value={`${university.trackRecord.visaSuccessRate}%`}
              />
              <InfoRow label="Avg application time" value={`${university.trackRecord.avgApplicationDays} days`} />
              <InfoRow label="Avg commission" value={university.trackRecord.avgCommission} />
            </SectionCard>

            <SectionCard title="Useful Links">
              <Stack spacing={1}>
                {university.links.length === 0 ? (
                  <Typography color="text.disabled" sx={{ fontSize: 13 }}>
                    No website on record for this university.
                  </Typography>
                ) : null}
                {university.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    sx={{ color: "secondary.main", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Internal Notes">
              {university.internalNotes ? (
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}
                >
                  {university.internalNotes}
                </Typography>
              ) : (
                <Stack alignItems="flex-start" spacing={1}>
                  <Typography color="text.disabled" sx={{ fontSize: 13 }}>
                    No internal notes yet. Only your team can see these.
                  </Typography>
                  {canAddCourse ? (
                    <Button
                      size="small"
                      startIcon={<EditRounded />}
                      sx={{ textTransform: "none" }}
                      onClick={() => setUniversityDrawerOpen(true)}
                    >
                      Add notes
                    </Button>
                  ) : null}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Box>
      </Box>

      {canAddCourse && universityId ? (
        <>
          <CourseFormDrawer
            course={editingCourse}
            open={courseDrawerOpen}
            universityDefaults={universityDefaults}
            universityId={universityId}
            onClose={() => {
              setCourseDrawerOpen(false);
              setEditingCourse(null);
            }}
            onSave={handleSaveCourse}
          />
          <CatalogDeleteDialog
            entity="course"
            name={coursePendingDelete?.name ?? null}
            submitting={deleteCourseMutation.isPending}
            onClose={() => setCoursePendingDelete(null)}
            onConfirm={handleDeleteCourse}
          />
          <UniversityFormDrawer
            open={universityDrawerOpen}
            university={university}
            onClose={() => setUniversityDrawerOpen(false)}
            onSave={handleSaveUniversity}
          />
          <UniversityDefaultsDialog
            existingCourseIds={courses.map((course) => course.id)}
            initial={universityDefaults}
            open={defaultsDialogOpen}
            onClose={() => setDefaultsDialogOpen(false)}
            onSave={handleSaveDefaults}
          />
        </>
      ) : null}

      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={3000}
        open={Boolean(snack)}
        onClose={() => setSnack(null)}
      >
        <Alert severity={snack?.severity ?? "success"} variant="filled">
          {snack?.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={sectionCardSx}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={sectionCardHeaderSx}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2.25 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        justifyContent: "space-between",
        py: 1,
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: highlight ? "secondary.main" : "text.primary",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
