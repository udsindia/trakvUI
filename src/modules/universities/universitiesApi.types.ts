export type UniversityType = "PUBLIC" | "PRIVATE" | "RESEARCH_INTENSIVE";

export type StudyLevel =
  | "UNDERGRADUATE"
  | "POSTGRADUATE_TAUGHT"
  | "POSTGRADUATE_RESEARCH"
  | "INTEGRATED_MASTERS"
  | "PHD"
  | "FOUNDATION"
  | "DIPLOMA";

export type RequirementType = "LANGUAGE_TEST" | "DOCUMENT" | "ACADEMIC" | string;

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
  requirementType: RequirementType;
  testType?: LanguageTestType;
  documentName?: string;
  minOverallScore?: number;
  minListening?: number;
  minReading?: number;
  minWriting?: number;
  minSpeaking?: number;
  isMandatory?: boolean;
  courseId?: string | null;
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
}

export interface CreateCoursePayload {
  name: string;
  code: string;
  studyLevel: StudyLevel;
  subjectArea: string;
  durationMonths: number;
  tuitionCurrency: string;
  tuitionAmount: number;
  courseUrl?: string;
}

export interface CreateRequirementPayload {
  courseId?: string | null;
  requirementType: RequirementType;
  testType?: LanguageTestType;
  documentName?: string;
  minOverallScore?: number;
  minListening?: number;
  minReading?: number;
  minWriting?: number;
  minSpeaking?: number;
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
  livingCostCurrency: string | null;
  livingCostAmount: number | null;
  courseStartDate: string | null; // yyyy-MM-dd
  courseEndDate: string | null;   // yyyy-MM-dd
  pgwpEligible: boolean | null;
  scholarshipNote: string | null;
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
 * Two-phase like the course import, but the unit is a university that may carry
 * courses. Only university_name, country_code and university_type are required, so
 * a three-column CSV imports universities on their own.
 */

export interface UniversityImportCourse {
  name: string;
  code: string | null;
  studyLevel: string | null;
  subjectArea: string | null;
  durationMonths: number | null;
  tuitionCurrency: string | null;
  tuitionAmount: number | null;
}

export interface UniversityImportPreviewRow {
  /** Source CSV line numbers — several rows collapse into one university, e.g. "2, 3". */
  rowRef: string;
  name: string;
  countryCode: string;
  city: string | null;
  universityType: string | null;
  qsRanking: number | null;
  website: string | null;
  status: "NEW" | "DUPLICATE";
  existingUniversityId: string | null;
  courses: UniversityImportCourse[];
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
    totalCourses: number;
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
  onDuplicate: UniversityDuplicateAction;
  courses: UniversityImportCourse[];
}

export interface UniversityImportCommitPayload {
  universities: UniversityImportCommitItem[];
}

export interface UniversityImportItemResult {
  name: string;
  countryCode: string;
  action: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
  universityId: string | null;
  coursesCreated: number;
  errors: string[];
}

export interface UniversityImportResultResponse {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  coursesCreated: number;
  results: UniversityImportItemResult[];
}
