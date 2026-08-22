import type {
  AptitudeTestType,
  TestType,
} from "@/modules/universities/universitiesApi.types";

/**
 * English-proficiency tests a course can accept.
 *
 * These values MUST match the backend TestType enum — the requirements API
 * deserialises straight into it, so an unknown string is a 400. Note this is a
 * different enum from LanguageTestType, which records a *student's* scores.
 */
export const ENGLISH_TEST_OPTIONS: Array<{
  value: TestType;
  label: string;
  /** Highest score the test awards. 0 = not scored (a waiver document). */
  max: number;
  step: number;
  /** Tests reported as four skill bands; others are overall-only. */
  hasBands: boolean;
}> = [
  { value: "IELTS_ACADEMIC", label: "IELTS Academic", max: 9, step: 0.5, hasBands: true },
  { value: "IELTS_GENERAL", label: "IELTS General", max: 9, step: 0.5, hasBands: true },
  { value: "TOEFL_IBT", label: "TOEFL iBT", max: 120, step: 1, hasBands: true },
  { value: "PTE_ACADEMIC", label: "PTE Academic", max: 90, step: 1, hasBands: true },
  { value: "DUOLINGO", label: "Duolingo", max: 160, step: 5, hasBands: false },
  { value: "MOI_LETTER", label: "MOI (Medium of Instruction)", max: 0, step: 1, hasBands: false },
  { value: "INTER_ENGLISH", label: "Inter / Class 12 English", max: 100, step: 1, hasBands: false },
  { value: "CAMBRIDGE_C1", label: "Cambridge C1 Advanced", max: 210, step: 1, hasBands: false },
  { value: "CAMBRIDGE_C2", label: "Cambridge C2 Proficiency", max: 230, step: 1, hasBands: false },
];

/**
 * Aptitude / entrance tests, backed by the separate AptitudeTestType enum and its
 * own column — the two lists are never interchangeable.
 */
export const APTITUDE_TEST_OPTIONS: Array<{
  value: AptitudeTestType;
  label: string;
  max: number;
  step: number;
}> = [
  { value: "GRE", label: "GRE", max: 340, step: 1 },
  { value: "GMAT", label: "GMAT", max: 800, step: 10 },
  { value: "SAT", label: "SAT", max: 1600, step: 10 },
  { value: "DMAT", label: "DMAT", max: 100, step: 1 },
];

/** Scales a GPA can be quoted on. Stored as text in gpa_scale. */
export const GPA_SCALES = ["4.0", "5.0", "7.0", "10.0"];

export function getEnglishTestOption(testType: TestType) {
  return ENGLISH_TEST_OPTIONS.find((option) => option.value === testType);
}

export function getAptitudeTestOption(testType: AptitudeTestType) {
  return APTITUDE_TEST_OPTIONS.find((option) => option.value === testType);
}

export function getEnglishTestLabel(testType: TestType): string {
  return getEnglishTestOption(testType)?.label ?? String(testType);
}

export function getAptitudeTestLabel(testType: AptitudeTestType): string {
  return getAptitudeTestOption(testType)?.label ?? String(testType);
}
