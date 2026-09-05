import type {
  CourseDto,
  StudyLevel,
  UniversityDetailDto,
  UniversityRequirementDto,
  UniversitySummaryDto,
  UniversityType,
} from "@/modules/universities/universitiesApi.types";
import type {
  Course,
  CourseLevel,
  University,
  UniversityRequirement,
} from "@/modules/universities/universities.types";

const COUNTRY_ALPHA3_TO_UI: Record<string, { alpha2: string; name: string; flag: string }> = {
  GBR: { alpha2: "GB", name: "UK", flag: "🇬🇧" },
  IRL: { alpha2: "IE", name: "Ireland", flag: "🇮🇪" },
  AUS: { alpha2: "AU", name: "Australia", flag: "🇦🇺" },
  CAN: { alpha2: "CA", name: "Canada", flag: "🇨🇦" },
  NZL: { alpha2: "NZ", name: "New Zealand", flag: "🇳🇿" },
  USA: { alpha2: "US", name: "USA", flag: "🇺🇸" },
  SGP: { alpha2: "SG", name: "Singapore", flag: "🇸🇬" },
  CHE: { alpha2: "CH", name: "Switzerland", flag: "🇨🇭" },
  DEU: { alpha2: "DE", name: "Germany", flag: "🇩🇪" },
  FRA: { alpha2: "FR", name: "France", flag: "🇫🇷" },
  JPN: { alpha2: "JP", name: "Japan", flag: "🇯🇵" },
  NLD: { alpha2: "NL", name: "Netherlands", flag: "🇳🇱" },
  SWE: { alpha2: "SE", name: "Sweden", flag: "🇸🇪" },
};

const ALPHA2_TO_ALPHA3: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_ALPHA3_TO_UI).map(([alpha3, value]) => [value.alpha2, alpha3]),
);
const ALPHA3_TO_ALPHA2: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_ALPHA3_TO_UI).map(([alpha3, value]) => [alpha3, value.alpha2]),
);

/**
 * Spellings that are neither alpha-3 nor the alpha-2 of a country above, but still sit in
 * the data: universities imported before the codes were normalised hold "UK" alongside
 * "GBR". Without this they resolve to a country of their own, so one filter chip covers
 * 8 institutions and the other 310. Mirrors CountryNames on the server.
 */
const LEGACY_CODE_ALIASES: Record<string, string> = {
  UK: "GBR",
  UAE: "ARE",
};

/** Any accepted spelling of a country code -> the alpha-3 the rest of the app compares on. */
function toCanonicalAlpha3(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  if (COUNTRY_ALPHA3_TO_UI[normalized]) return normalized;
  return LEGACY_CODE_ALIASES[normalized] ?? ALPHA2_TO_ALPHA3[normalized] ?? normalized;
}

const STUDY_LEVEL_TO_UI: Record<StudyLevel, { level: CourseLevel; label: string }> = {
  UNDERGRADUATE: { level: "undergraduate", label: "Undergraduate" },
  POSTGRADUATE_TAUGHT: { level: "masters", label: "Postgraduate Taught" },
  POSTGRADUATE_RESEARCH: { level: "phd", label: "Postgraduate Research" },
  INTEGRATED_MASTERS: { level: "masters", label: "Integrated Masters" },
  PHD: { level: "phd", label: "PhD" },
  FOUNDATION: { level: "diploma", label: "Foundation" },
  DIPLOMA: { level: "diploma", label: "Diploma" },
};

const UI_LEVEL_TO_STUDY_LEVEL: Record<CourseLevel, StudyLevel> = {
  undergraduate: "UNDERGRADUATE",
  masters: "POSTGRADUATE_TAUGHT",
  phd: "PHD",
  diploma: "DIPLOMA",
};

const CURRENCY_TO_INR_RATE: Record<string, number> = {
  GBP: 105,
  EUR: 90,
  USD: 83,
  AUD: 55,
  CAD: 60,
  INR: 1,
};

function resolveCountry(countryCode: string) {
  const alpha3 = toCanonicalAlpha3(countryCode);
  const mapped = COUNTRY_ALPHA3_TO_UI[alpha3];

  if (mapped) {
    return mapped;
  }

  // Unknown country: keep the code whole rather than slicing "ITA" down to "IT". The
  // sliced form matched nothing on the way back, so a country outside the map above
  // filtered to an empty list instead of just missing its flag and full name.
  return { alpha2: alpha3, name: alpha3, flag: "🏳️" };
}

