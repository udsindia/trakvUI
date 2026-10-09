import { AddRounded, DeleteOutlineRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  APTITUDE_TEST_OPTIONS,
  ENGLISH_TEST_OPTIONS,
  getAptitudeTestOption,
  getEnglishTestOption,
} from "@/config/universities/requirementOptions";
import {
  validateRequirementSet,
  type CourseAptitudeTest,
  type CourseLanguageTest,
  type RequirementSet,
} from "@/modules/universities/universitiesCatalogService";
import type {
  AptitudeTestType,
  TestType,
} from "@/modules/universities/universitiesApi.types";

type RequirementsEditorProps = {
  value: RequirementSet;
  onChange: (next: RequirementSet) => void;
  /** Shown above the English section — used to explain append-only edit behaviour. */
  hint?: string;
  /**
   * Entries that are already stored and cannot be removed — there is no delete
   * endpoint for requirements, only create and modify. Their remove button is
   * disabled so the UI doesn't promise something the save can't do. Keys are
   * `english:<TestType>` / `aptitude:<AptitudeTestType>`.
   */
  lockedKeys?: string[];
};

// An "Other test" is told apart from another by the name typed in, so the name is part of its key.
const otherSuffix = (testType: string, otherTestName?: string) =>
  testType === "OTHER" ? `:${(otherTestName ?? "").trim().toLowerCase()}` : "";
export const englishKey = (testType: TestType, otherTestName?: string) =>
  `english:${testType}${otherSuffix(testType, otherTestName)}`;
export const aptitudeKey = (testType: AptitudeTestType, otherTestName?: string) =>
  `aptitude:${testType}${otherSuffix(testType, otherTestName)}`;

const numberOrUndefined = (raw: string) => (raw === "" ? undefined : Number(raw));

/**
 * Edits the requirement set for a course or a university default: accepted English
 * tests, accepted aptitude tests, and the academic thresholds on the applicant's
 * highest degree.
 *
 * Each English/aptitude entry becomes its own requirement row, so listing several
 * means "any one of these qualifies". The academic block is a single ACADEMIC row.
 */
