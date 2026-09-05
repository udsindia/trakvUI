import { test, expect } from "@playwright/test";
import { joinPhoneNumber, splitPhoneNumber } from "../src/shared/utils/phone";

test.describe("splitPhoneNumber", () => {
  test("keeps the whole local number for an Indian mobile", () => {
    // The regression: /^(\+\d{1,3})(.+)$/ took "+918" and left "012380123".
    expect(splitPhoneNumber("+918012380123")).toEqual({
      countryCode: "+91",
      phoneNo: "8012380123",
    });
    expect(splitPhoneNumber("+919704356075")).toEqual({
      countryCode: "+91",
      phoneNo: "9704356075",
    });
  });

  test("ignores spaces, dashes and brackets", () => {
    for (const value of ["+91 80123 80123", "+91-8012380123", "+91 (80123) 80123"]) {
      expect(splitPhoneNumber(value), value).toEqual({
        countryCode: "+91",
        phoneNo: "8012380123",
      });
    }
  });

  test("handles 1-, 2-, 3- and 4-digit dial codes", () => {
    expect(splitPhoneNumber("+14155552671").countryCode).toBe("+1");
    expect(splitPhoneNumber("+442071838750").countryCode).toBe("+44");
    expect(splitPhoneNumber("+35315896000").countryCode).toBe("+353");
    expect(splitPhoneNumber("+12468121234").countryCode).toBe("+1246");
  });

  test("falls back to the default code when none is given", () => {
    expect(splitPhoneNumber("8012380123")).toEqual({
      countryCode: "+91",
      phoneNo: "8012380123",
    });
    expect(splitPhoneNumber("8012380123", "+44").countryCode).toBe("+44");
  });

  test("never swallows digits it cannot attribute to a code", () => {
    // "+999…" is not a dial code — the digits stay in the local part.
    expect(splitPhoneNumber("+9991234567").phoneNo).toBe("9991234567");
    expect(splitPhoneNumber("")).toEqual({ countryCode: "+91", phoneNo: "" });
  });

  test("round-trips through join without drifting", () => {
    const first = splitPhoneNumber("+918012380123");
    const second = splitPhoneNumber(joinPhoneNumber(first.countryCode, first.phoneNo));
    // Editing and re-saving a lead used to move a digit into the country code each time.
    expect(second).toEqual(first);
  });
});

test.describe("joinPhoneNumber", () => {
  test("joins a dial code onto a local number", () => {
    expect(joinPhoneNumber("+91", "8012380123")).toBe("+91 8012380123");
  });

  test("does not add a second dial code to a number that already has one", () => {
    // The regression: students created from leads carry the code in both columns, so
    // every screen that joined them showed "+91 +91 9988998800" -- and the lead form,
    // which seeds its phone field from this, would have saved that back.
    expect(joinPhoneNumber("+91", "+91 9988998800")).toBe("+91 9988998800");
    expect(joinPhoneNumber("+91", "+919988998800")).toBe("+919988998800");
    expect(joinPhoneNumber("+1", "+1 5551234567")).toBe("+1 5551234567");
  });

  test("drops blank parts rather than leaving a stray space", () => {
    expect(joinPhoneNumber("+91", "")).toBe("+91");
    expect(joinPhoneNumber("", "8012380123")).toBe("8012380123");
    expect(joinPhoneNumber(null, undefined)).toBe("");
  });
});
