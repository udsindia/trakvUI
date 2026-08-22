import { test, expect } from "@playwright/test";
import {
  MAX_SOURCE_LENGTH,
  OTHER_SOURCE,
  validateCustomSource,
} from "../src/modules/lead/leadForm.types";
import { leadFormOptions } from "../src/modules/lead/leadForm.options";

const OPTIONS = leadFormOptions.sourceOptions;

test.describe("validateCustomSource", () => {
  test("accepts ordinary source names", () => {
    for (const value of ["Instagram", "Education Fair 2026", "Agent Partner"]) {
      expect(validateCustomSource(value, OPTIONS), value).toBeNull();
    }
  });

  test("accepts the punctuation real source names use", () => {
    // Not "Walk-in" — that is already an option, so it is a duplicate, not a punctuation case.
    for (const value of ["Drop-in Visit", "Facebook / Meta", "Smith & Co (Referral)", "Expo '26"]) {
      expect(validateCustomSource(value, OPTIONS), value).toBeNull();
    }
  });

  test("accepts non-latin scripts, including Indic combining marks", () => {
    // \p{L} alone rejects Devanagari vowel signs — they are marks, not letters.
    expect(validateCustomSource("मेला", OPTIONS)).toBeNull(); // मेला
    expect(validateCustomSource("Реклама", OPTIONS)).toBeNull();
    expect(validateCustomSource("Café Référence", OPTIONS)).toBeNull();
  });

  test("requires a non-blank value", () => {
    expect(validateCustomSource("", OPTIONS)).toBe("Lead source is required.");
    expect(validateCustomSource("   ", OPTIONS)).toBe("Lead source is required.");
  });

  test("enforces the length bounds", () => {
    expect(validateCustomSource("X", OPTIONS)).toBe("Enter at least 2 characters.");
    expect(validateCustomSource("a".repeat(MAX_SOURCE_LENGTH), OPTIONS)).toBeNull();
    expect(validateCustomSource("a".repeat(MAX_SOURCE_LENGTH + 1), OPTIONS)).toBe(
      `Keep it under ${MAX_SOURCE_LENGTH} characters.`,
    );
  });

  test("rejects markup, control characters and pasted junk", () => {
    for (const value of ["<script>alert(1)</script>", "Robert'); DROP TABLE--", "Web\nsite", "a\tb"]) {
      expect(validateCustomSource(value, OPTIONS), value).not.toBeNull();
    }
  });

  test("rejects a duplicate of an existing option, whatever the casing or padding", () => {
    expect(validateCustomSource("Website", OPTIONS)).toContain("already in the list");
    expect(validateCustomSource("wEbSiTe", OPTIONS)).toContain("already in the list");
    expect(validateCustomSource("  Referral  ", OPTIONS)).toContain("already in the list");
  });

  test("rejects the literal word Other", () => {
    // Otherwise the catalogue grows a source named "Other", which says nothing.
    expect(validateCustomSource(OTHER_SOURCE, OPTIONS)).toContain("not \"Other\"");
    expect(validateCustomSource("other", OPTIONS)).toContain("not \"Other\"");
  });

  test("trims before validating and before saving", () => {
    expect(validateCustomSource("  Instagram  ", OPTIONS)).toBeNull();
  });
});
