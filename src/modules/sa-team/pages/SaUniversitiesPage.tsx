import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { CourseFormDrawer } from "@/modules/sa-team/components/CourseFormDrawer";
import { UniversityFormDrawer } from "@/modules/sa-team/components/UniversityFormDrawer";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import {
  universitiesCatalogQueryKey,
  universitiesCatalogService,
  type CourseInput,
  type UniversityInput,
} from "@/modules/universities/universitiesCatalogService";
import { useUniversitiesCatalog } from "@/modules/universities/useUniversitiesCatalog";
import type { Course, University } from "@/modules/universities/universities.types";

const SA_TEAL = "#0d7a7a";

export function SaUniversitiesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useUniversitiesCatalog();
  const canManage = saAuthService.hasPermission(SA_PERMISSIONS.UNIVERSITIES_MANAGE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const courseCountByUniversity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const course of data?.courses ?? []) {
      counts[course.universityId] = (counts[course.universityId] ?? 0) + 1;
    }
    return counts;
  }, [data?.courses]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: universitiesCatalogQueryKey });
  };

  const handleSaveUniversity = (input: UniversityInput) => {
    universitiesCatalogService.saveUniversity(input);
    invalidate();
    setDrawerOpen(false);
    setEditingUniversity(null);
    setSnack(input.id ? "University updated" : "University added");
  };

  const handleDeleteUniversity = (university: University) => {
    if (!window.confirm(`Delete ${university.name} and all of its courses?`)) {
      return;
    }

    universitiesCatalogService.deleteUniversity(university.id);
    invalidate();
    setSnack("University deleted");
  };

  const handleResetCatalog = () => {
    if (!window.confirm("Reset the catalog to the default seed data?")) {
      return;
    }

    universitiesCatalogService.resetToSeed();
    invalidate();
    setSnack("Catalog reset to seed data");
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Universities & Courses</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            Manage the global university and course catalog used by tenant counsellors.
          </Typography>
        </Box>
        {canManage ? (
          <Stack direction="row" spacing={1}>
            <Button color="inherit" startIcon={<RestartAltRounded />} onClick={handleResetCatalog}>
              Reset seed
            </Button>
            <Button
              startIcon={<AddRounded />}
              sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6666" } }}
              variant="contained"
              onClick={() => {
                setEditingUniversity(null);
                setDrawerOpen(true);
              }}
            >
              Add university
            </Button>
          </Stack>
        ) : null}
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            {["University", "Country", "City", "QS Rank", "Courses", "Actions"].map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.universities ?? []).map((university) => (
            <TableRow key={university.id} hover>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography fontWeight={700}>{university.name}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {university.shortName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                {university.flag} {university.country}
              </TableCell>
              <TableCell>{university.city}</TableCell>
              <TableCell>{university.qsRank ? `#${university.qsRank}` : "—"}</TableCell>
              <TableCell>
                <Chip label={`${courseCountByUniversity[university.id] ?? 0} courses`} size="small" />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button component={RouterLink} size="small" to={`/sa/universities/${university.id}`}>
                    Manage
                  </Button>
                  {canManage ? (
                    <>
                      <Button
                        size="small"
                        startIcon={<EditRounded />}
                        onClick={() => {
                          setEditingUniversity(university);
                          setDrawerOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineRounded />}
                        onClick={() => handleDeleteUniversity(university)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isLoading ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Loading catalog...
        </Typography>
      ) : null}

      {!isLoading && (data?.universities.length ?? 0) === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No universities in the catalog yet. Add one to get started.
        </Alert>
      ) : null}

      <UniversityFormDrawer
        open={drawerOpen}
        university={editingUniversity}
        onClose={() => {
          setDrawerOpen(false);
          setEditingUniversity(null);
        }}
        onSave={handleSaveUniversity}
      />

      <Snackbar
        autoHideDuration={3000}
        message={snack}
        open={Boolean(snack)}
        onClose={() => setSnack(null)}
      />
    </Box>
  );
}

export function SaUniversityDetailPage({
  universityId,
}: {
  universityId: string;
}) {
  const queryClient = useQueryClient();
  const { data } = useUniversitiesCatalog();
  const canManage = saAuthService.hasPermission(SA_PERMISSIONS.UNIVERSITIES_MANAGE);
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const university = data?.universities.find((entry) => entry.id === universityId);
  const courses = data?.courses.filter((course) => course.universityId === universityId) ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: universitiesCatalogQueryKey });
  };

  const handleSaveCourse = (input: CourseInput) => {
    universitiesCatalogService.saveCourse({ ...input, universityId });
    invalidate();
    setCourseDrawerOpen(false);
    setEditingCourse(null);
    setSnack(input.id ? "Course updated" : "Course added");
  };

  const handleDeleteCourse = (course: Course) => {
    if (!window.confirm(`Delete ${course.name}?`)) {
      return;
    }

    universitiesCatalogService.deleteCourse(course.id);
    invalidate();
    setSnack("Course deleted");
  };

  if (!university) {
    return <Alert severity="warning">University not found.</Alert>;
  }

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Button component={RouterLink} size="small" sx={{ alignSelf: "flex-start" }} to="/sa/universities">
          ← Back to universities
        </Button>
        <Typography variant="h5">{university.name}</Typography>
        <Typography color="text.secondary" variant="body2">
          {university.flag} {university.city}, {university.country} · {university.website}
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, mb: 2 }}>
        <Typography sx={{ flex: 1 }} variant="h6">
          Courses ({courses.length})
        </Typography>
        {canManage ? (
          <Button
            startIcon={<AddRounded />}
            sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6666" } }}
            variant="contained"
            onClick={() => {
              setEditingCourse(null);
              setCourseDrawerOpen(true);
            }}
          >
            Add course
          </Button>
        ) : null}
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            {["Course", "Level", "Intake", "Tuition", "IELTS", "Deadline", "Actions"].map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{course.name}</TableCell>
              <TableCell>{course.levelLabel}</TableCell>
              <TableCell>{course.intakes.join(", ") || "—"}</TableCell>
              <TableCell>₹{course.tuitionLakhs.toFixed(1)}L</TableCell>
              <TableCell>{course.ieltsLabel}</TableCell>
              <TableCell>{course.deadline}</TableCell>
              <TableCell>
                {canManage ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<EditRounded />}
                      onClick={() => {
                        setEditingCourse(course);
                        setCourseDrawerOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      size="small"
                      startIcon={<DeleteOutlineRounded />}
                      onClick={() => handleDeleteCourse(course)}
                    >
                      Delete
                    </Button>
                  </Stack>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {courses.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No courses for this university yet.
        </Alert>
      ) : null}

      <CourseFormDrawer
        course={editingCourse}
        open={courseDrawerOpen}
        universityId={universityId}
        onClose={() => {
          setCourseDrawerOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
      />

      <Snackbar
        autoHideDuration={3000}
        message={snack}
        open={Boolean(snack)}
        onClose={() => setSnack(null)}
      />
    </Box>
  );
}
