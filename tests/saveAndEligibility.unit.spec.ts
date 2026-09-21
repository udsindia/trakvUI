import { afterEach, describe, expect, test, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { mapEligibility } from "@/modules/universities/pages/CourseSearchPage";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import { universitiesCatalogService } from "@/modules/universities/universitiesCatalogService";
import { emptyRequirementSet } from "@/modules/universities/universitiesCatalogService";

/** A 400 shaped the way GlobalExceptionHandler writes one. */
function validationError(errors: string[]) {
  return new AxiosError("Request failed with status code 400", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { status: 400, error: "VALIDATION_ERROR", message: "Request validation failed", errors },
  });
}

describe("server error messages", () => {
  test("a validation failure names the field and the problem", () => {
    // What a course saved with no fee produced. The toast used to read "Request failed
    // with status code 400" while the server was naming the exact field.
    const message = getApiErrorMessage(
      validationError(["tuitionAmount: tuitionAmount must be a positive number"]),
    );

    expect(message).toBe("Tuition amount must be a positive number");
  });

  test("a message that does not repeat the field gets the field prepended", () => {
    expect(getApiErrorMessage(validationError(["name: must not be blank"]))).toBe(
      "Name must not be blank",
    );
  });

  test("several failures are all reported", () => {
    const message = getApiErrorMessage(
      validationError([
        "name: must not be blank",
        "durationMonths: durationMonths must be a positive number",
      ]),
    );

    expect(message).toBe("Name must not be blank. Duration months must be a positive number");
  });

  test("the generic line is never preferred over the field list", () => {
    expect(getApiErrorMessage(validationError(["name: must not be blank"]))).not.toContain(
      "Request validation failed",
    );
  });
});

describe("saving a course with no fee", () => {
  afterEach(() => vi.restoreAllMocks());

  test("a blank fee is left out rather than sent as zero", async () => {
    // CreateCourseRequest has @Positive on tuitionAmount. Sending 0 for "no fee" meant any
    // course saved without one was refused — the fee is optional, the zero was not.
    const create = vi
      .spyOn(universitiesApi, "createCourse")
      .mockResolvedValue({ id: "c1", name: "MSc Test", studyLevel: "POSTGRADUATE_TAUGHT" } as never);

    await universitiesCatalogService.saveCourse({
      universityId: "u1",
      name: "MSc Test",
      level: "masters",
      duration: "1 year",
      tuitionCurrency: "GBP",
      tuitionAmount: 0,
      requirementSet: emptyRequirementSet(),
    } as never);

    const fields = create.mock.calls[0][1] as { tuitionAmount?: number };
    expect(fields.tuitionAmount).toBeUndefined();
  });

  test("a real fee is sent as typed", async () => {
    const create = vi
      .spyOn(universitiesApi, "createCourse")
      .mockResolvedValue({ id: "c1", name: "MSc Test", studyLevel: "POSTGRADUATE_TAUGHT" } as never);

    await universitiesCatalogService.saveCourse({
      universityId: "u1",
      name: "MSc Test",
      level: "masters",
      duration: "1 year",
      tuitionCurrency: "GBP",
      tuitionAmount: 23700,
      requirementSet: emptyRequirementSet(),
    } as never);

    expect((create.mock.calls[0][1] as { tuitionAmount?: number }).tuitionAmount).toBe(23700);
  });
});

describe("eligibility badge", () => {
  test("a course the student cannot get into says so", () => {
    // The server's enum is INELIGIBLE. This compared against NOT_ELIGIBLE, so every
    // ineligible course fell through to "Eligible with notes".
    const mapped = mapEligibility({
      status: "INELIGIBLE",
      met: [],
      gaps: ["English: needs IELTS ACADEMIC 6.5 or MOI LETTER"],
    });

    expect(mapped.eligibilityStatus).toBe("not-eligible");
    expect(mapped.eligibilityHint).toContain("IELTS ACADEMIC 6.5 or MOI LETTER");
  });

  test("an eligible course is eligible", () => {
    expect(mapEligibility({ status: "ELIGIBLE", met: ["English: MOI LETTER"], gaps: [] }).eligibilityStatus)
      .toBe("eligible");
  });

  test("nothing assessed is labelled as such, not as a soft pass", () => {
    // UNKNOWN means the course stated no mandatory requirement, so nothing was checked.
    const mapped = mapEligibility({ status: "UNKNOWN", met: [], gaps: [] });

    expect(mapped.eligibilityLabel).toBe("Not assessed");
    expect(mapped.eligibilityPercent).toBeUndefined();
  });
});
