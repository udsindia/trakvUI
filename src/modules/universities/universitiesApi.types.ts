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
