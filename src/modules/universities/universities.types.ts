export type CourseLevel = "undergraduate" | "masters" | "phd" | "diploma";

export type EligibilityStatus = "eligible" | "partial" | "not-eligible";

export type RequirementStatus = "met" | "warn" | "miss";

export interface StudentProfile {
  id: string;
  name: string;
  ieltsOverall: number;
  ieltsWriting: number;
  ieltsSpeaking: number;
  degree: string;
  university: string;
  percentage: number;
}

export interface UniversityLink {
  label: string;
  url: string;
}

export interface UniversityTrackRecord {
  studentsEnrolled: number;
  visasApproved: number;
  visaSuccessRate: number;
  avgApplicationDays: number;
  avgCommission: string;
}

export interface UniversityRequirement {
  id: string;
  label: string;
  detail?: string;
  status: RequirementStatus;
  studentNote: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
  city: string;
  flag: string;
  founded: number;
  website: string;
  qsRank?: number;
  about: string;
  trackRecord: UniversityTrackRecord;
  links: UniversityLink[];
  internalNotes: string;
  generalRequirements: UniversityRequirement[];
}

export interface CourseKeyDates {
  applicationDeadline: string;
  rollingAdmissions: boolean;
  courseStart: string;
  courseEnd: string;
  pgwpEligible: string;
}

export interface CourseFees {
  tuitionPerYear: string;
  applicationFee: string;
  livingCosts: string;
  scholarship?: string;
  scholarshipNote?: string;
}

export interface CourseOurData {
  studentsSent: number;
  accepted: number;
  visaApproved: number;
  avgCommission: string;
}

export interface CourseRequirement {
  id: string;
  label: string;
  detail: string;
  status: RequirementStatus;
  statusLabel: string;
}

export interface Course {
  id: string;
  universityId: string;
  name: string;
  level: CourseLevel;
  levelLabel: string;
  intakes: string[];
  duration: string;
  tuitionLakhs: number;
  ieltsMin: number;
  ieltsPerBand?: number;
  ieltsLabel: string;
  applicationFee: string;
  deadline: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityPercent?: number;
  eligibilityWarning?: string;
  eligibilityHint?: string;
  alreadyShortlisted?: boolean;
  pendingApplications?: number;
  curriculum: {
    semester1: string[];
    semester2: string[];
  };
  requirements: CourseRequirement[];
  keyDates: CourseKeyDates;
  fees: CourseFees;
  ourData: CourseOurData;
}

export interface CourseSearchResult extends Course {
  university: University;
}

export type CourseSortOption = "best-match" | "tuition-low" | "qs-rank" | "intake";

export interface CourseSearchFilters {
  query: string;
  countries: string[];
  levels: CourseLevel[];
  intakes: string[];
  tuitionRange: [number, number];
  ieltsRange: [number, number];
  eligibleOnly: boolean;
  matchStudent: boolean;
  sort: CourseSortOption;
}
