import {
  Box,
  Button,
  Divider,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import type { Course, CourseLevel } from "@/modules/universities/universities.types";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { RequirementsEditor } from "@/modules/universities/components/RequirementsEditor";
import {
  emptyRequirementSet,
  requirementSetIsEmpty,
  type CourseInput,
  type RequirementSet,
} from "@/modules/universities/universitiesCatalogService";

const levelLabels: Record<CourseLevel, string> = {
  undergraduate: "Undergraduate",
  masters: "Postgraduate Masters",
  phd: "PhD",
  diploma: "Diploma / Foundation",
};

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(values: string[]) {
  return values.join("\n");
}

const TUITION_CURRENCIES = ["GBP", "EUR", "USD", "AUD", "CAD", "INR"];

/** IELTS still drives the eligibility badge, so it is mirrored onto the legacy fields. */
function deriveIeltsFields(tests: RequirementSet["languageTests"]) {
  const ielts = tests.find(
    (test) => test.testType === "IELTS_ACADEMIC" || test.testType === "IELTS_GENERAL",
  );
  if (!ielts) {
    return { ieltsMin: 0, ieltsPerBand: undefined, ieltsLabel: "No IELTS requirement" };
  }
  const bands = [ielts.minListening, ielts.minReading, ielts.minWriting, ielts.minSpeaking].filter(
    (band): band is number => typeof band === "number" && band > 0,
  );
  return {
    ieltsMin: ielts.minOverallScore ?? 0,
    ieltsPerBand: bands.length > 0 ? Math.min(...bands) : undefined,
    ieltsLabel: `IELTS ${ielts.minOverallScore ?? 0}+`,
  };
}

function emptyCourse(universityId: string): CourseInput {
  return {
    universityId,
    name: "",
    tuitionCurrency: "GBP",
    requirementSet: emptyRequirementSet(),
    level: "masters",
    levelLabel: levelLabels.masters,
    intakes: [],
    duration: "1 year",
    tuitionLakhs: 0,
    ieltsMin: 6.5,
    ieltsLabel: "IELTS 6.5+",
    applicationFee: "",
    deadline: "",
    curriculum: { semester1: [], semester2: [] },
    requirements: [],
    keyDates: {
      applicationDeadline: "",
      rollingAdmissions: false,
      courseStart: "",
      courseEnd: "",
      pgwpEligible: "N/A",
    },
    fees: {
      tuitionPerYear: "",
      applicationFee: "",
      livingCosts: "",
    },
    ourData: {
      studentsSent: 0,
      accepted: 0,
      visaApproved: 0,
      avgCommission: "₹0",
    },
  };
}

type CourseFormDrawerProps = {
  course?: Course | null;
  onClose: () => void;
  onSave: (input: CourseInput) => void;
  open: boolean;
  universityId: string;
  /**
   * University-level defaults, used to prefill a NEW course. They are copied, not
   * shared: the course keeps its own rows, so changing the defaults later leaves
   * existing courses alone.
   */
  universityDefaults?: RequirementSet;
};

export function CourseFormDrawer({
  course,
  onClose,
  onSave,
  open,
  universityId,
  universityDefaults,
}: CourseFormDrawerProps) {
  const [form, setForm] = useState<CourseInput>(emptyCourse(universityId));
  const [intakesText, setIntakesText] = useState("");
  const [semester1Text, setSemester1Text] = useState("");
  const [semester2Text, setSemester2Text] = useState("");

  useEffect(() => {
    if (course) {
      // Deliberately empty on edit: the course's stored requirements are not loaded
      // (mapCourseToUi drops them), so anything left here would be re-posted as a
      // duplicate. The editor's hint says so.
      setForm({ ...course, requirementSet: emptyRequirementSet() });
      setIntakesText(course.intakes.join(", "));
      setSemester1Text(arrayToLines(course.curriculum.semester1));
      setSemester2Text(arrayToLines(course.curriculum.semester2));
    } else {
      // Copied, not referenced — structuredClone keeps the caller's defaults immutable.
      setForm({
        ...emptyCourse(universityId),
        requirementSet: universityDefaults
          ? structuredClone(universityDefaults)
          : emptyRequirementSet(),
      });
      setIntakesText("");
      setSemester1Text("");
      setSemester2Text("");
    }
  }, [course, open, universityId, universityDefaults]);

  const handleLevelChange = (level: CourseLevel) => {
    setForm((current) => ({
      ...current,
      level,
      levelLabel: levelLabels[level],
    }));
  };

  const handleSave = () => {
    onSave({
      ...form,
      id: course?.id,
      intakes: intakesText
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      curriculum: {
        semester1: linesToArray(semester1Text),
        semester2: linesToArray(semester2Text),
      },
      ...deriveIeltsFields(form.requirementSet?.languageTests ?? []),
      fees: {
        ...form.fees,
        // Derived, never typed: the label and the number cannot drift apart.
        tuitionPerYear: formatTuitionLakhs(form.tuitionLakhs),
        applicationFee: form.fees.applicationFee || form.applicationFee,
      },
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, p: 3 } }}>
      <Stack spacing={2.5}>
        <Typography variant="h6">{course ? "Edit Course" : "Add Course"}</Typography>
        <Divider />

        <Typography color="text.secondary" variant="subtitle2">
          Course details
        </Typography>
        <TextField
          fullWidth
          label="Course name"
          size="small"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Level"
            select
            SelectProps={{ native: true }}
            size="small"
            value={form.level}
            onChange={(event) => handleLevelChange(event.target.value as CourseLevel)}
          >
            {courseSearchSettings.filters.level.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Duration"
            size="small"
            value={form.duration}
            onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
          />
        </Stack>
        <TextField
          fullWidth
          helperText="Comma-separated values"
          label="Intakes"
          size="small"
          value={intakesText}
          onChange={(event) => setIntakesText(event.target.value)}
        />

        <Typography color="text.secondary" variant="subtitle2">
          Fee structure
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Annual tuition (₹ Lakh)"
            size="small"
            type="number"
            value={form.tuitionLakhs}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tuitionLakhs: Number(event.target.value) || 0,
              }))
            }
          />
          <TextField
            fullWidth
            select
            label="Currency"
            size="small"
            value={form.tuitionCurrency ?? "GBP"}
            onChange={(event) =>
              setForm((current) => ({ ...current, tuitionCurrency: event.target.value }))
            }
          >
            {TUITION_CURRENCIES.map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Application fee"
            size="small"
            value={form.applicationFee}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                applicationFee: event.target.value,
                fees: { ...current.fees, applicationFee: event.target.value },
              }))
            }
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Scholarship"
            size="small"
            value={form.fees.scholarship ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fees: { ...current.fees, scholarship: event.target.value },
              }))
            }
          />
          <TextField
            fullWidth
            label="Application deadline"
            size="small"
            value={form.deadline}
            onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
          />
        </Stack>
        <TextField
          fullWidth
          multiline
          label="Scholarship note"
          minRows={2}
          size="small"
          value={form.fees.scholarshipNote ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              fees: { ...current.fees, scholarshipNote: event.target.value },
            }))
          }
        />

        <Divider />
        <RequirementsEditor
          hint={
            course
              ? "Requirements already saved for this course aren't listed here and are left untouched. Anything added below is appended to them."
              : universityDefaults && !requirementSetIsEmpty(universityDefaults)
                ? "Prefilled from this university's defaults. Edit freely — the course keeps its own copy, so later changes to the university defaults won't affect it."
                : undefined
          }
          value={form.requirementSet ?? emptyRequirementSet()}
          onChange={(next) => setForm((current) => ({ ...current, requirementSet: next }))}
        />
        <Divider />

        <Typography color="text.secondary" variant="subtitle2">
          Key dates
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Application deadline"
            size="small"
            value={form.keyDates.applicationDeadline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keyDates: { ...current.keyDates, applicationDeadline: event.target.value },
              }))
            }
          />
          <TextField
            fullWidth
            label="Course start"
            size="small"
            value={form.keyDates.courseStart}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keyDates: { ...current.keyDates, courseStart: event.target.value },
              }))
            }
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Course end"
            size="small"
            value={form.keyDates.courseEnd}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keyDates: { ...current.keyDates, courseEnd: event.target.value },
              }))
            }
          />
          <TextField
            fullWidth
            label="PGWP eligible"
            size="small"
            value={form.keyDates.pgwpEligible}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keyDates: { ...current.keyDates, pgwpEligible: event.target.value },
              }))
            }
          />
        </Stack>

        <Typography color="text.secondary" variant="subtitle2">
          Curriculum
        </Typography>
        <TextField
          fullWidth
          multiline
          label="Semester 1 modules"
          minRows={4}
          size="small"
          value={semester1Text}
          onChange={(event) => setSemester1Text(event.target.value)}
        />
        <TextField
          fullWidth
          multiline
          label="Semester 2 + project modules"
          minRows={4}
          size="small"
          value={semester2Text}
          onChange={(event) => setSemester2Text(event.target.value)}
        />

        <Typography color="text.secondary" variant="subtitle2">
          Agency track record
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Students sent"
            size="small"
            type="number"
            value={form.ourData.studentsSent}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ourData: { ...current.ourData, studentsSent: Number(event.target.value) || 0 },
              }))
            }
          />
          <TextField
            fullWidth
            label="Accepted"
            size="small"
            type="number"
            value={form.ourData.accepted}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ourData: { ...current.ourData, accepted: Number(event.target.value) || 0 },
              }))
            }
          />
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Visa approved"
            size="small"
            type="number"
            value={form.ourData.visaApproved}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ourData: { ...current.ourData, visaApproved: Number(event.target.value) || 0 },
              }))
            }
          />
          <TextField
            fullWidth
            label="Avg commission"
            size="small"
            value={form.ourData.avgCommission}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ourData: { ...current.ourData, avgCommission: event.target.value },
              }))
            }
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            Save course
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
