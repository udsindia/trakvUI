import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
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
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { CourseFormDrawer } from "@/modules/universities/components/CourseFormDrawer";
import { UniversityFormDrawer } from "@/modules/sa-team/components/UniversityFormDrawer";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import {
  type CourseInput,
  type UniversityInput,
} from "@/modules/universities/universitiesCatalogService";
import {
  useUniversitiesCatalog,
  useUniversity,
  useUniversityCourses,
  useUniversityMutations,
} from "@/modules/universities/useUniversitiesCatalog";
import type { Course, University } from "@/modules/universities/universities.types";
import { dataTableSx } from "@/shared/ui/tableStyles";

const SA_TEAL = "#0d7a7a";

export function SaUniversitiesPage() {
  const { data, isLoading, isError } = useUniversitiesCatalog();
  const { saveUniversityMutation } = useUniversityMutations();
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

  const handleSaveUniversity = async (input: UniversityInput) => {
    try {
      await saveUniversityMutation.mutateAsync(input);
      setDrawerOpen(false);
      setEditingUniversity(null);
      setSnack(input.id ? "University updated" : "University added");
    } catch {
      setSnack("Failed to save university");
    }
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
        ) : null}
      </Stack>

      <Table sx={dataTableSx}>
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

      {isError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load universities. Check your connection and try again.
        </Alert>
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
  const { data: university, isLoading: universityLoading } = useUniversity(universityId);
  const { data: courses = [], isLoading: coursesLoading } = useUniversityCourses(universityId);
  const { saveCourseMutation } = useUniversityMutations();
  const canManage = saAuthService.hasPermission(SA_PERMISSIONS.UNIVERSITIES_MANAGE);
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const handleSaveCourse = async (input: CourseInput) => {
    try {
      await saveCourseMutation.mutateAsync({ ...input, universityId });
      setCourseDrawerOpen(false);
      setEditingCourse(null);
      setSnack("Course added");
    } catch {
      setSnack("Failed to save course");
    }
  };

  if (universityLoading || coursesLoading) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        Loading university...
      </Typography>
    );
  }

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

      <Table sx={dataTableSx}>
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
                —
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
