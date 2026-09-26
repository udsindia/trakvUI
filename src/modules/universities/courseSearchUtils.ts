import type {
  Course,
  CourseSearchFilters,
  CourseSearchResult,
  StudentProfile,
  University,
} from "@/modules/universities/universities.types";
import { computeCourseEligibility } from "@/modules/universities/studentEligibility";
import { toAlpha2CountryCode } from "@/modules/universities/universitiesMappers";

function parseNumericAmount(input: string): number | null {
  const digits = input.replace(/[^\d.]/g, "");
  if (!digits) {
    return null;
  }
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDisciplines(result: CourseSearchResult): string[] {
  const name = result.name.toLowerCase();

  if (name.includes("data")) {
    return ["data-science"];
  }
  if (name.includes("computer") || name.includes("ai") || name.includes("software")) {
    return ["computer-science"];
  }
  if (name.includes("business")) {
    return ["business"];
  }
  return ["general"];
}

function getDeliveryModes(_: CourseSearchResult): string[] {
  return ["in-person"];
}

function getIntakeStatus(result: CourseSearchResult): "open" | "closed" | "waitlist" {
  if (result.deadline.toLowerCase() === "rolling") {
    return "open";
  }

  const visaRatio = result.ourData.studentsSent > 0
    ? result.ourData.accepted / result.ourData.studentsSent
    : 1;

  if (visaRatio < 0.45) {
    return "closed";
  }

  if (visaRatio < 0.75) {
    return "waitlist";
  }

  return "open";
}

function hasPostStudyWorkPermit(result: CourseSearchResult): boolean {
  const text = result.keyDates.pgwpEligible.toLowerCase();
  return text.includes("yes");
}

export function formatTuitionLakhs(value: number) {
  return `₹${value.toFixed(1)}L`;
}

export function buildCourseSearchResults(courses: Course[], universities: University[]): CourseSearchResult[] {
  const universityMap = new Map(universities.map((university) => [university.id, university]));

  return courses
    .map((course) => {
      const university = universityMap.get(course.universityId);
      if (!university) return null;
      return { ...course, university };
    })
    .filter((result): result is CourseSearchResult => result !== null);
}

export function applyStudentEligibility(
  results: CourseSearchResult[],
  student: StudentProfile | null,
): CourseSearchResult[] {
  if (!student) {
    return results;
  }

  return results.map((result) => {
    const eligibility = computeCourseEligibility(result, student);

    return {
      ...result,
      eligibilityStatus: eligibility.eligibilityStatus,
      eligibilityPercent: eligibility.eligibilityPercent,
      eligibilityWarning: eligibility.eligibilityWarning,
      eligibilityHint: eligibility.eligibilityHint,
    };
  });
}

export function filterCourseSearchResults(
  results: CourseSearchResult[],
  filters: CourseSearchFilters,
): CourseSearchResult[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return results.filter((result) => {
    if (normalizedQuery) {
      const haystack = [
        result.name,
        result.university.name,
        result.university.shortName,
        result.university.city,
        result.university.country,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    if (
      filters.countries.length > 0 &&
      !filters.countries.some(
        (countryCode) => toAlpha2CountryCode(countryCode) === toAlpha2CountryCode(result.university.countryCode),
      )
    ) {
      return false;
    }

    if (filters.levels.length > 0 && !filters.levels.includes(result.level)) {
      return false;
    }

    if (
      filters.intakes.length > 0 &&
      !result.intakes.some((intake) => filters.intakes.includes(intake))
    ) {
      return false;
    }

    if (filters.intakeStatuses.length > 0) {
      const status = getIntakeStatus(result);
      if (!filters.intakeStatuses.includes(status)) {
        return false;
      }
    }

    if (
      filters.nearestCity &&
      result.university.city.toLowerCase() !== filters.nearestCity.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.institutions.length > 0 &&
      !filters.institutions.some(
        (institution) => institution.toLowerCase() === result.university.name.toLowerCase(),
      )
    ) {
      return false;
    }

    if (filters.disciplines.length > 0) {
      const disciplines = getDisciplines(result);
      if (!filters.disciplines.some((discipline) => disciplines.includes(discipline))) {
        return false;
      }
    }

    if (filters.durations.length > 0 && !filters.durations.includes(result.duration)) {
      return false;
    }

    if (filters.deliveryModes.length > 0) {
      const modes = getDeliveryModes(result);
      if (!filters.deliveryModes.some((mode) => modes.includes(mode))) {
        return false;
      }
    }

    if (filters.postStudyWorkPermit) {
      const hasPermit = hasPostStudyWorkPermit(result);
      if (filters.postStudyWorkPermit === "yes" && !hasPermit) {
        return false;
      }
      if (filters.postStudyWorkPermit === "no" && hasPermit) {
        return false;
      }
    }

    if (
      result.university.trackRecord.avgApplicationDays < filters.turnaroundRange[0] ||
      result.university.trackRecord.avgApplicationDays > filters.turnaroundRange[1]
    ) {
      return false;
    }

    if (
      result.tuitionLakhs < filters.tuitionRange[0] ||
      result.tuitionLakhs > filters.tuitionRange[1]
    ) {
      return false;
    }

    const applicationFeeAmount = parseNumericAmount(result.applicationFee);
    if (filters.backlogs) {
      const threshold = filters.backlogs === "0" ? 9000 : filters.backlogs === "1-3" ? 12000 : 20000;
      if (applicationFeeAmount !== null && applicationFeeAmount > threshold) {
        return false;
      }
    }

    if (filters.educationGap && filters.educationGap === "0" && result.level === "phd") {
      return false;
    }

    if (
      result.ieltsMin < filters.ieltsRange[0] ||
      result.ieltsMin > filters.ieltsRange[1]
    ) {
      return false;
    }

    if (filters.highestEducationLevel) {
      const levelMatch =
        (filters.highestEducationLevel === "diploma" && result.level === "diploma") ||
        (filters.highestEducationLevel === "bachelor" && result.level === "undergraduate") ||
        (filters.highestEducationLevel === "master" && result.level === "masters") ||
        (filters.highestEducationLevel === "phd" && result.level === "phd");

      if (!levelMatch) {
        return false;
      }
    }

    if (filters.isOnshore && filters.countryOfEducation) {
      const normalizedCountry = filters.countryOfEducation.slice(0, 2).toUpperCase();
      if (toAlpha2CountryCode(result.university.countryCode) !== toAlpha2CountryCode(normalizedCountry)) {
        return false;
      }
    }

    if (filters.eligibleOnly && result.eligibilityStatus === "not-eligible") {
      return false;
    }

    if (filters.matchStudent && result.eligibilityStatus === "not-eligible") {
      return false;
    }

    return true;
  });
}

export function sortCourseSearchResults(
  results: CourseSearchResult[],
  sort: CourseSearchFilters["sort"],
): CourseSearchResult[] {
  const sorted = [...results];

  const byName = (left: CourseSearchResult, right: CourseSearchResult) =>
    left.name.localeCompare(right.name);

  switch (sort) {
    case "tuition-low":
      return sorted.sort((left, right) => {
        const tuitionDiff = left.tuitionLakhs - right.tuitionLakhs;
        return tuitionDiff !== 0 ? tuitionDiff : byName(left, right);
      });
    case "qs-rank":
      return sorted.sort((left, right) => {
        const leftRank = left.university.qsRank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = right.university.qsRank ?? Number.MAX_SAFE_INTEGER;
        const rankDiff = leftRank - rightRank;
        return rankDiff !== 0 ? rankDiff : byName(left, right);
      });
    case "intake":
      return sorted.sort((left, right) => {
        const intakeDiff = (left.intakes[0] ?? "").localeCompare(right.intakes[0] ?? "");
        return intakeDiff !== 0 ? intakeDiff : byName(left, right);
      });
    case "best-match":
    default:
      return sorted.sort((left, right) => {
        const leftScore =
          left.eligibilityPercent ?? (left.eligibilityStatus === "eligible" ? 100 : 0);
        const rightScore =
          right.eligibilityPercent ?? (right.eligibilityStatus === "eligible" ? 100 : 0);
        const scoreDiff = rightScore - leftScore;
        return scoreDiff !== 0 ? scoreDiff : byName(left, right);
      });
  }
}

export function countEligibleCourses(results: CourseSearchResult[]) {
  return results.filter(
    (result) => result.eligibilityStatus === "eligible" || result.eligibilityStatus === "partial",
  ).length;
}

export function getCountryCounts(results: CourseSearchResult[]) {
  return results.reduce<Record<string, number>>((counts, result) => {
    const normalizedCode = toAlpha2CountryCode(result.university.countryCode);
    counts[normalizedCode] = (counts[normalizedCode] ?? 0) + 1;
    return counts;
  }, {});
}
