import { afterEach, describe, expect, test, vi } from "vitest";
import {
  FIELDS_OF_STUDY,
  matchFieldOfStudy,
  mergeFieldsOfStudy,
} from "@/config/universities/fieldsOfStudy";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import {
  emptyRequirementSet,
  universitiesCatalogService,
} from "@/modules/universities/universitiesCatalogService";

describe("field of study suggestions", () => {
  test("a subject already on a course keeps its spelling over the standard one", () => {
    const merged = mergeFieldsOfStudy(["computer science", "Marine Biology"]);

    expect(merged).toContain("computer science");
    expect(merged).not.toContain("Computer Science");
    expect(merged).toContain("Marine Biology");
    expect(merged.length).toBe(FIELDS_OF_STUDY.length + 1);
  });

  test("with nothing stored the standard list still suggests", () => {
    expect(mergeFieldsOfStudy(undefined)).toHaveLength(FIELDS_OF_STUDY.length);
  });
});

describe("pre-selecting the student's field of study", () => {
  const options = [
    { label: "Computer Science", value: "Computer Science" },
    { label: "Business & Management", value: "Business & Management" },
  ];

  test("an exact match, ignoring case, is picked", () => {
    expect(matchFieldOfStudy("  computer science ", options)?.value).toBe("Computer Science");
  });

  test("anything looser is left alone rather than guessed", () => {
    // The lead form's default is "Not Specified", and a partial match would narrow the
    // results to a subject nobody chose.
    expect(matchFieldOfStudy("Not Specified", options)).toBeUndefined();
    expect(matchFieldOfStudy("Computer", options)).toBeUndefined();
    expect(matchFieldOfStudy(undefined, options)).toBeUndefined();
  });
});

describe("saving a course's field of study", () => {
  afterEach(() => vi.restoreAllMocks());

  const base = {
    universityId: "u1",
    name: "MSc Test",
    level: "masters",
    duration: "1 year",
    tuitionCurrency: "GBP",
    requirementSet: emptyRequirementSet(),
  };

  test("a blank subject is left out, not saved as General", async () => {
    // Every course used to be saved as "General", so the finder's Field of Study filter
    // had exactly one option.
    const create = vi
      .spyOn(universitiesApi, "createCourse")
      .mockResolvedValue({ id: "c1", name: "MSc Test", studyLevel: "POSTGRADUATE_TAUGHT" } as never);

    await universitiesCatalogService.saveCourse({ ...base, subjectArea: "  " } as never);

    expect((create.mock.calls[0][1] as { subjectArea?: string }).subjectArea).toBeUndefined();
  });

  test("editing a course without touching its subject does not overwrite it", async () => {
    // A blank on PATCH means "unchanged". Sending "General" replaced imported subjects.
    const update = vi
      .spyOn(universitiesApi, "updateCourse")
      .mockResolvedValue({ id: "c1", name: "MSc Test" } as never);

    await universitiesCatalogService.saveCourse({ ...base, id: "c1" } as never);

    expect((update.mock.calls[0][1] as { subjectArea?: string }).subjectArea).toBeUndefined();
  });

  test("a typed subject is saved trimmed", async () => {
    const create = vi
      .spyOn(universitiesApi, "createCourse")
      .mockResolvedValue({ id: "c1", name: "MSc Test", studyLevel: "POSTGRADUATE_TAUGHT" } as never);

    await universitiesCatalogService.saveCourse({ ...base, subjectArea: " Data Science " } as never);

    expect((create.mock.calls[0][1] as { subjectArea?: string }).subjectArea).toBe("Data Science");
  });
});
