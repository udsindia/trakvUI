import { describe, expect, test } from "vitest";
import { mapCourseToUi } from "@/modules/universities/universitiesMappers";
import type { CourseDto } from "@/modules/universities/universitiesApi.types";

/**
 * What a course card is allowed to claim.
 *
 * This mapper used to invent an IELTS requirement from the study level — 6.0 for
 * undergraduate, 6.5 for everything else — and render it as "IELTS 6.5+". It was not
 * only displayed: studentEligibility judges a student against ieltsMin, so a made-up
 * bar was deciding real matches. These tests exist to keep fabricated data out.
 */
const course = (over: Partial<CourseDto> = {}): CourseDto => ({
  id: "course-1",
  name: "MSc Data Science",
  studyLevel: "POSTGRADUATE_TAUGHT",
  ...over,
});

describe("course mapping", () => {
  test("with no IELTS on record, no IELTS bar is invented", () => {
    // Zero means "no bar recorded", so eligibility stops rejecting students against a
    // requirement the university never stated.
    const ui = mapCourseToUi(course({ requirements: [] }), "uni-1");

    expect(ui.ieltsMin).toBe(0);
    expect(ui.ieltsLabel).toBe("No IELTS requirement");
  });

  test("the study level does not conjure a score", () => {
    // The exact shape of the old bug: undergraduate used to yield 6.0 and everything
    // else 6.5, with nothing behind either number.
    for (const level of ["UNDERGRADUATE", "POSTGRADUATE_TAUGHT", "PHD", "DIPLOMA"] as const) {
      const ui = mapCourseToUi(course({ studyLevel: level, requirements: [] }), "uni-1");
      expect(ui.ieltsMin, level).toBe(0);
    }
  });

  test("a stored IELTS requirement is the one shown", () => {
    const ui = mapCourseToUi(
      course({
        requirements: [
          {
            id: "r1",
            requirementType: "LANGUAGE_TEST",
            testType: "IELTS_ACADEMIC",
            minOverallScore: 5.5,
          },
        ],
      }),
      "uni-1",
    );

    expect(ui.ieltsMin).toBe(5.5);
    expect(ui.ieltsLabel).toBe("IELTS 5.5+");
  });

  test("per-band minimums come through when they are recorded", () => {
    const ui = mapCourseToUi(
      course({
        requirements: [
          {
            id: "r1",
            requirementType: "LANGUAGE_TEST",
            testType: "IELTS_ACADEMIC",
            minOverallScore: 6.5,
            minListening: 6,
            minReading: 6,
            minWriting: 5.5,
            minSpeaking: 6,
          },
        ],
      }),
      "uni-1",
    );

    // The lowest band is the binding one.
    expect(ui.ieltsPerBand).toBe(5.5);
  });

  test("a non-IELTS test does not become an IELTS score", () => {
    const ui = mapCourseToUi(
      course({
        requirements: [
          {
            id: "r1",
            requirementType: "LANGUAGE_TEST",
            testType: "TOEFL_IBT",
            minOverallScore: 90,
          },
        ],
      }),
      "uni-1",
    );

    expect(ui.ieltsMin).toBe(0);
  });

  test("a course's requirements reach the UI rather than being dropped", () => {
    // mapCourseToUi hardcoded an empty list, so the details page — already built to
    // render them — always showed nothing.
    const ui = mapCourseToUi(
      course({
        requirements: [
          { id: "r1", requirementType: "LANGUAGE_TEST", testType: "IELTS_ACADEMIC", minOverallScore: 6.5 },
          { id: "r2", requirementType: "ACADEMIC", minGpa: 7 },
        ],
      }),
      "uni-1",
    );

    expect(ui.requirements).toHaveLength(2);
    expect(ui.requirements[0].label).toBeTruthy();
  });

  test("intakes come from the intake months, not from a cycle's start date", () => {
    const ui = mapCourseToUi(
      course({ intakeMonths: ["January", "September"] }),
      "uni-1",
    );

    expect(ui.intakes).toEqual(["January", "September"]);
  });

  test("a course with no intakes recorded shows none", () => {
    expect(mapCourseToUi(course({}), "uni-1").intakes).toEqual([]);
  });
});
