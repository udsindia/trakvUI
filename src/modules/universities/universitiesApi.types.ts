export type UniversityType = "PUBLIC" | "PRIVATE" | "RESEARCH_INTENSIVE";

export type StudyLevel =
  | "UNDERGRADUATE"
  | "POSTGRADUATE_TAUGHT"
  | "POSTGRADUATE_RESEARCH"
  | "INTEGRATED_MASTERS"
  | "PHD"
  | "FOUNDATION"
  | "DIPLOMA";

export type RequirementType =
  | "LANGUAGE_TEST"
  | "APTITUDE_TEST"
  | "DOCUMENT"
  | "ACADEMIC"
  | "FINANCIAL"
  | "WORK_EXPERIENCE"
  | "OTHER";

/**
 * English-proficiency tests accepted on a REQUIREMENT. Mirrors the backend TestType
 * enum. Distinct from LanguageTestType below, which is a student's own test record —
 * the two enums have different members and are not interchangeable.
 */
export type TestType =
  | "IELTS_ACADEMIC"
  | "IELTS_GENERAL"
  | "TOEFL_IBT"
  | "PTE_ACADEMIC"
  | "DUOLINGO"
  | "MOI_LETTER"
  | "INTER_ENGLISH"
  | "CAMBRIDGE_C1"
  | "CAMBRIDGE_C2";

/** Aptitude / entrance tests. Backed by its own enum and column server-side. */
export type AptitudeTestType = "GRE" | "GMAT" | "SAT" | "DMAT";

/** A student's recorded language test — NOT valid on a requirement. */
export type LanguageTestType = "IELTS_ACADEMIC" | "IELTS_UKVI" | "TOEFL_IBT" | string;

export interface UniversitiesPageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface CountryDto {
  code: string;
  name: string;
}

export interface UniversitySummaryDto {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  qsRanking?: number;
  universityType?: UniversityType;
  isPreferredPartner?: boolean;
  courseCount?: number;
}

export interface UniversityRequirementDto {
  id?: string;
  /** null → a university-level default, copied into new courses as a starting point. */
  courseId?: string | null;
  requirementType: RequirementType;
  testType?: TestType | null;
  aptitudeTestType?: AptitudeTestType | null;
  minOverallScore?: number | null;
  minListening?: number | null;
  minReading?: number | null;
  minWriting?: number | null;
  minSpeaking?: number | null;
  minGpa?: number | null;
  gpaScale?: string | null;
  minPercentage?: number | null;
  maxBacklogs?: number | null;
  documentName?: string | null;
  isMandatory?: boolean;
  isTenantOverride?: boolean;
}

