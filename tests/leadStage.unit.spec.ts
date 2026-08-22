import { test, expect } from "@playwright/test";
import {
  ENROLLED_STAGE,
  fromBackendLeadStage,
  toBackendLeadStage,
} from "../src/modules/lead/leadStageMappers";
import { LEAD_STAGES } from "../src/modules/lead/components/LeadTableContainer";

test.describe("lead stage mapping", () => {
  test("offers the agreed pipeline in order", () => {
    expect([...LEAD_STAGES]).toEqual([
      "New",
      "Contacted",
      "Qualified",
      "Prospective",
      "Enrolled",
    ]);
  });

  test("Enrolled is stored as CONVERTED", () => {
    // The dashboard conversion-rate JPQL keys off the CONVERTED literal, so the label
    // changed and the stored value deliberately did not.
    expect(toBackendLeadStage(ENROLLED_STAGE)).toBe("CONVERTED");
    expect(fromBackendLeadStage("CONVERTED")).toBe("Enrolled");
  });

  test("Prospective replaces the retired Proposal stage", () => {
    expect(toBackendLeadStage("Prospective")).toBe("PROSPECTIVE");
    expect(fromBackendLeadStage("PROSPECTIVE")).toBe("Prospective");
    // Pre-migration rows must still render rather than showing a raw enum name.
    expect(fromBackendLeadStage("PROPOSAL_SENT")).toBe("Prospective");
  });

  test("round-trips every selectable stage", () => {
    for (const stage of LEAD_STAGES) {
      expect(fromBackendLeadStage(toBackendLeadStage(stage)), stage).toBe(stage);
    }
  });

  test("falls back to New for a missing stage", () => {
    expect(fromBackendLeadStage(null)).toBe("New");
    expect(fromBackendLeadStage(undefined)).toBe("New");
    expect(fromBackendLeadStage("")).toBe("New");
  });

  test("passes through an unknown stage rather than dropping it", () => {
    expect(fromBackendLeadStage("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});
