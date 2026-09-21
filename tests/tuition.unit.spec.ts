import { describe, expect, test } from "vitest";
import { formatTuition, mapCourseToUi, tuitionToLakhs } from "@/modules/universities/universitiesMappers";
import type { CourseDto } from "@/modules/universities/universitiesApi.types";

/**
 * What a fee is allowed to say it is.
 *
 * The course form asked for "Annual tuition (₹ Lakh)" with a currency picker beside it,
 * and saved the typed figure through a rupee-lakh conversion. So £23,700 was stored as
 * £22,571,429 and rendered back as "₹23700.0L" — a rupee sign and a lakh suffix on a
 * number that was neither, self-consistent and meaningless.
 *
 * The figure stored is now the one the university publishes, in its own currency. These
 * tests hold that line in both directions, because the old bug round-tripped cleanly and
 * so would have passed any test that only checked display against storage.
 */
const course = (over: Partial<CourseDto> = {}): CourseDto => ({
  id: "course-1",
  name: "International Business and Management MSc",
  studyLevel: "POSTGRADUATE_TAUGHT",
  ...over,
});

describe("tuition display", () => {
  test("a fee is shown in the currency it is quoted in", () => {
    expect(formatTuition(23700, "GBP")).toBe("£23,700");
    expect(formatTuition(45000, "USD")).toBe("$45,000");
    expect(formatTuition(18000, "EUR")).toBe("€18,000");
    expect(formatTuition(250000, "INR")).toBe("₹2,50,000");
  });

  test("a currency with no short symbol keeps its code", () => {
    // Intl separates the code from the number with a non-breaking space, so compare on
    // normalised whitespace rather than pinning the exact byte.
    expect(formatTuition(1000, "CHF")?.replace(/ /g, " ")).toBe("CHF 1,000");
  });

  test("a code Intl cannot parse falls back instead of throwing", () => {
    // Bad data in tuition_currency must not take the card down with a RangeError.
    expect(formatTuition(1000, "NOTACURRENCY")?.replace(/ /g, " ")).toBe(
      "NOTACURRENCY 1,000",
    );
  });

  test("no fee recorded shows nothing, not a zero", () => {
    // "£0" reads as free tuition. The card falls back to "Fee not listed".
    expect(formatTuition(undefined, "GBP")).toBe("");
    expect(formatTuition(0, "GBP")).toBe("");
    expect(formatTuition(null, null)).toBe("");
  });

  test("the displayed fee is never converted", () => {
    // The regression: 23700 GBP must not come out as 23700 rupee-lakhs, nor as the
    // rupee equivalent. What the university publishes is what the counsellor reads.
    const shown = formatTuition(23700, "GBP");

    expect(shown).toBe("£23,700");
    expect(shown).not.toContain("₹");
    expect(shown).not.toContain("L");
  });
});

describe("tuition mapping", () => {
  test("a course carries its fee and currency through untouched", () => {
    const ui = mapCourseToUi(course({ tuitionAmount: 23700, tuitionCurrency: "GBP" }), "uni-1");

    expect(ui.tuitionAmount).toBe(23700);
    expect(ui.tuitionCurrency).toBe("GBP");
    expect(ui.fees.tuitionPerYear).toBe("£23,700");
  });

  test("the rupee figure is derived for the budget slider, not stored", () => {
    // tuitionLakhs still exists — the slider and the "tuition: low" sort are in rupee
    // lakhs, and the backend filter converts the same way. It is computed from the real
    // amount, so it stays right as long as the stored figure is right.
    const ui = mapCourseToUi(course({ tuitionAmount: 23700, tuitionCurrency: "GBP" }), "uni-1");

    expect(ui.tuitionLakhs).toBeCloseTo(24.9, 1); // 23,700 × 105 / 100,000
  });

  test("a course with no fee recorded does not claim one", () => {
    const ui = mapCourseToUi(course({}), "uni-1");

    expect(ui.fees.tuitionPerYear).toBe("");
    expect(ui.tuitionLakhs).toBe(0);
  });

  test("the corrupted figures are recognisably wrong under the new rules", () => {
    // What production actually held: £22,571,429 for a £23,700 course, inflated by
    // 100000/105 because the write path converted rupee lakhs into GBP. Shown honestly
    // in its own currency it is absurd on sight, which is the point — the old format hid
    // it behind a plausible-looking "₹23700.0L".
    expect(formatTuition(22571429, "GBP")).toBe("£22,571,429");
    expect(tuitionToLakhs(22571429, "GBP")).toBeGreaterThan(20000);

    // And the repaired value reads as a real fee.
    expect(formatTuition(Math.round((22571429 * 105) / 100_000), "GBP")).toBe("£23,700");
  });
});
