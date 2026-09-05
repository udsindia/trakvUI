import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { countryDisplayName } from "@/modules/universities/universitiesMappers";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { studentsApi } from "@/modules/students/studentsApi";
import { studentsRoutePaths } from "@/modules/students/studentsRoutePaths";
import { usersService } from "@/modules/settings/usersService";
import { joinPhoneNumber } from "@/shared/utils/phone";

/** Outcome → chip colour, matching the applications pages. */
const outcomeColor: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  IN_PROGRESS: "info",
  ACCEPTED: "success",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "error",
  WITHDRAWN: "default",
};

function humanize(value?: string | null) {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

/** A label/value row, borrowed from the university detail layout. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "baseline",
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        gap: 2,
        justifyContent: "space-between",
        py: 1,
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 13, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ border: "1px solid", borderColor: "#e9eff5", borderRadius: "12px" }} elevation={0}>
      <CardContent>
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermissions, tenant } = useAuth();
  const canViewUsers = hasPermissions([PERMISSIONS.USERS_VIEW]);
  const canViewApplications = hasPermissions([PERMISSIONS.APPLICATIONS_VIEW]);

  const {
    data: student,
    isLoading,
    isError,
  } = useQuery({
    enabled: Boolean(id),
    queryKey: ["students", "detail", id],
    queryFn: () => studentsApi.getStudentById(id as string),
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    enabled: Boolean(id) && canViewApplications,
    queryKey: ["applications", "by-student", id],
    queryFn: () => applicationsApi.getApplicationsByStudent(id as string),
  });

  /*
    The summary only names the current stage; the full stage list lives on the detail
    endpoint, and that is what the pipeline below draws. One request per application is
    fine here — a student has a handful, not hundreds.
  */
  const applicationDetails = useQueries({
    queries: applications.map((application) => ({
      queryKey: ["applications", "detail", application.id],
      queryFn: () => applicationsApi.getApplicationById(application.id),
    })),
  });

  const { data: users = [] } = useQuery({
    enabled: Boolean(tenant?.tenantId) && canViewUsers,
    queryKey: ["settings", "users", tenant?.tenantId],
    queryFn: () => usersService.getUsers(tenant?.tenantId ?? ""),
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

  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ").trim();
  const counsellor = users.find((user) => user.id === student.assignedTo)?.name ?? "";
  const fromLead = Boolean(student.leadId);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          subtitle="Students > Details"
          title={fullName || student.email || "Student"}
          actions={
            <Stack direction="row" spacing={1.5}>
              {fromLead ? (
                <Button
                  variant="outlined"
                  onClick={() => navigate(leadRoutePaths.details(student.leadId as string))}
                >
                  View originating lead
                </Button>
              ) : null}
              <Button variant="outlined" onClick={() => navigate(studentsRoutePaths.list)}>
                Back to List
              </Button>
            </Stack>
          }
        />
      </Box>

      <Box
        sx={{
          bgcolor: "#fcfdff",
          flex: 1,
          overflow: "auto",
          px: { xs: 2, md: 3.5 },
          py: { xs: 2.5, md: 3.5 },
        }}
      >
        <Box sx={{ marginInline: "auto", maxWidth: 1000, width: "100%" }}>
          <Stack spacing={3}>
            {/* ── Where this student is in the process ─────────────────────── */}
            <Card
              elevation={0}
              sx={{ border: "1px solid", borderColor: "#e9eff5", borderRadius: "12px" }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
                >
                  <Typography variant="h6">Where they are in the process</Typography>
                  <Chip
                    label={fromLead ? "Enrolled from lead" : "Added directly"}
                    size="small"
                    sx={
                      fromLead
                        ? { backgroundColor: "#E1F5EC", color: "#0B7A57" }
                        : { backgroundColor: "#EEF2F6", color: "#55707C" }
                    }
                  />
                </Stack>

                {!canViewApplications ? (
                  <Typography color="text.secondary" variant="body2">
                    You do not have permission to view this student's applications.
                  </Typography>
                ) : applicationsLoading ? (
                  <Typography color="text.secondary" variant="body2">
                    Loading applications…
                  </Typography>
                ) : applications.length === 0 ? (
                  <Stack alignItems="flex-start" spacing={1.5}>
                    <Typography color="text.secondary" variant="body2">
                      Enrolled on {formatDate(student.enrolledAt)}, with no application yet — the
                      next step is to create one against a university and course.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(applicationsRoutePaths.create)}
                    >
                      Create an application
                    </Button>
                  </Stack>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={3}>
                    {applications.map((application, index) => {
                      const detail = applicationDetails[index]?.data;
                      const stages = [...(detail?.stages ?? [])].sort(
                        (a, b) => a.stageOrder - b.stageOrder,
                      );
                      const currentIndex = stages.findIndex(
                        (stage) => stage.id === detail?.currentStageId,
                      );

                      return (
                        <Box key={application.id}>
                          <Stack
                            direction="row"
                            sx={{
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 1,
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                {application.universityName ?? "University"} —{" "}
                                {application.courseName ?? "Course"}
                              </Typography>
                              <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.25 }}>
                                {[
                                  countryDisplayName(application.destinationCountryCode),
                                  [application.intakeMonth, application.intakeYear]
                                    .filter(Boolean)
                                    .join(" "),
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <Chip
                                color={outcomeColor[application.outcome ?? ""] ?? "default"}
                                label={humanize(application.outcome)}
                                size="small"
                              />
                              <Button
                                size="small"
                                onClick={() => navigate(`/applications/${application.id}`)}
                              >
                                Open
                              </Button>
                            </Stack>
                          </Stack>

                          {stages.length > 0 ? (
                            <Stepper
                              activeStep={currentIndex < 0 ? 0 : currentIndex}
                              alternativeLabel
                              sx={{
                                "& .MuiStepIcon-root.Mui-completed": { color: "secondary.main" },
                                "& .MuiStepIcon-root.Mui-active": { color: "primary.main" },
                                "& .MuiStepConnector-line": { borderColor: "divider" },
                                "& .MuiStepLabel-label": { fontSize: 11, fontWeight: 600 },
                                "& .MuiStepLabel-label.Mui-active": { fontWeight: 700 },
                              }}
                            >
                              {stages.map((stage) => (
                                <Step key={stage.id} completed={Boolean(stage.exitedAt)}>
                                  <StepLabel>{stage.stageName}</StepLabel>
                                </Step>
                              ))}
                            </Stepper>
                          ) : applicationDetails[index]?.isLoading ? (
                            <Typography color="text.secondary" variant="body2">
                              Loading pipeline…
                            </Typography>
                          ) : application.currentStageName ? (
                            <Typography color="text.secondary" variant="body2">
                              Current stage: <strong>{application.currentStageName}</strong>
                            </Typography>
                          ) : (
                            // An application created outside the normal flow can have no stage
                            // rows at all; say so rather than showing an empty pipeline.
                            <Typography color="text.disabled" variant="body2">
                              No stage pipeline recorded for this application.
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* ── Profile ──────────────────────────────────────────────────── */}
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <SectionCard title="Contact">
                <InfoRow label="Email" value={student.email ?? ""} />
                <InfoRow
                  label="Phone"
                  value={joinPhoneNumber(student.phoneCountryCode, student.phone)}
                />
                <InfoRow label="Nationality" value={student.nationality ?? ""} />
                <InfoRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
                <InfoRow label="Counsellor" value={counsellor} />
              </SectionCard>

              <SectionCard title="Academic background">
                <InfoRow label="Highest degree" value={student.highestDegree ?? ""} />
                <InfoRow label="Institution" value={student.institutionName ?? ""} />
                <InfoRow label="Field of study" value={student.fieldOfStudy ?? ""} />
                <InfoRow
                  label="Graduated"
                  value={student.graduationYear ? String(student.graduationYear) : ""}
                />
                <InfoRow
                  label="Score"
                  value={
                    student.academicScore != null
                      ? `${student.academicScore}${student.scoreType ? ` ${student.scoreType}` : ""}`
                      : ""
                  }
                />
                <InfoRow
                  label="Work experience"
                  value={
                    student.workExperienceMonths != null
                      ? `${student.workExperienceMonths} months`
                      : ""
                  }
                />
              </SectionCard>

              <SectionCard title="Passport">
                <InfoRow label="Issuing country" value={student.passportIssueCountry ?? ""} />
                <InfoRow label="Expires" value={formatDate(student.passportExpiryDate)} />
              </SectionCard>

              <SectionCard title="English proficiency">
                {(student.languageTests ?? []).length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No tests recorded.
                  </Typography>
                ) : (
                  (student.languageTests ?? []).map((test) => (
                    <InfoRow
                      key={test.id}
                      label={`${humanize(test.testType)}${test.primary ? " (primary)" : ""}`}
                      value={[
                        test.overallScore != null ? `Overall ${test.overallScore}` : "",
                        test.testDate ? `taken ${formatDate(test.testDate)}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))
                )}
              </SectionCard>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
