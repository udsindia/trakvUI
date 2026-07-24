import SchoolRounded from "@mui/icons-material/SchoolRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { CourseSearchResult } from "@/modules/universities/universities.types";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { getEligibilityChipSx, tagChipSx } from "@/modules/universities/universitiesStyles";

type EligibilityBarProps = {
  label?: string;
  percent: number;
};

export function EligibilityBar({ label = "Eligibility match", percent }: EligibilityBarProps) {
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
        <Typography color="text.secondary" sx={{ fontSize: 11 }}>
          {label}
        </Typography>
        <Typography color="secondary.main" sx={{ fontSize: 11, fontWeight: 700 }}>
          {percent}%
        </Typography>
      </Stack>
      <LinearProgress
        sx={{
          bgcolor: "#e1edf1",
          borderRadius: "12px",
          height: 6,
          "& .MuiLinearProgress-bar": {
            bgcolor: "secondary.main",
            borderRadius: "12px",
          },
        }}
        value={percent}
        variant="determinate"
      />
    </Box>
  );
}

type CourseSearchCardProps = {
  result: CourseSearchResult;
  studentName?: string;
  onViewCourse: () => void;
  onViewUniversity?: () => void;
  onAddToShortlist: () => void;
  isShortlisted: boolean;
};

export function CourseSearchCard({
  result,
  studentName,
  onViewCourse,
  onViewUniversity,
  onAddToShortlist,
  isShortlisted,
}: CourseSearchCardProps) {
  const showEligibility = Boolean(studentName);
  const isNotEligible = showEligibility && result.eligibilityStatus === "not-eligible";

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#edf2f7",
        borderLeft:
          showEligibility && result.eligibilityStatus === "partial" ? "3px solid" : undefined,
        borderLeftColor: "secondary.main",
        borderRadius: "10px",
        cursor: "pointer",
        opacity: isNotEligible ? 0.75 : 1,
        p: 2,
        transition: "box-shadow .2s",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(17, 51, 63, 0.08)",
        },
      }}
      onClick={onViewCourse}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <Avatar
            sx={{
              bgcolor: (theme) => `${theme.palette.secondary.main}14`,
              color: "secondary.main",
              height: 40,
              width: 40,
            }}
            variant="rounded"
          >
            <SchoolRounded fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
              {result.name}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: 12,
                mt: 0.25,
                ...(onViewUniversity
                  ? { "&:hover": { color: "secondary.main", textDecoration: "underline" } }
                  : {}),
              }}
              onClick={(event) => {
                event.stopPropagation();
                onViewUniversity?.();
              }}
            >
              {result.university.name} · {result.university.flag} {result.university.city},{" "}
              {result.university.country}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ flexShrink: 0, textAlign: "right" }}>
          <Typography
            sx={{
              color: result.tuitionLakhs >= 30 ? "primary.main" : "secondary.main",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {formatTuitionLakhs(result.tuitionLakhs)}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
            per year
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.25 }}>
        {result.university.qsRank ? (
          <Chip label={`QS #${result.university.qsRank}`} size="small" sx={tagChipSx} />
        ) : null}
        {showEligibility ? (
          <Chip
            label={
              result.eligibilityStatus === "not-eligible"
                ? "Not eligible"
                : result.eligibilityStatus === "partial"
                  ? "Eligible with notes"
                  : "Eligible"
            }
            size="small"
            sx={getEligibilityChipSx(result.eligibilityStatus)}
          />
        ) : null}
        {result.intakes.map((intake) => (
          <Chip key={intake} label={intake} size="small" sx={tagChipSx} />
        ))}
        <Chip label={result.duration} size="small" sx={tagChipSx} />
        <Chip label={result.ieltsLabel} size="small" sx={tagChipSx} />
        {showEligibility && result.eligibilityWarning ? (
          <Chip
            label={result.eligibilityWarning}
            size="small"
            sx={getEligibilityChipSx("partial")}
          />
        ) : null}
      </Stack>

      {isNotEligible && result.eligibilityHint ? (
        <Alert severity="warning" sx={{ fontSize: 12, mb: 1, py: 0.25 }}>
          {result.eligibilityHint}
        </Alert>
      ) : null}

      {showEligibility && !isNotEligible && result.eligibilityPercent !== undefined ? (
        <EligibilityBar
          label={`Eligibility match for ${studentName!.split(" ")[0]}`}
          percent={result.eligibilityPercent}
        />
      ) : null}

      {showEligibility && !isNotEligible && result.eligibilityPercent === 100 ? (
        <Chip
          color="success"
          label="All requirements fully met"
          size="small"
          sx={{ fontSize: 10, fontWeight: 600, mt: 1.25 }}
          variant="outlined"
        />
      ) : null}

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", mt: 1.5 }}
        onClick={(event) => event.stopPropagation()}
      >
        {result.alreadyShortlisted || result.pendingApplications ? (
          <Typography color="text.secondary" sx={{ fontSize: 12 }}>
            {result.alreadyShortlisted ? `Already shortlisted for ${studentName ?? "student"}` : ""}
            {result.pendingApplications ? ` · ${result.pendingApplications} applications pending` : ""}
          </Typography>
        ) : (
          <Box />
        )}
        <Stack direction="row" spacing={1}>
          <Button size="small" sx={{ textTransform: "none" }} variant="outlined" onClick={onViewCourse}>
            View Course
          </Button>
          <Button
            size="small"
            sx={{ textTransform: "none" }}
            variant={isShortlisted ? "outlined" : "contained"}
            onClick={onAddToShortlist}
          >
            {isShortlisted ? "Shortlisted" : "Add to Shortlist"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
