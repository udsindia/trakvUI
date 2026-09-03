import { universitiesApi } from "@/modules/universities/universitiesApi";
import {
  defaultUniversityType,
  lakhsToTuitionAmount,
  mapCourseToUi,
  mapUniversityDetailToUi,
  mapUniversitySummaryToUi,
  normalizeWebsiteUrl,
  parseDurationMonths,
  toAlpha3CountryCode,
  toApiStudyLevel,
} from "@/modules/universities/universitiesMappers";
import type { Course, University } from "@/modules/universities/universities.types";
import type {
  AptitudeTestType,
  CreateRequirementPayload,
  TestType,
  UpdateRequirementPayload,
  UniversityRequirementDto,
} from "@/modules/universities/universitiesApi.types";

export type UniversitiesCatalog = {
  courses: Course[];
  universities: University[];
};

export type UniversityInput = Omit<University, "id" | "generalRequirements"> & {
  id?: string;
  generalRequirements?: University["generalRequirements"];
  universityType?: "PUBLIC" | "PRIVATE" | "RESEARCH_INTENSIVE";
};

/**
 * One accepted English-proficiency test for a course. A course may list several —
 * they are stored as separate LANGUAGE_TEST rows in the requirements table, which has
 * always supported many per course.
 */
export type CourseLanguageTest = {
  testType: TestType;
  minOverallScore?: number;
  minListening?: number;
  minReading?: number;
  minWriting?: number;
  minSpeaking?: number;
};

/** One accepted aptitude / entrance test and its cut-off score. */
export type CourseAptitudeTest = {
  testType: AptitudeTestType;
  minOverallScore?: number;
};

/**
 * Academic thresholds on the applicant's highest degree — a bachelor's, for a
 * master's applicant. Saved as a single ACADEMIC requirement row.
 */
export type CourseAcademicRequirement = {
  minGpa?: number;
  gpaScale?: string;
  maxBacklogs?: number;
};

/** Everything the requirements editor produces, for a course or a university default. */
export type RequirementSet = {
  languageTests: CourseLanguageTest[];
  aptitudeTests: CourseAptitudeTest[];
  academic: CourseAcademicRequirement;
};

export const emptyRequirementSet = (): RequirementSet => ({
  languageTests: [],
  aptitudeTests: [],
  academic: {},
});

export function requirementSetIsEmpty(set: RequirementSet): boolean {
  return (
    set.languageTests.length === 0 &&
    set.aptitudeTests.length === 0 &&
    set.academic.minGpa == null &&
    set.academic.maxBacklogs == null
  );
}

/** Flattens the editor's shape into the requirement rows the API expects. */
export function toRequirementPayloads(
  set: RequirementSet,
  courseId: string | null,
): CreateRequirementPayload[] {
  const payloads: CreateRequirementPayload[] = [];

  for (const test of set.languageTests) {
    payloads.push({
      courseId,
      requirementType: "LANGUAGE_TEST",
      testType: test.testType,
      minOverallScore: test.minOverallScore,
      minListening: test.minListening,
      minReading: test.minReading,
      minWriting: test.minWriting,
      minSpeaking: test.minSpeaking,
      isMandatory: true,
    });
  }

  for (const test of set.aptitudeTests) {
    payloads.push({
      courseId,
      requirementType: "APTITUDE_TEST",
      aptitudeTestType: test.testType,
      minOverallScore: test.minOverallScore,
      isMandatory: true,
    });
  }

  // The backend rejects an ACADEMIC row with nothing set, so only send a populated one.
  if (set.academic.minGpa != null || set.academic.maxBacklogs != null) {
    payloads.push({
      courseId,
      requirementType: "ACADEMIC",
      minGpa: set.academic.minGpa,
      gpaScale: set.academic.gpaScale,
      maxBacklogs: set.academic.maxBacklogs,
      isMandatory: true,
    });
  }

  return payloads;
}

/** Rebuilds the editor shape from stored rows — used to prefill from university defaults. */
export function fromRequirementDtos(
  requirements: UniversityRequirementDto[],
): RequirementSet {
  const set = emptyRequirementSet();

  for (const requirement of requirements) {
    if (requirement.requirementType === "LANGUAGE_TEST" && requirement.testType) {
      set.languageTests.push({
        testType: requirement.testType,
        minOverallScore: requirement.minOverallScore ?? undefined,
        minListening: requirement.minListening ?? undefined,
        minReading: requirement.minReading ?? undefined,
        minWriting: requirement.minWriting ?? undefined,
        minSpeaking: requirement.minSpeaking ?? undefined,
      });
    } else if (requirement.requirementType === "APTITUDE_TEST" && requirement.aptitudeTestType) {
      set.aptitudeTests.push({
        testType: requirement.aptitudeTestType,
        minOverallScore: requirement.minOverallScore ?? undefined,
      });
    } else if (requirement.requirementType === "ACADEMIC") {
      set.academic = {
        minGpa: requirement.minGpa ?? undefined,
        gpaScale: requirement.gpaScale ?? undefined,
        maxBacklogs: requirement.maxBacklogs ?? undefined,
      };
    }
  }

  return set;
}

