import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import { mergeFieldsOfStudy } from "@/config/universities/fieldsOfStudy";
import { leadApi } from "@/modules/lead/leadApi";
import type { Course, CourseLevel } from "@/modules/universities/universities.types";
import { formatTuitionLakhs } from "@/modules/universities/courseSearchUtils";
import { formatTuition, tuitionToLakhs } from "@/modules/universities/universitiesMappers";
import { RequirementsEditor } from "@/modules/universities/components/RequirementsEditor";
import {
  emptyRequirementSet,
  requirementSetIsEmpty,
  validateRequirementSet,
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
    tuitionAmount: 0,
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

  // The subjects already on the tenant's courses — the same list the finder's Field of
  // Study filter shows, and the same cache entry, so suggesting one keeps both in step.
  // Without it (no access, or no courses yet) the standard list still suggests.
  const { data: filterOptions } = useQuery({
    queryKey: ["courses", "search", "filter-options"],
    queryFn: () => leadApi.courseFilters(),
    enabled: open,
    retry: false,
  });
  const fieldOfStudyOptions = useMemo(
    () => mergeFieldsOfStudy((filterOptions as { disciplines?: string[] } | undefined)?.disciplines),
    [filterOptions],
  );

  useEffect(() => {
    if (course) {
      // Deliberately empty on edit. The course's requirements ARE loaded now
      // (mapCourseToUi maps them, and course.requirements holds them), but the save path
      // still appends rather than upserts — so prefilling here would re-post every row as
      // a duplicate. Prefill only once saving upserts on the dedupe key, the way
      // saveUniversityDefaults already does. The editor's hint says so meanwhile.
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

  const [attemptedSave, setAttemptedSave] = useState(false);
  // Named by their on-screen labels so the error names what the counsellor is looking at.
  const missingRequired = [!form.name.trim() ? "Course name" : null].filter(
    (entry): entry is string => entry !== null,
  );
  const showMissing = attemptedSave && missingRequired.length > 0;

  const requirementErrors = validateRequirementSet(
    form.requirementSet ?? emptyRequirementSet(),
  );

  const handleLevelChange = (level: CourseLevel) => {
    setForm((current) => ({
      ...current,
      level,
      levelLabel: levelLabels[level],
    }));
  };

  const handleSave = () => {
    setAttemptedSave(true);
    // A missing required field reveals the message rather than saving. The drawer stays
    // open either way — a dead button never says which field is at fault.
    if (missingRequired.length > 0) {
      return;
    }
    // Belt as well as braces: the button is disabled too, but a keyboard submit or a
    // stale render must not slip a contradictory set past. Returning without calling
    // onSave leaves the drawer open, with the editor's inline errors still showing.
    if (requirementErrors.length > 0) {
      return;
    }
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
        tuitionPerYear: formatTuition(form.tuitionAmount, form.tuitionCurrency),
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
          required
          label="Course name"
          size="small"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <Autocomplete
          freeSolo
          autoSelect
          options={fieldOfStudyOptions}
          value={form.subjectArea ?? ""}
          onChange={(_, value) =>
            setForm((current) => ({ ...current, subjectArea: value ?? "" }))
          }
          onInputChange={(_, value, reason) => {
            // Typing a new subject counts without picking it from the list.
            if (reason === "input") setForm((current) => ({ ...current, subjectArea: value }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              helperText="Pick one or type your own. Counsellors filter the course finder on this."
              label="Field of study"
              size="small"
            />
          )}
        />
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            label="Level"
            select
            // A native select always paints its selected option's text, so the label has
            // to sit above the box. Left to shrink on its own it stays inside while the
            // value is empty, printing the label straight over "Select …".
            InputLabelProps={{ shrink: true }}
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
            helperText={
              form.tuitionAmount
                ? `≈ ${formatTuitionLakhs(tuitionToLakhs(form.tuitionAmount, form.tuitionCurrency ?? "GBP"))} per year`
                : "The fee as the university publishes it."
            }
            label={`Annual tuition (${(form.tuitionCurrency ?? "GBP").toUpperCase()})`}
            size="small"
            type="number"
            value={form.tuitionAmount ?? 0}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tuitionAmount: Number(event.target.value) || 0,
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

        <Stack direction="row" spacing={1.5}>
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

        {showMissing ? (

          <Alert severity="error">{missingRequired[0]} is required.</Alert>

        ) : null}

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            // Not disabled for a missing name — handleSave names it instead.
            disabled={requirementErrors.length > 0}
          >
            Save course
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