export function RequirementsEditor({
  value,
  onChange,
  hint,
  lockedKeys = [],
}: RequirementsEditorProps) {
  const locked = new Set(lockedKeys);
  // Recomputed each render so the message clears the moment the conflict is resolved.
  const errors = validateRequirementSet(value);
  const errorFor = (field: "minGpa" | "languageTests" | "aptitudeTests") =>
    errors.find((entry) => entry.field === field);
  const englishError = errorFor("languageTests");
  const aptitudeError = errorFor("aptitudeTests");
  const updateEnglish = (index: number, patch: Partial<CourseLanguageTest>) => {
    onChange({
      ...value,
      languageTests: value.languageTests.map((test, position) =>
        position === index ? { ...test, ...patch } : test,
      ),
    });
  };

  const addEnglish = () => {
    // Offer the next listed test not already added; once they are all used, add an "Other test",
    // which can be added any number of times (each with its own typed name).
    const taken = new Set(value.languageTests.map((test) => test.testType));
    const next =
      ENGLISH_TEST_OPTIONS.find((option) => option.value !== "OTHER" && !taken.has(option.value)) ??
      ENGLISH_TEST_OPTIONS.find((option) => option.value === "OTHER");
    if (!next) {
      return;
    }
    onChange({ ...value, languageTests: [...value.languageTests, { testType: next.value }] });
  };

  const removeEnglish = (index: number) => {
    onChange({
      ...value,
      languageTests: value.languageTests.filter((_, position) => position !== index),
    });
  };

  const updateAptitude = (index: number, patch: Partial<CourseAptitudeTest>) => {
    onChange({
      ...value,
      aptitudeTests: value.aptitudeTests.map((test, position) =>
        position === index ? { ...test, ...patch } : test,
      ),
    });
  };

  const addAptitude = () => {
    const taken = new Set(value.aptitudeTests.map((test) => test.testType));
    const next =
      APTITUDE_TEST_OPTIONS.find((option) => option.value !== "OTHER" && !taken.has(option.value)) ??
      APTITUDE_TEST_OPTIONS.find((option) => option.value === "OTHER");
    if (!next) {
      return;
    }
    onChange({ ...value, aptitudeTests: [...value.aptitudeTests, { testType: next.value }] });
  };

  const removeAptitude = (index: number) => {
    onChange({
      ...value,
      aptitudeTests: value.aptitudeTests.filter((_, position) => position !== index),
    });
  };

  return (
    <Stack spacing={2}>
      {/* ── English proficiency ─────────────────────────────────────────── */}
      <Typography color="text.secondary" variant="subtitle2">
        English proficiency
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {hint ??
          "Add every test that is accepted. Each is stored separately, so a student meeting any one of them qualifies."}
      </Typography>

      {value.languageTests.map((test, index) => {
        const option = getEnglishTestOption(test.testType);
        const scoreProps = { max: option?.max, min: 0, step: option?.step ?? 1 };
        const takenElsewhere = value.languageTests
          .filter((_, other) => other !== index)
          .map((other) => other.testType);
        const rowLocked = locked.has(englishKey(test.testType, test.otherTestName));

        return (
          <Box
            key={`english-${index}`}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <TextField
                fullWidth
                select
                label="Test"
                size="small"
                disabled={rowLocked}
                value={test.testType}
                onChange={(event) => {
                  const testType = event.target.value as TestType;
                  // The typed name belongs to "Other test" only; drop it when switching to a listed test.
                  updateEnglish(index, {
                    testType,
                    otherTestName: testType === "OTHER" ? test.otherTestName : undefined,
                  });
                }}
              >
                {ENGLISH_TEST_OPTIONS.map((entry) => (
                  <MenuItem
                    key={entry.value}
                    value={entry.value}
                    // "Other test" can be added again and again; every listed test only once.
                    disabled={entry.value !== "OTHER" && takenElsewhere.includes(entry.value)}
                  >
                    {entry.label}
                  </MenuItem>
                ))}
              </TextField>
              {test.testType === "OTHER" ? (
                <TextField
                  fullWidth
                  required
                  label="Test name"
                  placeholder="e.g. University's own English test"
                  size="small"
                  disabled={rowLocked}
                  error={!(test.otherTestName ?? "").trim()}
                  value={test.otherTestName ?? ""}
                  inputProps={{ maxLength: 100 }}
                  onChange={(event) => updateEnglish(index, { otherTestName: event.target.value })}
                />
              ) : null}
              {option && option.max > 0 ? (
                <TextField
                  fullWidth
                  label="Minimum overall"
                  size="small"
                  type="number"
                  inputProps={scoreProps}
                  value={test.minOverallScore ?? ""}
                  onChange={(event) =>
                    updateEnglish(index, {
                      minOverallScore: numberOrUndefined(event.target.value),
                    })
                  }
                />
              ) : (
                <Typography color="text.secondary" sx={{ fontSize: 12, flex: 1 }}>
                  Accepted as a waiver — no score
                </Typography>
              )}
              <IconButton
                aria-label="Remove test"
                disabled={rowLocked}
                size="small"
                onClick={() => removeEnglish(index)}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Stack>
            {option?.hasBands ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                {(
                  [
                    ["minListening", "Listening"],
                    ["minReading", "Reading"],
                    ["minWriting", "Writing"],
                    ["minSpeaking", "Speaking"],
                  ] as const
                ).map(([field, label]) => (
                  <TextField
                    key={field}
                    fullWidth
                    label={label}
                    size="small"
                    type="number"
                    inputProps={scoreProps}
                    value={test[field] ?? ""}
                    onChange={(event) =>
                      updateEnglish(index, { [field]: numberOrUndefined(event.target.value) })
                    }
                  />
                ))}
              </Stack>
            ) : null}
            {rowLocked ? (
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 1 }}>
                Already saved — scores can be changed, but this test can&apos;t be removed.
              </Typography>
            ) : null}
          </Box>
        );
      })}
      {englishError ? (
        <Alert severity="error" sx={{ fontSize: 13 }}>
          {englishError.message}
        </Alert>
      ) : null}
      <Button
        size="small"
        startIcon={<AddRounded />}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
        variant="outlined"
        onClick={addEnglish}
      >
        Add English test
      </Button>

      {/* ── Aptitude ────────────────────────────────────────────────────── */}
      <Typography color="text.secondary" variant="subtitle2">
        Aptitude test
      </Typography>
      {value.aptitudeTests.map((test, index) => {
        const option = getAptitudeTestOption(test.testType);
        const takenElsewhere = value.aptitudeTests
          .filter((_, other) => other !== index)
          .map((other) => other.testType);
        const rowLocked = locked.has(aptitudeKey(test.testType, test.otherTestName));

        return (
          <Box key={`aptitude-${index}`}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <TextField
              fullWidth
              select
              label="Test"
              size="small"
              disabled={rowLocked}
              value={test.testType}
              onChange={(event) => {
                const testType = event.target.value as AptitudeTestType;
                // The typed name belongs to "Other test" only; drop it when switching to a listed test.
                updateAptitude(index, {
                  testType,
                  otherTestName: testType === "OTHER" ? test.otherTestName : undefined,
                });
              }}
            >
              {APTITUDE_TEST_OPTIONS.map((entry) => (
                <MenuItem
                  key={entry.value}
                  value={entry.value}
                  // "Other test" can be added again and again; every listed test only once.
                  disabled={entry.value !== "OTHER" && takenElsewhere.includes(entry.value)}
                >
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            {test.testType === "OTHER" ? (
              <TextField
                fullWidth
                required
                label="Test name"
                placeholder="e.g. University's own entrance test"
                size="small"
                disabled={rowLocked}
                error={!(test.otherTestName ?? "").trim()}
                value={test.otherTestName ?? ""}
                inputProps={{ maxLength: 100 }}
                onChange={(event) => updateAptitude(index, { otherTestName: event.target.value })}
              />
            ) : null}
            <TextField
              fullWidth
              label="Minimum score"
              size="small"
              type="number"
              inputProps={{ max: option?.max, min: 0, step: option?.step ?? 1 }}
              value={test.minOverallScore ?? ""}
              onChange={(event) =>
                updateAptitude(index, { minOverallScore: numberOrUndefined(event.target.value) })
              }
            />
              <IconButton
                aria-label="Remove test"
                disabled={rowLocked}
                size="small"
                onClick={() => removeAptitude(index)}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Stack>
            {rowLocked ? (
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 0.5 }}>
                Already saved — the score can be changed, but this test can&apos;t be removed.
              </Typography>
            ) : null}
          </Box>
        );
      })}
      {aptitudeError ? (
        <Alert severity="error" sx={{ fontSize: 13 }}>
          {aptitudeError.message}
        </Alert>
      ) : null}
      <Button
        size="small"
        startIcon={<AddRounded />}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
        variant="outlined"
        onClick={addAptitude}
      >
        Add aptitude test
      </Button>

      {/* ── Academic ────────────────────────────────────────────────────── */}
      <Typography color="text.secondary" variant="subtitle2">
        Highest degree
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        Applies to the applicant&apos;s highest completed degree — the bachelor&apos;s, for a
        master&apos;s applicant.
      </Typography>
      <Stack direction="row" spacing={1.5}>
        <TextField
          fullWidth
          helperText="3-year degree"
          label="Min GPA 3-year (out of 10)"
          size="small"
          type="number"
          inputProps={{ min: 0, max: 10, step: 0.1 }}
          value={value.academic.minGpa3Year ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: {
                ...value.academic,
                minGpa3Year: numberOrUndefined(event.target.value),
              },
            })
          }
        />
        <TextField
          fullWidth
          helperText="4-year degree"
          label="Min GPA 4-year (out of 10)"
          size="small"
          type="number"
          inputProps={{ min: 0, max: 10, step: 0.1 }}
          value={value.academic.minGpa4Year ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: {
                ...value.academic,
                minGpa4Year: numberOrUndefined(event.target.value),
              },
            })
          }
        />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <TextField
          fullWidth
          label="Max backlogs"
          size="small"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          value={value.academic.maxBacklogs ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: { ...value.academic, maxBacklogs: numberOrUndefined(event.target.value) },
            })
          }
        />
        <TextField
          fullWidth
          helperText="Years since study"
          label="Max education gap"
          size="small"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          value={value.academic.maxEducationGapYears ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: {
                ...value.academic,
                maxEducationGapYears: numberOrUndefined(event.target.value),
              },
            })
          }
        />
      </Stack>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        Left blank, the course finder still offers this university to a student with
        backlogs or a gap — marked as a possible match rather than a confirmed one.
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        A three-year and a four-year bachelor&apos;s are held to different bars by many
        universities, so each has its own. Both may be set, and a student is matched on
        whichever their own degree is. Left blank, GPA is not checked at all.
      </Typography>
    </Stack>
  );
}
