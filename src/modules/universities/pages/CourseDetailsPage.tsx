import SchoolRounded from "@mui/icons-material/SchoolRounded";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { DetailPageHeader } from "@/modules/universities/components/UniversitiesBreadcrumb";
import { EligibilityBar } from "@/modules/universities/components/CourseSearchCard";
import { RequirementRow } from "@/modules/universities/components/RequirementRow";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { MOCK_STUDENT } from "@/modules/universities/universitiesMockData";
import { universityDetailsPath } from "@/modules/universities/universitiesRoutePaths";
import { useUniversitiesCatalog } from "@/modules/universities/useUniversitiesCatalog";
import {
  getEligibilityChipSx,
  sectionCardHeaderSx,
  sectionCardSx,
  tagChipSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import { FeedbackState } from "@/shared/components/FeedbackState";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

export function CourseDetailsPage() {
  const { universityId, courseId } = useParams<{ universityId: string; courseId: string }>();
  const navigate = useNavigate();
  const { data: catalog, isLoading } = useUniversitiesCatalog();

  const university = catalog?.universities.find((entry) => entry.id === universityId);
  const course = catalog?.courses.find((entry) => entry.id === courseId);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!university || !course || course.universityId !== university.id) {
    return (
      <FeedbackState
        description="The course you are looking for does not exist in the course database."
        eyebrow="Courses"
        title="Course not found"
      />
    );
  }

  const eligibilityLabel =
    course.eligibilityStatus === "eligible"
      ? "Eligible"
      : course.eligibilityStatus === "partial"
        ? "Partial match"
        : "Not eligible";

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
          <>
            <Button size="small" sx={{ textTransform: "none" }} variant="outlined">
              Share with Student
            </Button>
            <Button size="small" sx={{ textTransform: "none" }} variant="contained">
              Add to Shortlist
            </Button>
          </>
        }
        breadcrumb={{
          universityId: university.id,
          universityName: university.shortName,
          courseName: course.name,
        }}
      />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, md: 2.75 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
          }}
        >
          <Stack spacing={1.75}>
            <Card sx={sectionCardSx}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: (theme) => `${theme.palette.secondary.main}14`,
                      color: "secondary.main",
                      height: 52,
                      width: 52,
                    }}
                    variant="rounded"
                  >
                    <SchoolRounded />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                      {course.name}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 13, mt: 0.5, cursor: "pointer", "&:hover": { color: "secondary.main" } }}
                      onClick={() => navigate(universityDetailsPath(university.id))}
                    >
                      {university.name} · {university.flag} {university.city}, {university.country}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                  {university.qsRank ? (
                    <Chip label={`QS #${university.qsRank}`} size="small" sx={tagChipSx} />
                  ) : null}
                  <Chip label={course.levelLabel} size="small" sx={tagChipSx} />
                  <Chip label={`Full-time · ${course.duration}`} size="small" sx={tagChipSx} />
                  <Chip label={course.intakes.join(" · ")} size="small" sx={tagChipSx} />
                  {course.eligibilityWarning ? (
                    <Chip
                      label={course.eligibilityWarning}
                      size="small"
                      sx={getEligibilityChipSx("partial")}
                    />
                  ) : null}
                </Stack>

                <Grid container spacing={1.25}>
                  <Grid size={{ xs: 4 }}>
                    <StatTile
                      highlight
                      label="Annual Tuition"
                      value={formatTuitionLakhs(course.tuitionLakhs)}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <StatTile label="App Fee" value={course.applicationFee} />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <StatTile accent label="Deadline" value={course.deadline} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {course.requirements.length > 0 ? (
              <Card
                sx={[
                  sectionCardSx,
                  { borderLeft: "3px solid", borderLeftColor: "warning.main" },
                ]}
              >
                <CardContent sx={{ p: 0 }}>
                  <Stack
                    direction="row"
                    sx={[
                      sectionCardHeaderSx,
                      { alignItems: "center", justifyContent: "space-between" },
                    ]}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      Eligibility Check — {MOCK_STUDENT.name}
                    </Typography>
                    <Chip
                      label={eligibilityLabel}
                      size="small"
                      sx={getEligibilityChipSx(course.eligibilityStatus)}
                    />
                  </Stack>
                  <Box sx={{ px: 2.25, py: 0.5 }}>
                    {course.requirements.map((requirement) => (
                      <RequirementRow
                        key={requirement.id}
                        detail={requirement.detail}
                        label={requirement.label}
                        status={requirement.status}
                        statusNote={requirement.statusLabel}
                      />
                    ))}
                  </Box>
                  {course.eligibilityPercent !== undefined ? (
                    <Box sx={{ px: 2.25, pb: 2 }}>
                      <EligibilityBar percent={course.eligibilityPercent} />
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card sx={sectionCardSx}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={sectionCardHeaderSx}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Curriculum Overview</Typography>
                </Box>
                <Grid container spacing={1.25} sx={{ p: 2.25 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionTitle>Semester 1</SectionTitle>
                    <Stack spacing={0.75}>
                      {course.curriculum.semester1.map((item) => (
                        <Typography key={item} color="text.secondary" sx={{ fontSize: 13 }}>
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionTitle>Semester 2 + Project</SectionTitle>
                    <Stack spacing={0.75}>
                      {course.curriculum.semester2.map((item) => (
                        <Typography key={item} color="text.secondary" sx={{ fontSize: 13 }}>
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={1.75}>
            <SidebarCard title="Key Dates">
              <SidebarRow accent label="Application deadline" value={course.keyDates.applicationDeadline} />
              <SidebarRow label="Rolling admissions" value={course.keyDates.rollingAdmissions ? "Yes" : "No"} />
              <SidebarRow label="Course start" value={course.keyDates.courseStart} />
              <SidebarRow label="Course end" value={course.keyDates.courseEnd} />
              <SidebarRow label="PGWP eligible?" value={course.keyDates.pgwpEligible} />
            </SidebarCard>

            <SidebarCard title="Fees & Scholarships">
              <SidebarRow label="Tuition" value={course.fees.tuitionPerYear} />
              <SidebarRow label="App fee" value={course.fees.applicationFee} />
              <SidebarRow label="Living costs" value={course.fees.livingCosts} />
              {course.fees.scholarship ? (
                <Chip
                  label={course.fees.scholarship}
                  size="small"
                  sx={[tagChipSx, { mt: 0.5 }]}
                />
              ) : null}
              {course.fees.scholarshipNote ? (
                <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.75 }}>
                  {course.fees.scholarshipNote}
                </Typography>
              ) : null}
            </SidebarCard>

            <SidebarCard title="Our Data">
              <SidebarRow label="Students sent" value={String(course.ourData.studentsSent)} />
              <SidebarRow
                highlight
                label="Accepted"
                value={`${course.ourData.accepted} / ${course.ourData.studentsSent}`}
              />
              <SidebarRow
                highlight
                label="Visa approved"
                value={`${course.ourData.visaApproved} / ${course.ourData.accepted}`}
              />
              <SidebarRow label="Avg commission" value={course.ourData.avgCommission} />
            </SidebarCard>

            <Button fullWidth sx={{ textTransform: "none" }} variant="contained">
              {`Add to ${MOCK_STUDENT.name.split(" ")[0]}'s Shortlist`}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

function StatTile({
  label,
  value,
  highlight = false,
  accent = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: highlight ? (theme) => `${theme.palette.secondary.main}10` : "#f8fbfe",
        border: "1px solid",
        borderColor: "#edf2f7",
        borderRadius: 2,
        p: 1.5,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          color: accent ? "primary.main" : highlight ? "secondary.main" : "text.primary",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 10, letterSpacing: "0.06em", mt: 0.25, textTransform: "uppercase" }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      color="text.secondary"
      sx={{
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        mb: 1,
        pb: 1,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={sectionCardSx}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={sectionCardHeaderSx}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 1.75 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function SidebarRow({
  label,
  value,
  highlight = false,
  accent = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
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
          color: accent ? "primary.main" : highlight ? "secondary.main" : "text.primary",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
