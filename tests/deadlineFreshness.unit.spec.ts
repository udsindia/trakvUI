import { describe, expect, test } from "vitest";
import { assessDeadline } from "@/modules/universities/deadlineFreshness";

/**
 * How much to trust a stored deadline.
 *
 * The point of this logic is to stop a stale date reading as fact: a counsellor who
 * trusts "15 March" after the university quietly moved it to 30 April loses an
 * application that would have succeeded. So the cases that matter are the ones where a
 * date is present but should NOT be stated plainly.
 *
 * A fixed "now" throughout — a test that drifts with the wall clock starts failing on a
 * Tuesday in March for no reason anyone can reproduce.
 */
const NOW = new Date("2026-09-19T12:00:00Z");

describe("deadline freshness", () => {
  test("no deadline is rolling admissions, not a gap", () => {
    expect(assessDeadline(null, null, NOW).tone).toBe("none");
    expect(assessDeadline(undefined, undefined, NOW).tone).toBe("none");
    expect(assessDeadline("", null, NOW).tone).toBe("none");
    expect(assessDeadline(null, null, NOW).label).toBe("Rolling");
  });

  test("a date in the past is never shown as something to apply by", () => {
    // The sharpest failure: a passed date rendered plainly reads as "you have until
    // then", which is the opposite of true.
    const verdict = assessDeadline("2026-03-15", "2026-09-19", NOW);

    expect(verdict.tone).toBe("passed");
    expect(verdict.label).toContain("Closed");
    expect(verdict.label).not.toContain("Apply by");
    expect(verdict.note).toBeTruthy();
  });

  test("a passed date stays passed however recently it was confirmed", () => {
    // Confirming an expired deadline does not un-expire it.
    expect(assessDeadline("2026-09-18", "2026-09-19", NOW).tone).toBe("passed");
  });

  test("recently confirmed reads plainly", () => {
    const verdict = assessDeadline("2026-12-01", "2026-09-19", NOW);

    expect(verdict.tone).toBe("fresh");
    expect(verdict.label).toBe("Apply by 2026-12-01");
    expect(verdict.note).toContain("today");
  });

  test("confirmed a couple of months back is flagged but not alarming", () => {
    const verdict = assessDeadline("2026-12-01", "2026-07-05", NOW);

    expect(verdict.tone).toBe("ageing");
    expect(verdict.note).toContain("Confirmed");
  });

  test("not checked in months says so", () => {
    const verdict = assessDeadline("2026-12-01", "2026-01-10", NOW);

    expect(verdict.tone).toBe("stale");
    expect(verdict.note).toContain("check");
  });

  test("never confirmed is treated as stale, not as fresh", () => {
    // A deadline with no confirmation has no evidence behind it. Defaulting it to
    // trustworthy would be the exact failure this feature exists to prevent.
    const verdict = assessDeadline("2026-12-01", null, NOW);

    expect(verdict.tone).toBe("stale");
    expect(verdict.note).toContain("Never confirmed");
  });

  test("an unreadable date degrades to rolling rather than throwing", () => {
    expect(assessDeadline("not-a-date", null, NOW).tone).toBe("none");
  });

  test("an unreadable confirmation date does not make a deadline look fresh", () => {
    expect(assessDeadline("2026-12-01", "rubbish", NOW).tone).toBe("stale");
  });

  test("a deadline due today or tomorrow is not treated as passed", () => {
    // Off-by-one here would hide a deadline on the very day it matters most.
    expect(assessDeadline("2026-09-19", "2026-09-19", NOW).tone).not.toBe("passed");
    expect(assessDeadline("2026-09-20", "2026-09-19", NOW).tone).not.toBe("passed");
  });
});
