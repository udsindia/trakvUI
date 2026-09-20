import { describe, expect, test } from "vitest";
import { buildCourseSearchApiPayload } from "@/modules/universities/pages/CourseSearchPage";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";

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

/** The filter panel's state, keyed the way the page reads it. */
const values = (over: Record<string, unknown> = {}) => ({
  ...(defaults.filterValues as Record<string, unknown>),
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
