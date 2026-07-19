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

export type ApplicationFormValues = {
  studentId: string | '';
  /** Selected university id — used to load courses; name is stored in targetUniversity. */
  universityId: string;
  targetUniversity: string;
  /** Selected course id — used for the select value; name is stored in courseName. */
  courseId: string;
  courseName: string;
  studyLevel: StudyLevel | "";
  /** Destination country code from GET /universities/countries. */
  destinationCountry: string;
  intakeMonth: string;
  intakeYear: number;
  tuitionFeeInr: string;      // text input; converted to number on submit
  applicationFeeInr: string;  // text input; converted to number on submit
  notes: string;
  studentName: string | '';
  email: string | '';
  phone: string | '';
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

export type CreateApplicationPayload = {
  studentId: string;
  assignedTo?: string;
  universityName: string;
  courseName: string;
  studyLevel: string;
  destinationCountry: string;
  intakeMonth: string;
  intakeYear: number;
  tuitionFeeInr?: number | null;
  applicationFeeInr?: number | null;
  notes?: string;
};

export type UpdateVisaPayload = VisaFormValues;
