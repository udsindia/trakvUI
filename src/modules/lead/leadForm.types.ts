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

export type LeadFormOptions = {
  agentOptions: string[];
  countryOptions: MultiSelectOption[];
  courseOptions: MultiSelectOption[];
  sourceOptions: string[];
  tagOptions: MultiSelectOption[];
};