export type CourseInput = Omit<
  Course,
  "id" | "eligibilityStatus" | "eligibilityPercent" | "eligibilityWarning" | "eligibilityHint"
> & {
  id?: string;
  code?: string;
  subjectArea?: string;
  courseUrl?: string;
  /** ISO code the tuition figure is quoted in. Drives the ₹-Lakh conversion. */
  tuitionCurrency?: string;
  /**
   * Requirement rows to create alongside the course. Named distinctly from
   * Course.requirements, which is a flattened display-only list.
   */
  requirementSet?: RequirementSet;
};

export const universitiesCatalogQueryKey = ["universities-catalog"] as const;
export const universityQueryKey = (universityId: string) =>
  ["universities", universityId] as const;
export const universityCoursesQueryKey = (universityId: string) =>
  ["universities", universityId, "courses"] as const;

async function fetchCatalog(): Promise<UniversitiesCatalog> {
  const summaries = await universitiesApi.listAllUniversities();
  const universities = summaries.map((summary) => mapUniversitySummaryToUi(summary));

  const courseResults = await Promise.all(
    summaries.map(async (summary) => {
      const courses = await universitiesApi.listAllUniversityCourses(summary.id);
      return courses.map((course) => mapCourseToUi(course, summary.id));
    }),
  );

  return {
    universities,
    courses: courseResults.flat(),
  };
}