export interface UniversityDetailDto {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  website?: string;
  universityType?: UniversityType;
  qsRanking?: number;
  isActive?: boolean;
  isPreferredPartner?: boolean;
  courseCount?: number;
  /** The tenant's own note on this university — shown as "Internal notes" in the UI. */
  partnerNotes?: string | null;
  requirements?: UniversityRequirementDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDto {
  id: string;
  name: string;
  code?: string;
  studyLevel: StudyLevel;
  subjectArea?: string;
  durationMonths?: number;
  tuitionCurrency?: string;
  tuitionAmount?: number;
  courseUrl?: string;
  isActive?: boolean;
  universityId?: string;
  createdAt?: string;
  intakeAvailable?: boolean;
  applicationDeadline?: string;
  deadlineDaysRemaining?: number;
  applicationFeeCurrency?: string;
  applicationFeeAmount?: number;
  livingCostCurrency?: string;
  livingCostAmount?: number;
  courseStartDate?: string;
  courseEndDate?: string;
  pgwpEligible?: boolean | null;
  scholarshipNote?: string;
  studentsSent?: number;
  accepted?: number;
  visaApproved?: number;
  avgCommission?: number | null;
  commissionCurrency?: string | null;
}

export interface UniversityCoursesPageResponse {
  universityId: string;
  content: CourseDto[];
  totalElements: number;
  page: number;
  size: number;
}

export interface ListUniversitiesParams {
  q?: string;
  countryCode?: string;
  type?: UniversityType;
  preferredOnly?: boolean;
  qsRankingMax?: number;
  page?: number;
  size?: number;
}

export interface ListUniversityCoursesParams {
  studyLevel?: StudyLevel;
  subjectArea?: string;
  intakeMonth?: string;
  intakeYear?: number;
  availableOnly?: boolean;
  page?: number;
  size?: number;
}

export interface CreateUniversityPayload {
  name: string;
  countryCode: string;
  city: string;
  website?: string;
  universityType: UniversityType;
  qsRanking?: number;
}

export interface UpdateUniversityPayload {
  name?: string;
  countryCode?: string;
  city?: string;
  website?: string;
  universityType?: UniversityType;
  qsRanking?: number;
  isActive?: boolean;
  /** "" clears the note; omit the field to leave it unchanged. */
  partnerNotes?: string;
}

/**
 * Only name and studyLevel are required by the API. The rest are optional so a course can
 * be added inline from the application form, where tuition and duration are not known —
 * and because the backend rejects a non-positive durationMonths/tuitionAmount, sending a
 * placeholder zero is worse than omitting the field.
 */
export interface CreateCoursePayload {
  name: string;
  studyLevel: StudyLevel;
  code?: string;
  subjectArea?: string;
  durationMonths?: number;
  tuitionCurrency?: string;
  tuitionAmount?: number;
  courseUrl?: string;
}

/**
 * PATCH /admin/courses/{id} — partial update. Any field left out is "no change",
 * so only send what actually differs.
 */
export type UpdateCoursePayload = Partial<CreateCoursePayload> & {
  isActive?: boolean;
};

export interface CreateRequirementPayload {
  courseId?: string | null;
  requirementType: RequirementType;
  testType?: TestType;
  aptitudeTestType?: AptitudeTestType;
  documentName?: string;
  minOverallScore?: number;
  minListening?: number;
  minReading?: number;
  minWriting?: number;
  minSpeaking?: number;
  minGpa?: number;
  gpaScale?: string;
  minPercentage?: number;
  maxBacklogs?: number;
  isMandatory?: boolean;
}

export interface CreatedUniversityDto {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatedCourseDto {
  id: string;
  name: string;
  universityId: string;
  studyLevel: StudyLevel;
  isActive: boolean;
  createdAt: string;
}

/** PATCH /admin/courses/{id} returns a narrower shape than the create endpoint. */
export interface UpdatedCourseDto {
  id: string;
  name: string;
  tuitionAmount: number | null;
  isActive: boolean;
  updatedAt: string;
}

/**
 * PATCH /admin/requirements/{id}. Null means "no change", so a value can be
 * overwritten but NOT cleared through this endpoint.
 */
export interface UpdateRequirementPayload {
  minOverallScore?: number;
  minListening?: number;
  minReading?: number;
  minWriting?: number;
  minSpeaking?: number;
  minGpa?: number;
  gpaScale?: string;
  minPercentage?: number;
  maxBacklogs?: number;
  isMandatory?: boolean;
  notes?: string;
}

export interface CreatedRequirementDto {
  id: string;
  universityId: string;
  courseId: string | null;
  requirementType: RequirementType;
  testType?: LanguageTestType;
  minOverallScore?: number;
  isMandatory: boolean;
  createdAt: string;
}

// ── Course bulk import (preview → commit) ─────────────────────────────────────

export interface CourseImportFields {
  universityName: string;
  countryCode: string;
  courseName: string;
  code: string | null;
  studyLevel: StudyLevel | null;
  subjectArea: string | null;
  durationMonths: number | null;
  tuitionCurrency: string | null;
  tuitionAmount: number | null;
  courseUrl: string | null;
  applicationFeeCurrency: string | null;
  applicationFeeAmount: number | null;
  courseStartDate: string | null; // yyyy-MM-dd
  courseEndDate: string | null;   // yyyy-MM-dd
  pgwpEligible: boolean | null;
  scholarshipNote: string | null;
  intakeMonth: string | null;
  intakeYear: number | null;
  intakeAvailable: boolean | null;
  applicationDeadline: string | null; // yyyy-MM-dd
  // ── Eligibility. null means the test is not accepted. ──
  ieltsOverall: number | null;
  /** One minimum applied to all four IELTS bands. */
  ieltsPerBand: number | null;
  toeflOverall: number | null;
  pteOverall: number | null;
  duolingoOverall: number | null;
  interEnglishOverall: number | null;
  /** MOI is a waiver, not a score. */
  moiAccepted: boolean | null;
  greScore: number | null;
  gmatScore: number | null;
  satScore: number | null;
  dmatScore: number | null;
  minGpa: number | null;
  gpaScale: string | null;
  maxBacklogs: number | null;
}

export interface CourseImportPreviewRow extends CourseImportFields {
  line: number;
  universityId: string;
  status: "NEW" | "DUPLICATE";
  existingCourseId: string | null;
  /**
   * Optional cells the backend could not parse. The row still imports — these name the
   * values that were dropped, so the user can fix the source file if they care.
   */
  warnings?: string[];
}

export interface CourseImportInvalidRow {
  line: number;
  values: Record<string, string | null>;
  errors: string[];
}

export interface CourseImportPreviewResponse {
  totalRows: number;
  summary: {
    newCourses: number;
    duplicateCourses: number;
    invalidRows: number;
  };
  courses: CourseImportPreviewRow[];
  invalidRows: CourseImportInvalidRow[];
}

export interface CourseImportCommitItem extends CourseImportFields {
  universityId: string;
  onDuplicate: "SKIP" | "CREATE";
}

export interface CourseImportCommitPayload {
  courses: CourseImportCommitItem[];
}

export interface CourseImportItemResult {
  universityName: string;
  countryCode: string;
  name: string;
  action: "CREATED" | "SKIPPED" | "FAILED";
  courseId: string | null;
  errors: string[];
}

export interface CourseImportResultResponse {
  created: number;
  skipped: number;
  failed: number;
  results: CourseImportItemResult[];
}

/* ── University import ──────────────────────────────────────────────────────
 * Two-phase like the course import. Universities only — courses have their own
 * importer, so this one never creates them.
 */

export interface UniversityImportPreviewRow {
  /** Source CSV line numbers — several rows collapse into one university, e.g. "2, 3". */
  rowRef: string;
  name: string;
  countryCode: string;
  city: string | null;
  universityType: string | null;
  qsRanking: number | null;
  website: string | null;
  /** Living cost belongs to the place, so it is held here rather than per course. */
  livingCostCurrency: string | null;
  livingCostAmount: number | null;
  status: "NEW" | "DUPLICATE";
  existingUniversityId: string | null;
  /**
   * Optional cells that could not be parsed, plus any course that had to be skipped.
   * The university still imports. Each entry is prefixed with its source line, since
   * one university may span several rows.
   */
  warnings?: string[];
}

export interface UniversityImportInvalidRow {
  line: number;
  values: Record<string, string | null>;
  errors: string[];
}

export interface UniversityImportPreviewResponse {
  totalRows: number;
  summary: {
    newUniversities: number;
    duplicateUniversities: number;
    invalidRows: number;
  };
  universities: UniversityImportPreviewRow[];
  invalidRows: UniversityImportInvalidRow[];
}

export type UniversityDuplicateAction = "SKIP" | "UPDATE" | "CREATE";

export interface UniversityImportCommitItem {
  name: string;
  countryCode: string;
  city: string | null;
  universityType: string | null;
  qsRanking: number | null;
  website: string | null;
  livingCostCurrency: string | null;
  livingCostAmount: number | null;
  onDuplicate: UniversityDuplicateAction;
}

export interface UniversityImportCommitPayload {
  universities: UniversityImportCommitItem[];
}

export interface UniversityImportItemResult {
  name: string;
  countryCode: string;
  action: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
  universityId: string | null;
  errors: string[];
}

export interface UniversityImportResultResponse {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: UniversityImportItemResult[];
}
