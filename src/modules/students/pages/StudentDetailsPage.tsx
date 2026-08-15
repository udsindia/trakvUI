import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { studentsApi, type BackendLanguageTest } from "@/modules/students/studentsApi";
import { studentRoutePaths } from "@/modules/students/studentRoutePaths";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

function text(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** A label/value pair; the grid wraps so this works on narrow screens too. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 160 }}>
      <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5 }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.25}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }} variant="subtitle2">
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

function LanguageTestRow({ test }: { test: BackendLanguageTest }) {
  const bands = [
    test.bandListening !== undefined ? `L ${test.bandListening}` : null,
    test.bandReading !== undefined ? `R ${test.bandReading}` : null,
    test.bandWriting !== undefined ? `W ${test.bandWriting}` : null,
    test.bandSpeaking !== undefined ? `S ${test.bandSpeaking}` : null,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "9px",
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
          {text(test.testType)}
        </Typography>
        {test.primary ? <Chip color="primary" label="Primary" size="small" /> : null}
      </Stack>
      <Field label="Overall" value={text(test.overallScore)} />
      <Field label="Bands" value={bands.length ? bands.join(" · ") : "—"} />
      <Field label="Test date" value={formatDate(test.testDate)} />
      <Field label="Expires" value={formatDate(test.expiryDate)} />
    </Box>
  );
}

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermissions } = useAuth();
  const canManage = hasPermissions([PERMISSIONS.STUDENTS_MANAGE]);

  const {
    data: student,
    isLoading,
    isError,
  } = useQuery({
    enabled: Boolean(id),
    queryKey: ["student", id],
    queryFn: () => studentsApi.getStudent(id as string),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !student) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography color="error">Student not found.</Typography>
      </Box>
    );
  }

  const fullName = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || "Student";
  const tests = student.languageTests ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<ArrowBackRounded sx={{ fontSize: 18 }} />}
                variant="outlined"
                sx={{ borderRadius: "9px", textTransform: "none" }}
                onClick={() => navigate(studentRoutePaths.root)}
              >
                Back to Students
              </Button>
              {canManage ? (
                <Button
                  startIcon={<EditOutlined sx={{ fontSize: 18 }} />}
                  variant="contained"
                  sx={{ borderRadius: "9px", textTransform: "none" }}
                  onClick={() => navigate(studentRoutePaths.edit(student.id))}
                >
                  Edit
                </Button>
              ) : null}
            </Stack>
          }
          subtitle={student.email ?? ""}
          title={fullName}
        />
      </Box>

      <Stack spacing={2.5} sx={{ bgcolor: "#fcfdff", flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
        <Section title="CONTACT">
          <Field label="Email" value={text(student.email)} />
          <Field label="Phone" value={text(student.phone)} />
          <Field label="Date of birth" value={formatDate(student.dateOfBirth)} />
          <Field label="Nationality" value={text(student.nationality)} />
        </Section>

        <Divider />

        <Section title="PASSPORT">
          <Field label="Issuing country" value={text(student.passportIssueCountry)} />
          <Field label="Expiry" value={formatDate(student.passportExpiryDate)} />
        </Section>

        <Divider />

        <Section title="ACADEMICS">
          <Field label="Highest degree" value={text(student.highestDegree)} />
          <Field label="Institution" value={text(student.institutionName)} />
          <Field label="Field of study" value={text(student.fieldOfStudy)} />
          <Field label="Graduation year" value={text(student.graduationYear)} />
          <Field
            label="Academic score"
            value={
              student.academicScore === undefined
                ? "—"
                : `${student.academicScore}${student.scoreType ? ` ${student.scoreType}` : ""}`
            }
          />
          <Field
            label="Work experience"
            value={
              student.workExperienceMonths === undefined
                ? "—"
                : `${student.workExperienceMonths} months`
            }
          />
        </Section>

        <Divider />

        <Stack spacing={1.25}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }} variant="subtitle2">
            LANGUAGE TESTS
          </Typography>
          {tests.length === 0 ? (
            <Typography color="text.disabled" sx={{ fontSize: 12.5 }} variant="body2">
              No language tests recorded.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {tests.map((test) => (
                <LanguageTestRow key={test.id} test={test} />
              ))}
            </Stack>
          )}
        </Stack>

        <Divider />

        <Section title="RECORD">
          <Field label="Enrolled" value={formatDate(student.enrolledAt)} />
          <Field label="Created" value={formatDate(student.createdAt)} />
          <Field label="Last updated" value={formatDate(student.updatedAt)} />
        </Section>
      </Stack>
    </Paper>
  );
}