export const universitiesCatalogService = {
  getCatalog: fetchCatalog,

  getUniversities: async (): Promise<University[]> => {
    const summaries = await universitiesApi.listAllUniversities();
    return summaries.map((summary) => mapUniversitySummaryToUi(summary));
  },

  getUniversityById: async (id: string): Promise<University | undefined> => {
    try {
      const detail = await universitiesApi.getUniversity(id);
      return mapUniversityDetailToUi(detail);
    } catch {
      return undefined;
    }
  },

  getCoursesByUniversityId: async (universityId: string): Promise<Course[]> => {
    const courses = await universitiesApi.listAllUniversityCourses(universityId);
    return courses.map((course) => mapCourseToUi(course, universityId));
  },

  getCourseById: async (universityId: string, courseId: string): Promise<Course | undefined> => {
    const courses = await universitiesCatalogService.getCoursesByUniversityId(universityId);
    return courses.find((course) => course.id === courseId);
  },

  saveUniversity: async (input: UniversityInput): Promise<University> => {
    if (input.id) {
      const updated = await universitiesApi.updateUniversity(input.id, {
        name: input.name,
        countryCode: toAlpha3CountryCode(input.countryCode),
        city: input.city,
        website: normalizeWebsiteUrl(input.website),
        universityType: input.universityType ?? defaultUniversityType(),
        qsRanking: input.qsRank,
        // Always sent, so clearing the field in the drawer actually clears the stored note.
        partnerNotes: input.internalNotes ?? "",
      });
      return mapUniversityDetailToUi(updated);
    }

    const created = await universitiesApi.createUniversity({
      name: input.name,
      countryCode: toAlpha3CountryCode(input.countryCode),
      city: input.city,
      website: normalizeWebsiteUrl(input.website),
      universityType: input.universityType ?? defaultUniversityType(),
      qsRanking: input.qsRank,
    });

    return mapUniversityDetailToUi({
      ...created,
      requirements: [],
    });
  },

  /**
   * Writes a university-level default set (course_id = NULL), and optionally pushes the
   * same values onto existing courses.
   *
   * Upserts rather than appends: each entry is matched against the rows already stored
   * for the same scope, and an existing row is PATCHed instead of a second one being
   * created. That is what stops "apply to existing courses" — or simply re-saving the
   * defaults — from leaving a course requiring IELTS twice.
   *
   * Caveat inherited from PATCH: null means "no change", so a value can be overwritten
   * but not cleared. Emptying a band score in the editor leaves the stored one alone.
   */
  saveUniversityDefaults: async (
    universityId: string,
    set: RequirementSet,
    applyToCourseIds: string[] = [],
    existing: UniversityRequirementDto[] = [],
  ): Promise<{ created: number; updated: number; failed: number }> => {
    const scopes: Array<string | null> = [null, ...applyToCourseIds];

    // Key on scope + type + which test it is: that tuple is what "the same requirement"
    // means here. ACADEMIC has no test, so one row per scope.
    const keyOf = (
      courseId: string | null,
      requirementType: string,
      testType?: string | null,
      aptitudeTestType?: string | null,
    ) => [courseId ?? "UNI", requirementType, testType ?? aptitudeTestType ?? ""].join("|");

    const existingByKey = new Map(
      existing
        .filter((requirement) => requirement.id)
        .map((requirement) => [
          keyOf(
            requirement.courseId ?? null,
            requirement.requirementType,
            requirement.testType,
            requirement.aptitudeTestType,
          ),
          requirement,
        ]),
    );

    const creates: CreateRequirementPayload[] = [];
    const updates: Array<{ id: string; payload: UpdateRequirementPayload }> = [];

    for (const scope of scopes) {
      for (const payload of toRequirementPayloads(set, scope)) {
        const match = existingByKey.get(
          keyOf(scope, payload.requirementType, payload.testType, payload.aptitudeTestType),
        );
        if (match?.id) {
          updates.push({
            id: match.id,
            payload: {
              minOverallScore: payload.minOverallScore,
              minListening: payload.minListening,
              minReading: payload.minReading,
              minWriting: payload.minWriting,
              minSpeaking: payload.minSpeaking,
              minGpa: payload.minGpa,
              gpaScale: payload.gpaScale,
              minPercentage: payload.minPercentage,
              maxBacklogs: payload.maxBacklogs,
            },
          });
        } else {
          creates.push(payload);
        }
      }
    }

    const outcomes = await Promise.allSettled([
      ...creates.map((payload) => universitiesApi.createRequirement(universityId, payload)),
      ...updates.map(({ id, payload }) => universitiesApi.updateRequirement(id, payload)),
    ]);

    const failed = outcomes.filter((outcome) => outcome.status === "rejected").length;
    const createdOk = outcomes
      .slice(0, creates.length)
      .filter((outcome) => outcome.status === "fulfilled").length;
    const updatedOk = outcomes
      .slice(creates.length)
      .filter((outcome) => outcome.status === "fulfilled").length;

    return { created: createdOk, updated: updatedOk, failed };
  },

  /** Archives a course by default; `purge` removes it permanently when nothing links to it. */
  deleteCourse: async (courseId: string, purge = false): Promise<void> => {
    await universitiesApi.deleteCourse(courseId, { purge });
  },

  saveCourse: async (input: CourseInput): Promise<Course> => {
    const currency = (input.tuitionCurrency ?? "GBP").toUpperCase();
    const fields = {
      name: input.name,
      code: input.code ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32),
      studyLevel: toApiStudyLevel(input.level),
      subjectArea: input.subjectArea ?? "General",
      durationMonths: parseDurationMonths(input.duration),
      tuitionCurrency: currency,
      tuitionAmount: lakhsToTuitionAmount(input.tuitionLakhs, currency),
      courseUrl: input.courseUrl,
    };

    // An existing id means the drawer was opened on a course — PATCH it. Without this
    // branch every "edit" inserted a second copy of the course.
    const saved = input.id
      ? await universitiesApi.updateCourse(input.id, fields)
      : await universitiesApi.createCourse(input.universityId, fields);
    // PATCH returns a narrower body than POST (no universityId/studyLevel), so the mapper
    // is fed from the values we just sent rather than from the response.
    const created = {
      id: saved.id,
      name: saved.name,
      universityId: input.universityId,
      studyLevel: fields.studyLevel,
      isActive: saved.isActive,
    };

    // Requirements are separate rows, so they can only be written once the course has an
    // id. The course itself is already saved by this point — a failure here must not read
    // as "the course was not saved", hence the explicit partial message.
    //
    // Rows are only ever appended: on an edit the drawer starts with an empty set so an
    // untouched save cannot re-post, and therefore duplicate, what is already stored.
    const payloads = toRequirementPayloads(
      input.requirementSet ?? emptyRequirementSet(),
      created.id,
    );
    if (payloads.length > 0) {
      const outcomes = await Promise.allSettled(
        payloads.map((payload) =>
          universitiesApi.createRequirement(input.universityId, payload),
        ),
      );
      const failed = outcomes.filter((outcome) => outcome.status === "rejected").length;
      if (failed > 0) {
        throw new Error(
          `Course "${created.name}" was ${input.id ? "updated" : "created"}, but ${failed} of ${payloads.length} requirement(s) could not be saved. Add them again from this course.`,
        );
      }
    }

    return mapCourseToUi(created, input.universityId);
  },
};
