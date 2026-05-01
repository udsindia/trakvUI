import type { MultiSelectOption } from "@/shared/components/MultiSelectAutocomplete";

export type LeadFormValues = {
  agent: string;
  countries: string[];
  courses: string[];
  email: string;
  intakeDate: string;
  name: string;
  notes: string;
  phone: string;
  source: string;
  tags: string[];
};

// Matches backend AddLeadRequestDTO
export type CreateLeadPayload = {
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
};

export type AgentOption = {
  agentId: string;
  agentName: string;
};

export type LeadFormOptions = {
  agentOptions: AgentOption[];
  countryOptions: MultiSelectOption[];
  courseOptions: MultiSelectOption[];
  sourceOptions: string[];
  tagOptions: MultiSelectOption[];
};
