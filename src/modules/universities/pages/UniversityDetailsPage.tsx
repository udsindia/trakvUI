import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { DetailPageHeader } from "@/modules/universities/components/UniversitiesBreadcrumb";
import { RequirementRow } from "@/modules/universities/components/RequirementRow";
import { UniversityHero } from "@/modules/universities/components/UniversityHero";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { courseDetailsPath, universitiesRoutePaths } from "@/modules/universities/universitiesRoutePaths";
import { useUniversity, useUniversityCourses } from "@/modules/universities/useUniversitiesCatalog";
import {
  getEligibilityChipSx,
  sectionCardHeaderSx,
  sectionCardSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import { FeedbackState } from "@/shared/components/FeedbackState";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import type { EligibilityStatus } from "@/modules/universities/universities.types";

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
          <Button
            size="small"
            sx={{ textTransform: "none" }}
            variant="contained"
            onClick={() => navigate(universitiesRoutePaths.search)}
          >
            View Courses ({courses.length})
          </Button>
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
                  <Button
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => navigate(universitiesRoutePaths.search)}
                  >
                    View all
                  </Button>
                </Stack>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fbfe" }}>
                        {["Course", "Intake", "Duration", "Tuition", "IELTS", "Eligible?"].map((header) => (
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
                {university.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.url}
                    sx={{ color: "secondary.main", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Internal Notes">
              <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.55 }}>
                {university.internalNotes}
              </Typography>
            </SectionCard>
          </Stack>
        </Box>
      </Box>
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
