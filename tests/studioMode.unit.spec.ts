import { describe, expect, test } from "vitest";
import { defaultTenantModules, tenantModulesForIndustry } from "../src/config/modules/modules";
import { fromBackendLeadStage, toBackendLeadStage } from "../src/modules/lead/leadStageMappers";

describe("tenantModulesForIndustry", () => {
  test("a studio loses the education modules and keeps the rest", () => {
    const modules = tenantModulesForIndustry({
      students: false,
      applications: false,
      commissions: false,
      universities: false,
      bookings: true,
    });
    expect(modules.students).toBe(false);
    expect(modules.applications).toBe(false);
    expect(modules.commissions).toBe(false);
    expect(modules.universities).toBe(false);
    expect(modules["universities-browse"]).toBe(false);
    expect(modules.lead).toBe(true);
    expect(modules.activities).toBe(true);
    expect(modules.settings).toBe(true);
    expect(modules.bookings).toBe(true);
  });

  test("an agency never sees Bookings", () => {
    expect(tenantModulesForIndustry({ students: true, bookings: false }).bookings).toBe(false);
    expect(defaultTenantModules.bookings).toBe(false);
  });

  test("no flags from the backend leaves every module at its default", () => {
    expect(tenantModulesForIndustry(undefined)).toEqual(defaultTenantModules);
    expect(tenantModulesForIndustry({})).toEqual(defaultTenantModules);
  });
});

describe("studio lead stages", () => {
  test("CONVERTED reads as Booked for a studio and Enrolled for an agency", () => {
    expect(fromBackendLeadStage("CONVERTED", true)).toBe("Booked");
    expect(fromBackendLeadStage("CONVERTED")).toBe("Enrolled");
    expect(fromBackendLeadStage("CONTACTED", true)).toBe("Contacted");
  });

  test("Booked is stored as CONVERTED", () => {
    expect(toBackendLeadStage("Booked")).toBe("CONVERTED");
  });
});
