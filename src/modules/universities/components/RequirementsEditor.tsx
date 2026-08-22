import { AddRounded, DeleteOutlineRounded } from "@mui/icons-material";
import {
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
  GPA_SCALES,
  getAptitudeTestOption,
  getEnglishTestOption,
} from "@/config/universities/requirementOptions";
import type {
  CourseAptitudeTest,
  CourseLanguageTest,
  RequirementSet,
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

export const englishKey = (testType: TestType) => `english:${testType}`;
export const aptitudeKey = (testType: AptitudeTestType) => `aptitude:${testType}`;

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
  const updateEnglish = (index: number, patch: Partial<CourseLanguageTest>) => {
    onChange({
      ...value,
      languageTests: value.languageTests.map((test, position) =>
        position === index ? { ...test, ...patch } : test,
      ),
    });
  };

  const addEnglish = () => {
    const taken = new Set(value.languageTests.map((test) => test.testType));
    const next = ENGLISH_TEST_OPTIONS.find((option) => !taken.has(option.value));
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
    const next = APTITUDE_TEST_OPTIONS.find((option) => !taken.has(option.value));
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
                disabled={locked.has(englishKey(test.testType))}
                value={test.testType}
                onChange={(event) =>
                  updateEnglish(index, { testType: event.target.value as TestType })
                }
              >
                {ENGLISH_TEST_OPTIONS.map((entry) => (
                  <MenuItem
                    key={entry.value}
                    value={entry.value}
                    disabled={takenElsewhere.includes(entry.value)}
                  >
                    {entry.label}
                  </MenuItem>
                ))}
              </TextField>
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
                disabled={locked.has(englishKey(test.testType))}
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
            {locked.has(englishKey(test.testType)) ? (
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 1 }}>
                Already saved — scores can be changed, but this test can&apos;t be removed.
              </Typography>
            ) : null}
          </Box>
        );
      })}
      <Button
        disabled={value.languageTests.length >= ENGLISH_TEST_OPTIONS.length}
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

        return (
          <Box key={`aptitude-${index}`}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <TextField
              fullWidth
              select
              label="Test"
              size="small"
              disabled={locked.has(aptitudeKey(test.testType))}
              value={test.testType}
              onChange={(event) =>
                updateAptitude(index, { testType: event.target.value as AptitudeTestType })
              }
            >
              {APTITUDE_TEST_OPTIONS.map((entry) => (
                <MenuItem
                  key={entry.value}
                  value={entry.value}
                  disabled={takenElsewhere.includes(entry.value)}
                >
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
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
                disabled={locked.has(aptitudeKey(test.testType))}
                size="small"
                onClick={() => removeAptitude(index)}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Stack>
            {locked.has(aptitudeKey(test.testType)) ? (
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 0.5 }}>
                Already saved — the score can be changed, but this test can&apos;t be removed.
              </Typography>
            ) : null}
          </Box>
        );
      })}
      <Button
        disabled={value.aptitudeTests.length >= APTITUDE_TEST_OPTIONS.length}
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
          label="Minimum GPA"
          size="small"
          type="number"
          inputProps={{ min: 0, step: 0.1 }}
          value={value.academic.minGpa ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: { ...value.academic, minGpa: numberOrUndefined(event.target.value) },
            })
          }
        />
        <TextField
          fullWidth
          select
          label="GPA scale"
          size="small"
          value={value.academic.gpaScale ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              academic: { ...value.academic, gpaScale: event.target.value || undefined },
            })
          }
        >
          <MenuItem value="">Not specified</MenuItem>
          {GPA_SCALES.map((scale) => (
            <MenuItem key={scale} value={scale}>
              out of {scale}
            </MenuItem>
          ))}
        </TextField>
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
      </Stack>
    </Stack>
  );
}
