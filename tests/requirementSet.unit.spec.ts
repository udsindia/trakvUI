import { describe, expect, test } from "vitest";
import {
  emptyRequirementSet,
  requirementSetIsEmpty,
  toRequirementPayloads,
  validateRequirementSet,
  type RequirementSet,
} from "@/modules/universities/universitiesCatalogService";

/**
 * The editor's half of the mutual-exclusivity rules, mirrored on the server by
 * RequirementRules. Both exist because a requirement stating the same bar twice leaves
 * the eligibility check with no defensible answer.
 *
 * These tests are as much about what stays allowed as what gets blocked — a rule that
 * over-fires here quietly makes a real requirement unrecordable.
 */
const set = (over: Partial<RequirementSet>): RequirementSet => ({
  ...emptyRequirementSet(),
  ...over,
});

describe("requirement set validation", () => {
  test("a general GPA alongside a per-length one is rejected", () => {
    const errors = validateRequirementSet(
      set({ academic: { minGpa: 7, minGpa3Year: 8 } }),
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("minGpa");
  });

  test("a three-year and a four-year GPA together are allowed", () => {
    // The case the feature exists for. They describe different applicants.
    expect(
      validateRequirementSet(set({ academic: { minGpa3Year: 8, minGpa4Year: 7 } })),
    ).toHaveLength(0);
  });

  test("a general GPA on its own is allowed", () => {
    expect(validateRequirementSet(set({ academic: { minGpa: 7 } }))).toHaveLength(0);
  });

  test("Class 12 English and the 11th/12th average cannot both be accepted", () => {
    const errors = validateRequirementSet(
      set({
        languageTests: [
          { testType: "INTER_ENGLISH" },
          { testType: "INTER_ENGLISH_AVG" },
        ],
      }),
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("languageTests");
  });

  test("MOI alongside IELTS is allowed — a university can accept either", () => {
    // Common and correct: the tests are alternatives, and a student meeting any one
    // qualifies. Blocking this would make a real requirement unrecordable.
    expect(
      validateRequirementSet(
        set({
          languageTests: [
            { testType: "MOI_LETTER" },
            { testType: "IELTS_ACADEMIC", minOverallScore: 6.5 },
            { testType: "TOEFL_IBT", minOverallScore: 90 },
          ],
        }),
      ),
    ).toHaveLength(0);
  });

  test("both conflicts at once are reported together, not one at a time", () => {
    const errors = validateRequirementSet(
      set({
        academic: { minGpa: 7, minGpa4Year: 7 },
        languageTests: [{ testType: "INTER_ENGLISH" }, { testType: "INTER_ENGLISH_AVG" }],
      }),
    );

    expect(errors).toHaveLength(2);
  });

  test("an empty set is empty, and a per-length GPA alone is not", () => {
    expect(requirementSetIsEmpty(emptyRequirementSet())).toBe(true);
    // Regression: this counted as empty once, so a requirement carrying only a
    // per-length GPA was silently dropped instead of saved.
    expect(requirementSetIsEmpty(set({ academic: { minGpa3Year: 8 } }))).toBe(false);
  });
});

describe("requirement payloads", () => {
  test("a per-length GPA reaches the API", () => {
    const payloads = toRequirementPayloads(
      set({ academic: { minGpa3Year: 8, minGpa4Year: 7 } }),
      null,
    );

    const academic = payloads.find((p) => p.requirementType === "ACADEMIC");
    expect(academic).toBeTruthy();
    expect(academic?.minGpa3Year).toBe(8);
    expect(academic?.minGpa4Year).toBe(7);
  });

  test("every GPA is sent on a 10-point scale", () => {
    // The scale picker is gone; sending the scale explicitly is what stops a stored
    // number being ambiguous on read.
    const payloads = toRequirementPayloads(set({ academic: { minGpa: 7 } }), null);
    expect(payloads.find((p) => p.requirementType === "ACADEMIC")?.gpaScale).toBe("10.0");
  });

  test("each accepted language test becomes its own row", () => {
    const payloads = toRequirementPayloads(
      set({
        languageTests: [
          { testType: "IELTS_ACADEMIC", minOverallScore: 6.5 },
          { testType: "MOI_LETTER" },
        ],
      }),
      "course-1",
    );

    const language = payloads.filter((p) => p.requirementType === "LANGUAGE_TEST");
    expect(language).toHaveLength(2);
    expect(language.every((p) => p.courseId === "course-1")).toBe(true);
  });

  test("an empty set produces no rows at all", () => {
    expect(toRequirementPayloads(emptyRequirementSet(), null)).toHaveLength(0);
  });
});
