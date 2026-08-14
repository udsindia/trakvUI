import type { MultiSelectOption } from "@/shared/components/MultiSelectAutocomplete";

export type LeadFormValues = {
  agent: string;
  collegeName: string;
  countries: string[];
  courses: string[];
  currentStudyLevel: string;
  email: string;
  englishProficiencyTest: string;
  englishProficiencyTestScore: string;
  intakeDate: string;
  isWhatsAppAvailable: boolean;
  name: string;
  notes: string;
  phone: string;
  source: string;
  tags: string[];
};

/** The "Lead Source" option that reveals the College Name field. */
export const COLLEGE_SOURCE = "College";

// Matches backend AddLeadRequestDTO
export type CreateLeadPayload = {
  tenantId?: string;
  assignedToId: string;
  assignedToName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNo: string;
  emailAddress: string;
  leadSource: string;
  countriesOfInterest: string[];
  intakeMonth: string;
  year: number;
  fieldOfStudy: string;
  currentStudyLevel: string;
  isWhatsAppAvailable: boolean;
  englishProficiencyTest?: string;
  englishProficiencyTestScore?: string;
  college?: string;
  notes?: string;
};

export type AgentOption = {
  agentId: string;
  agentName: string;
};

export type LeadFormOptions = {
  agentOptions: AgentOption[];
  countryOptions: MultiSelectOption[];
  courseOptions: MultiSelectOption[];
  englishTestOptions: string[];
  sourceOptions: string[];
  studyLevelOptions: string[];
  tagOptions: MultiSelectOption[];
};