/**
 * Display name for a stored country code, e.g. "GBR" -> "UK".
 *
 * Data columns hold the code; the name is resolved here and only here, so every screen
 * shows the same wording. Falls back to the raw code for a country not in the map, which
 * is visible enough to notice and fix rather than silently blank.
 */
export function countryDisplayName(countryCode?: string | null): string {
  if (!countryCode) return "";
  return resolveCountry(countryCode).name;
}

export function toAlpha3CountryCode(countryCode: string): string {
  return toCanonicalAlpha3(countryCode);
}

export function toAlpha2CountryCode(countryCode: string): string {
  const normalized = toCanonicalAlpha3(countryCode);
  if (normalized.length === 2) {
    return normalized;
  }

  return ALPHA3_TO_ALPHA2[normalized] ?? normalized;
}

/**
 * Prepends "https://" when a website URL is missing a scheme, so users can type
 * "www.example.com" instead of needing to know the backend's @URL validator
 * requires one. Returns undefined for blank input.
 */
export function normalizeWebsiteUrl(website: string | undefined): string | undefined {
  const trimmed = website?.trim();
  if (!trimmed) {
    return undefined;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function toUiStudyLevel(studyLevel: StudyLevel) {
  return STUDY_LEVEL_TO_UI[studyLevel] ?? { level: "masters" as CourseLevel, label: studyLevel };
}

export function toApiStudyLevel(level: CourseLevel): StudyLevel {
  return UI_LEVEL_TO_STUDY_LEVEL[level];
}

function deriveShortName(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function tuitionToLakhs(amount?: number, currency = "GBP") {
  if (!amount) {
    return 0;
  }

  const rate = CURRENCY_TO_INR_RATE[currency.toUpperCase()] ?? 80;
  return Math.round((amount * rate) / 100_000 * 10) / 10;
}

function formatMoney(amount?: number, currency?: string) {
  if (!amount) {
    return "";
  }

  return `${currency ?? ""} ${amount.toLocaleString()}`.trim();
}

function formatDate(dateStr?: string) {
  if (!dateStr) {
    return "—";
  }

  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function deriveIntakeLabel(courseStartDate?: string) {
  if (!courseStartDate) {
    return "";
  }

  const parsedDate = new Date(courseStartDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return `${parsedDate.toLocaleString("en-US", { month: "short" })} ${parsedDate.getFullYear()}`;
}

function formatAvgCommission(amount?: number | null, currency?: string | null) {
  if (!amount) {
    return "₹0";
  }

  return `${currency ?? "₹"} ${Math.round(amount).toLocaleString()}`.trim();
}

function formatPgwpEligible(pgwpEligible?: boolean | null) {
  if (pgwpEligible === true) {
    return "Yes";
  }
  if (pgwpEligible === false) {
    return "No";
  }
  return "N/A";
}

function formatDuration(durationMonths?: number) {
  if (!durationMonths) {
    return "—";
  }

  if (durationMonths % 12 === 0) {
    const years = durationMonths / 12;
    return years === 1 ? "1 year" : `${years} years`;
  }

  return `${durationMonths} months`;
}

function mapRequirement(
  requirement: UniversityRequirementDto,
  index: number,
): UniversityRequirement {
  const label =
    requirement.requirementType === "LANGUAGE_TEST"
      ? `${requirement.testType?.replace(/_/g, " ") ?? "Language test"}${requirement.minOverallScore ? ` ${requirement.minOverallScore}+` : ""}`
      : requirement.requirementType === "DOCUMENT"
        ? requirement.documentName ?? "Document required"
        : requirement.requirementType.replace(/_/g, " ");

  return {
    id: requirement.id ?? `req-${index}`,
    label,
    detail: requirement.isMandatory === false ? "Optional" : "Mandatory",
    status: "warn",
    studentNote: "",
  };
}

function defaultTrackRecord() {
  return {
    studentsEnrolled: 0,
    visasApproved: 0,
    visaSuccessRate: 0,
    avgApplicationDays: 0,
    avgCommission: "₹0",
  };
}

export function mapUniversitySummaryToUi(
  summary: UniversitySummaryDto,
  requirements: UniversityRequirementDto[] = [],
): University {
  const country = resolveCountry(summary.countryCode);

  return {
    id: summary.id,
    name: summary.name,
    shortName: deriveShortName(summary.name),
    country: country.name,
    countryCode: country.alpha2,
    city: summary.city,
    flag: country.flag,
    founded: 0,
    website: "",
    qsRank: summary.qsRanking,
    courseCount: summary.courseCount,
    about: "",
    trackRecord: defaultTrackRecord(),
    links: [],
    internalNotes: "",
    generalRequirements: requirements.map(mapRequirement),
  };
}

export function mapUniversityDetailToUi(detail: UniversityDetailDto): University {
  const country = resolveCountry(detail.countryCode);
  const requirements = detail.requirements ?? [];

  return {
    id: detail.id,
    name: detail.name,
    shortName: deriveShortName(detail.name),
    country: country.name,
    countryCode: country.alpha2,
    city: detail.city,
    flag: country.flag,
    founded: 0,
    website: detail.website ?? "",
    qsRank: detail.qsRanking,
    courseCount: detail.courseCount,
    about: "",
    trackRecord: defaultTrackRecord(),
    links: detail.website ? [{ label: "University website", url: detail.website }] : [],
    internalNotes: detail.partnerNotes ?? "",
    generalRequirements: requirements.map(mapRequirement),
    requirementDtos: requirements,
  };
}

export function mapCourseToUi(course: CourseDto, universityId: string): Course {
  const { level, label } = toUiStudyLevel(course.studyLevel);
  const ieltsMin =
    course.studyLevel === "UNDERGRADUATE" || course.studyLevel === "DIPLOMA" ? 6.0 : 6.5;

  const applicationFee = formatMoney(course.applicationFeeAmount, course.applicationFeeCurrency);
  const deadline = course.applicationDeadline ? formatDate(course.applicationDeadline) : "";
  const intakeLabel = deriveIntakeLabel(course.courseStartDate);

  return {
    id: course.id,
    universityId: course.universityId ?? universityId,
    name: course.name,
    level,
    levelLabel: label,
    intakes: intakeLabel ? [intakeLabel] : [],
    duration: formatDuration(course.durationMonths),
    tuitionLakhs: tuitionToLakhs(course.tuitionAmount, course.tuitionCurrency),
    ieltsMin,
    ieltsLabel: `IELTS ${ieltsMin}+`,
    applicationFee,
    deadline,
    eligibilityStatus: "eligible",
    curriculum: { semester1: [], semester2: [] },
    requirements: [],
    keyDates: {
      applicationDeadline: deadline,
      rollingAdmissions: !course.applicationDeadline,
      courseStart: formatDate(course.courseStartDate),
      courseEnd: formatDate(course.courseEndDate),
      pgwpEligible: formatPgwpEligible(course.pgwpEligible),
    },
    fees: {
      tuitionPerYear: course.tuitionAmount
        ? `${course.tuitionCurrency ?? ""} ${course.tuitionAmount.toLocaleString()}`.trim()
        : "",
      applicationFee,
      livingCosts: formatMoney(course.livingCostAmount, course.livingCostCurrency),
      scholarshipNote: course.scholarshipNote,
    },
    ourData: {
      studentsSent: course.studentsSent ?? 0,
      accepted: course.accepted ?? 0,
      visaApproved: course.visaApproved ?? 0,
      avgCommission: formatAvgCommission(course.avgCommission, course.commissionCurrency),
    },
  };
}

export function parseDurationMonths(duration: string): number {
  const yearMatch = duration.match(/(\d+(?:\.\d+)?)\s*year/i);
  if (yearMatch) {
    return Math.round(Number(yearMatch[1]) * 12);
  }

  const monthMatch = duration.match(/(\d+)\s*month/i);
  if (monthMatch) {
    return Number(monthMatch[1]);
  }

  return 12;
}

export function lakhsToTuitionAmount(tuitionLakhs: number, currency = "GBP"): number {
  const rate = CURRENCY_TO_INR_RATE[currency.toUpperCase()] ?? 80;
  return Math.round((tuitionLakhs * 100_000) / rate);
}

export function defaultUniversityType(): UniversityType {
  return "PUBLIC";
}
