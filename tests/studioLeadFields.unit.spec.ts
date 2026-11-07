import { describe, expect, test } from "vitest";
import { STUDIO_LEAD_STAGES, leadStagesFor, LEAD_STAGES } from "../src/modules/lead/components/LeadTableContainer";
import { fromBackendLeadStage, toBackendLeadStage } from "../src/modules/lead/leadStageMappers";
import { buildCreateLeadPayload, mapLeadDetailsToFormValues } from "../src/modules/lead/useLeadFormController";
import type { LeadDetails } from "../src/modules/lead/leadApi";
import {
  describeRequirement,
  interestLevelOption,
  INTEREST_LEVELS,
  SERVICE_REQUIREMENTS,
} from "../src/modules/lead/studioLeadFields";

describe("studio pipeline", () => {
  test("a studio has its own five stages, an agency keeps its own", () => {
    expect([...leadStagesFor(true)]).toEqual(["New", "Contacted", "Quoted", "Booked", "Lost"]);
    expect(leadStagesFor(false)).toBe(LEAD_STAGES);
  });

  test("every studio stage round-trips through the stored value", () => {
    for (const stage of STUDIO_LEAD_STAGES) {
      expect(fromBackendLeadStage(toBackendLeadStage(stage), true)).toBe(stage);
    }
    expect(toBackendLeadStage("Quoted")).toBe("QUOTED");
    expect(toBackendLeadStage("Lost")).toBe("LOST");
  });
});

describe("studio lead fields", () => {
  test("interest levels match the backend's names, weakest first", () => {
    expect(INTEREST_LEVELS.map((level) => level.value)).toEqual(["CASUAL_ENQUIRY", "PROSPECTIVE", "INTERESTED"]);
    expect(interestLevelOption("INTERESTED")?.label).toBe("Interested");
    expect(interestLevelOption(null)).toBeNull();
    expect(interestLevelOption("HOT")).toBeNull();
  });

  test("the requirement suggestions are the studio's offerings, as the chat names them", () => {
    expect([...SERVICE_REQUIREMENTS]).toEqual([
      "Shoot only",
      "Shoot + Anchor",
      "Shoot + Anchor + Editing",
      "Outdoor shoot",
    ]);
  });

  test("the list shows requirement and frequency together, or whichever is known", () => {
    expect(describeRequirement("Shoot + Anchor", "RECURRING")).toBe("Shoot + Anchor · Recurring");
    expect(describeRequirement("Outdoor shoot", null)).toBe("Outdoor shoot");
    expect(describeRequirement("  ", "ONE_TIME")).toBe("One-time");
    expect(describeRequirement(null, null)).toBeNull();
  });

  test("the form round-trips the studio fields and sends blanks so clearing works", () => {
    const lead = {
      id: "l1",
      firstName: "Asha",
      lastName: "Rao",
      email: "",
      phone: "9876543210",
      phoneCountryCode: "+91",
      leadStage: "QUOTED",
      interestLevel: "PROSPECTIVE",
      serviceRequirement: "Shoot + Anchor",
      bookingFrequency: "RECURRING",
    } as unknown as LeadDetails;
    const values = mapLeadDetailsToFormValues(lead);
    expect(values.interestLevel).toBe("PROSPECTIVE");
    expect(values.serviceRequirement).toBe("Shoot + Anchor");
    expect(values.bookingFrequency).toBe("RECURRING");

    const cleared = buildCreateLeadPayload({ ...values, serviceRequirement: "  ", bookingFrequency: "" });
    expect(cleared.serviceRequirement).toBe("");
    expect(cleared.bookingFrequency).toBe("");
    expect(cleared.interestLevel).toBe("PROSPECTIVE");
  });
});
