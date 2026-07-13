import { universitiesApi } from "@/modules/universities/universitiesApi";
import {
  defaultUniversityType,
  lakhsToTuitionAmount,
  mapCourseToUi,
  mapUniversityDetailToUi,
  mapUniversitySummaryToUi,
  parseDurationMonths,
  toAlpha3CountryCode,
  toApiStudyLevel,
} from "@/modules/universities/universitiesMappers";
import type { Course, University } from "@/modules/universities/universities.types";

export type UniversitiesCatalog = {
  courses: Course[];
  universities: University[];
};

export type UniversityInput = Omit<University, "id" | "generalRequirements"> & {
  id?: string;
  generalRequirements?: University["generalRequirements"];
  universityType?: "PUBLIC" | "PRIVATE" | "RESEARCH_INTENSIVE";
};

export type CourseInput = Omit<
  Course,
  "id" | "eligibilityStatus" | "eligibilityPercent" | "eligibilityWarning" | "eligibilityHint"
> & {
  id?: string;
  code?: string;
  subjectArea?: string;
  courseUrl?: string;
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
        website: input.website || undefined,
        universityType: input.universityType ?? defaultUniversityType(),
        qsRanking: input.qsRank,
      });
      return mapUniversityDetailToUi(updated);
    }

    const created = await universitiesApi.createUniversity({
      name: input.name,
      countryCode: toAlpha3CountryCode(input.countryCode),
      city: input.city,
      website: input.website || undefined,
      universityType: input.universityType ?? defaultUniversityType(),
      qsRanking: input.qsRank,
    });

    return mapUniversityDetailToUi({
      ...created,
      requirements: [],
    });
  },

  saveCourse: async (input: CourseInput): Promise<Course> => {
    const currency = "GBP";
    const created = await universitiesApi.createCourse(input.universityId, {
      name: input.name,
      code: input.code ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32),
      studyLevel: toApiStudyLevel(input.level),
      subjectArea: input.subjectArea ?? "General",
      durationMonths: parseDurationMonths(input.duration),
      tuitionCurrency: currency,
      tuitionAmount: lakhsToTuitionAmount(input.tuitionLakhs, currency),
      courseUrl: input.courseUrl,
    });

    return mapCourseToUi(
      {
        id: created.id,
        name: created.name,
        studyLevel: created.studyLevel,
        universityId: created.universityId,
        isActive: created.isActive,
      },
      input.universityId,
    );
  },
};
