import { describe, expect, test } from "vitest";
import { buildCourseSearchApiPayload } from "@/modules/universities/pages/CourseSearchPage";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import {
  buildCourseSearchFilterConfig,
  getCourseSearchDefaultFilterValues,
} from "@/modules/universities/courseSearchFilterConfig";

/**
 * What the finder actually posts.
 *
 * The backend has been verified to return results for UK + Masters, and the screen shows
 * none, so the fault has to be at one of the two edges: the request the page builds, or
 * the response it renders. This covers the first.
 *
 * It is the one place a filter can go missing without anything erroring — a key that does
 * not match, a value read off the wrong shape, and the request simply goes out without
 * the clause.
 */
const defaults = courseSearchSettings.defaults;

/**
 * The panel's state as the page actually starts it.
 *
 * Built the same way CourseSearchPage builds it, rather than from a hand-written object:
 * this used to spread `defaults.filterValues`, which does not exist on defaults, so every
 * case here ran against an empty object and passed only because it asserted on keys it had
 * set itself. A default that was wrong would have sailed through.
 */
const panelDefaults = getCourseSearchDefaultFilterValues(buildCourseSearchFilterConfig({}));

const values = (over: Record<string, unknown> = {}) => ({
  ...(panelDefaults as Record<string, unknown>),
  ...over,
});

describe("course search payload", () => {
  test("selecting UK sends a destination", () => {
    const payload = buildCourseSearchApiPayload(
      values({ country: "GB" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.destinations).toEqual(["GB"]);
  });

  test("selecting Masters sends a course level", () => {
    const payload = buildCourseSearchApiPayload(
      values({ level: "POSTGRADUATE_TAUGHT" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.courseLevels).toEqual(["POSTGRADUATE_TAUGHT"]);
  });

  test("selecting both sends both — the reported combination", () => {
    const payload = buildCourseSearchApiPayload(
      values({ country: "GB", level: "POSTGRADUATE_TAUGHT" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.destinations).toEqual(["GB"]);
    expect(payload.courseLevels).toEqual(["POSTGRADUATE_TAUGHT"]);
  });

  test("the sliders are not sent while they sit at their defaults", () => {
    // A tuition or IELTS bound sent at rest would exclude every course with no figure
    // recorded, which is most of the catalogue.
    const payload = buildCourseSearchApiPayload(
      values({ country: "GB", level: "POSTGRADUATE_TAUGHT" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.minTuitionLakhs).toBeUndefined();
    expect(payload.maxTuitionLakhs).toBeUndefined();
    expect(payload.minIelts).toBeUndefined();
    expect(payload.maxIelts).toBeUndefined();
  });

  test("an untouched panel sends no filters at all", () => {
    const payload = buildCourseSearchApiPayload(values() as never, "", defaults.sort as never, null);

    expect(payload.destinations).toEqual([]);
    expect(payload.courseLevels).toEqual([]);
    expect(payload.intakeMonths).toEqual([]);
  });

  test("the intake filter sends a bare month", () => {
    const payload = buildCourseSearchApiPayload(
      values({ intake: "September" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.intakeMonths).toEqual(["September"]);
  });

  test("an English test and score are sent from the student's side", () => {
    const payload = buildCourseSearchApiPayload(
      values({ englishTest: "PTE_ACADEMIC", englishScore: "65" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.englishTestType).toBe("PTE_ACADEMIC");
    expect(payload.englishScore).toBe(65);
    // Left off by default, so the server keeps courses with no requirement recorded.
    expect(payload.includeUnstatedEnglish).toBeUndefined();
  });

  test("MOI is sent without a score, because holding it is the requirement", () => {
    // A score of 0 would read as a bar of zero rather than "not scored".
    const payload = buildCourseSearchApiPayload(
      values({ englishTest: "MOI_LETTER", englishScore: "" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.englishTestType).toBe("MOI_LETTER");
    expect(payload.englishScore).toBeUndefined();
  });

  test("ticking the strict box asks for a stated bar only", () => {
    const payload = buildCourseSearchApiPayload(
      values({
        englishTest: "IELTS_ACADEMIC",
        englishScore: "7",
        englishUnstated: ["onlyStated"],
      }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.includeUnstatedEnglish).toBe(false);
  });

  test("no test chosen sends no English filter at all", () => {
    const payload = buildCourseSearchApiPayload(values() as never, "", defaults.sort as never, null);

    expect(payload.englishTestType).toBeUndefined();
    expect(payload.englishScore).toBeUndefined();
    expect(payload.includeUnstatedEnglish).toBeUndefined();
  });

  test("the aptitude box excludes, and leaving it alone filters nothing", () => {
    // Unticked must send nothing rather than true, which would show ONLY courses
    // requiring a GRE — the opposite of what the box says.
    const off = buildCourseSearchApiPayload(values() as never, "", defaults.sort as never, null);
    expect(off.aptitudeTestRequired).toBeUndefined();

    const on = buildCourseSearchApiPayload(
      values({ aptitudeTest: ["exclude"] }) as never,
      "",
      defaults.sort as never,
      null,
    );
    expect(on.aptitudeTestRequired).toBe(false);
  });

  test("the retired IELTS slider is no longer sent", () => {
    const payload = buildCourseSearchApiPayload(
      values({ englishTest: "IELTS_ACADEMIC", englishScore: "7" }) as never,
      "",
      defaults.sort as never,
      null,
    );

    expect(payload.minIelts).toBeUndefined();
    expect(payload.maxIelts).toBeUndefined();
  });

  test("a selected student is sent, so eligibility can be computed", () => {
    const payload = buildCourseSearchApiPayload(
      values({ country: "GB" }) as never,
      "",
      defaults.sort as never,
      "student-1",
    );

    expect(payload.studentId).toBe("student-1");
  });
});
