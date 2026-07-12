import type { Course, University } from "@/modules/universities/universities.types";
import { SEED_COURSES, SEED_UNIVERSITIES } from "@/modules/universities/universitiesSeedData";

const STORAGE_KEY = "vutrak.universities.catalog";

export type UniversitiesCatalog = {
  courses: Course[];
  universities: University[];
};

function readStoredCatalog(): UniversitiesCatalog | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as UniversitiesCatalog;
    if (!Array.isArray(parsed.universities) || !Array.isArray(parsed.courses)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCatalog(catalog: UniversitiesCatalog) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}

function createSeedCatalog(): UniversitiesCatalog {
  return {
    universities: structuredClone(SEED_UNIVERSITIES),
    courses: structuredClone(SEED_COURSES),
  };
}

function loadCatalog(): UniversitiesCatalog {
  return readStoredCatalog() ?? createSeedCatalog();
}

function createId(prefix: string, name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}-${slug || Date.now()}`;
}

export type UniversityInput = Omit<University, "id" | "generalRequirements"> & {
  id?: string;
  generalRequirements?: University["generalRequirements"];
};

export type CourseInput = Omit<
  Course,
  "id" | "eligibilityStatus" | "eligibilityPercent" | "eligibilityWarning" | "eligibilityHint"
> & {
  id?: string;
};

function defaultCourseFields(input: CourseInput, id: string): Course {
  return {
    ...input,
    id,
    eligibilityStatus: "eligible",
    requirements: input.requirements ?? [],
    curriculum: input.curriculum ?? { semester1: [], semester2: [] },
    ourData: input.ourData ?? {
      studentsSent: 0,
      accepted: 0,
      visaApproved: 0,
      avgCommission: "₹0",
    },
    keyDates: input.keyDates ?? {
      applicationDeadline: "",
      rollingAdmissions: false,
      courseStart: "",
      courseEnd: "",
      pgwpEligible: "N/A",
    },
    fees: input.fees ?? {
      tuitionPerYear: "",
      applicationFee: input.applicationFee,
      livingCosts: "",
    },
  };
}

function defaultUniversityFields(input: UniversityInput, id: string): University {
  return {
    ...input,
    id,
    generalRequirements: input.generalRequirements ?? [],
    links: input.links ?? [],
    trackRecord: input.trackRecord ?? {
      studentsEnrolled: 0,
      visasApproved: 0,
      visaSuccessRate: 0,
      avgApplicationDays: 0,
      avgCommission: "₹0",
    },
  };
}

export const universitiesCatalogService = {
  getCatalog(): UniversitiesCatalog {
    return loadCatalog();
  },

  resetToSeed(): UniversitiesCatalog {
    const catalog = createSeedCatalog();
    writeCatalog(catalog);
    return catalog;
  },

  getUniversities(): University[] {
    return loadCatalog().universities;
  },

  getCourses(): Course[] {
    return loadCatalog().courses;
  },

  getUniversityById(id: string): University | undefined {
    return loadCatalog().universities.find((university) => university.id === id);
  },

  getCourseById(id: string): Course | undefined {
    return loadCatalog().courses.find((course) => course.id === id);
  },

  getCoursesByUniversityId(universityId: string): Course[] {
    return loadCatalog().courses.filter((course) => course.universityId === universityId);
  },

  saveUniversity(input: UniversityInput): University {
    const catalog = loadCatalog();
    const university = defaultUniversityFields(input, input.id ?? createId("uni", input.name));

    const existingIndex = catalog.universities.findIndex((item) => item.id === university.id);
    if (existingIndex >= 0) {
      catalog.universities[existingIndex] = university;
    } else {
      catalog.universities.push(university);
    }

    writeCatalog(catalog);
    return university;
  },

  deleteUniversity(universityId: string): void {
    const catalog = loadCatalog();
    catalog.universities = catalog.universities.filter((university) => university.id !== universityId);
    catalog.courses = catalog.courses.filter((course) => course.universityId !== universityId);
    writeCatalog(catalog);
  },

  saveCourse(input: CourseInput): Course {
    const catalog = loadCatalog();
    const course = defaultCourseFields(input, input.id ?? createId("course", input.name));

    const existingIndex = catalog.courses.findIndex((item) => item.id === course.id);
    if (existingIndex >= 0) {
      catalog.courses[existingIndex] = course;
    } else {
      catalog.courses.push(course);
    }

    writeCatalog(catalog);
    return course;
  },

  deleteCourse(courseId: string): void {
    const catalog = loadCatalog();
    catalog.courses = catalog.courses.filter((course) => course.id !== courseId);
    writeCatalog(catalog);
  },
};

export const universitiesCatalogQueryKey = ["universities-catalog"] as const;
