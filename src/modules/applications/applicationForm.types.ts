export type ApplicationStage =
  | "Draft"
  | "Submitted"
  | "Processing"
  | "Visa Applied"
  | "Visa Approved"
  | "Visa Rejected"
  | "Completed";

export const STUDY_LEVELS = [
  "UNDERGRADUATE",
  "POSTGRADUATE_TAUGHT",
  "POSTGRADUATE_RESEARCH",
  "INTEGRATED_MASTERS",
  "PHD",
  "FOUNDATION",
  "DIPLOMA",
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

/** Sentinel id for the "Other" row appended to the course list. */
export const OTHER_COURSE_ID = "__other_course__";

export type ApplicationFormValues = {
  studentId: string | "";
  /** Selected university id — used to load courses; name is stored in targetUniversity. */
  universityId: string;
  /**
   * True when the user has deliberately opted out of the catalogue and is typing the
   * university and course names. Kept explicit so linkage is never lost by accident —
   * the id is only cleared because someone asked for it.
   */
  useCustomUniversity: boolean;
  targetUniversity: string;
  /** Selected course id — used for the select value; name is stored in courseName. */
  courseId: string;
  /**
   * True when "Other" was picked in the course list and the name is being typed. On save
   * the course is added to the university's catalogue and the new id is used, so the next
   * application can pick it from the list instead of typing it again.
   */
  useCustomCourse: boolean;
  courseName: string;
  studyLevel: StudyLevel | "";
  /** Destination country code from GET /universities/countries. */
  destinationCountry: string;
  intakeMonth: string;
  intakeYear: number;
  tuitionFeeInr: string; // text input; converted to number on submit
  applicationFeeInr: string; // text input; converted to number on submit
  notes: string;
  /** Third party handling the application; empty means in-house. */
  processedBy: string;
  studentName: string | "";
  email: string | "";
  phone: string | "";
};

export type VisaFormValues = {
  passportNumber: string;
  passportExpiryDate: string;
  submissionDate?: string;
  biometricsDate?: string;
  interviewDate?: string;
  financialDocumentsProvided: boolean;
  notes: string;
};

/**
 * PATCH /applications/{id}. Null/omitted means "no change".
 * destinationCountry is absent on purpose — the stage sequence is cloned from that
 * country at creation, so it cannot be changed afterwards.
 */
export type UpdateApplicationPayload = {
  assignedTo?: string;
  universityName?: string;
  courseName?: string;
  courseId?: string;
  studyLevel?: string;
  intakeMonth?: string;
  intakeYear?: number;
  tuitionFeeInr?: number;
  applicationFeeInr?: number;
  notes?: string;
  /** Editable after the application advances, unlike every other field here. */
  processedBy?: string;
};

export type CreateApplicationPayload = {
  studentId: string;
  assignedTo?: string;
  universityName: string;
  courseName: string;
  courseId?: string;
  studyLevel: string;
  universityId?: string;
  destinationCountryCode: string;
  intakeMonth: string;
  intakeYear: number;
  tuitionFeeInr?: number | null;
  applicationFeeInr?: number | null;
  notes?: string;
  processedBy?: string;
  targetUniversity?: string;
  course?: string;
  leadId?: string;
};

export type UpdateVisaPayload = VisaFormValues;
