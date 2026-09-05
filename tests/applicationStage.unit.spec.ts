import { test, expect } from "@playwright/test";
import { applicationStageLabel, mapOutcomeToStage } from "../src/modules/applications/applicationStage";

test.describe("applicationStageLabel", () => {
  test("shows the stage the application has actually reached", () => {
    // The regression: outcome is IN_PROGRESS from creation until the application closes,
    // so deriving the label from it alone showed "Processing" for every open application
    // regardless of whether it was at Documents Verified or Visa Received.
    expect(
      applicationStageLabel({ currentStageName: "Documents Verified", outcome: "IN_PROGRESS" }),
    ).toBe("Documents Verified");

    expect(
      applicationStageLabel({ currentStageName: "Visa Received", outcome: "ENROLLED" }),
    ).toBe("Visa Received");
  });

  test("falls back to the outcome only when there are no stages", () => {
    expect(applicationStageLabel({ outcome: "IN_PROGRESS" })).toBe("Processing");
    expect(applicationStageLabel({ currentStageName: null, outcome: "IN_PROGRESS" })).toBe("Processing");
    expect(applicationStageLabel({ currentStageName: "   ", outcome: "IN_PROGRESS" })).toBe("Processing");
  });

  test("a blank application reads as Draft rather than empty", () => {
    expect(applicationStageLabel({})).toBe("Draft");
  });
});

test.describe("mapOutcomeToStage", () => {
  test("covers every value of the server's ApplicationOutcome enum", () => {
    // These five used to fall through to "Draft", so a withdrawn or rejected application
    // was indistinguishable from one nobody had started.
    expect(mapOutcomeToStage("OFFER_ACCEPTED")).toBe("Offer Accepted");
    expect(mapOutcomeToStage("ENROLLED")).toBe("Enrolled");
    expect(mapOutcomeToStage("OFFER_DECLINED")).toBe("Offer Declined");
    expect(mapOutcomeToStage("WITHDRAWN")).toBe("Withdrawn");
    expect(mapOutcomeToStage("REJECTED")).toBe("Rejected");
    expect(mapOutcomeToStage("IN_PROGRESS")).toBe("Processing");
    expect(mapOutcomeToStage("VISA_REJECTED")).toBe("Visa Rejected");
  });

  test("an unknown outcome reads as itself, not as Draft", () => {
    expect(mapOutcomeToStage("DEFERRED_TO_NEXT_INTAKE")).toBe("Deferred To Next Intake");
  });

  test("only a missing outcome is Draft", () => {
    expect(mapOutcomeToStage(null)).toBe("Draft");
    expect(mapOutcomeToStage(undefined)).toBe("Draft");
    expect(mapOutcomeToStage("")).toBe("Draft");
  });
});
