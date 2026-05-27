export type ApplicationStage =
  | "Draft"
  | "Submitted"
  | "Processing"
  | "Visa Applied"
  | "Visa Approved"
  | "Visa Rejected"
  | "Completed";

export type ApplicationFormValues = {
  leadId?: string;
  studentName: string;
  email: string;
  phone: string;
  targetCountry: string;
  targetUniversity: string;
  course: string;
  intakeMonth: string;
  intakeYear: number;
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

export type CreateApplicationPayload = ApplicationFormValues & {
  stage: ApplicationStage;
};

export type UpdateVisaPayload = VisaFormValues;
