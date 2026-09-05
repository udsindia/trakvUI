import { test, expect } from "@playwright/test";
import {
  countryDisplayName,
  toAlpha2CountryCode,
  toAlpha3CountryCode,
} from "../src/modules/universities/universitiesMappers";

test.describe("country code folding", () => {
  test("every spelling of one country folds to the same alpha-3", () => {
    // The regression: universities imported before the codes were normalised hold "UK"
    // beside "GBR". Resolving them separately gave two country filter chips, both
    // labelled "UK" — one covering 8 institutions and the other 310.
    for (const value of ["GBR", "gbr", "UK", "uk", "GB", " gb "]) {
      expect(toAlpha3CountryCode(value), value).toBe("GBR");
    }

    for (const value of ["USA", "US", "us"]) {
      expect(toAlpha3CountryCode(value), value).toBe("USA");
    }

    expect(toAlpha3CountryCode("UAE")).toBe("ARE");
  });

  test("one display name per country, whatever the stored code", () => {
    for (const value of ["GBR", "UK", "GB"]) {
      expect(countryDisplayName(value), value).toBe("UK");
    }
    expect(countryDisplayName("USA")).toBe("USA");
    expect(countryDisplayName("US")).toBe("USA");
    expect(countryDisplayName("DEU")).toBe("Germany");
    expect(countryDisplayName("DE")).toBe("Germany");
  });

  test("an unmapped country keeps its code whole", () => {
    // Slicing "ITA" to "IT" matched nothing on the way back, so the chip filtered to
    // an empty list rather than just missing its flag and full name.
    expect(toAlpha3CountryCode("ITA")).toBe("ITA");
    expect(countryDisplayName("ITA")).toBe("ITA");
  });

  test("blank input gives an empty name rather than a stray label", () => {
    expect(countryDisplayName("")).toBe("");
    expect(countryDisplayName(null)).toBe("");
    expect(countryDisplayName(undefined)).toBe("");
  });

  test("alpha-2 folds through the same aliases", () => {
    expect(toAlpha2CountryCode("UK")).toBe("GB");
    expect(toAlpha2CountryCode("GBR")).toBe("GB");
    expect(toAlpha2CountryCode("GB")).toBe("GB");
  });
});
