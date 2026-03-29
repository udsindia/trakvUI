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

export type CreateLeadPayload = {
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

export type LeadFormOptions = {
  agentOptions: string[];
  countryOptions: MultiSelectOption[];
  courseOptions: MultiSelectOption[];
  sourceOptions: string[];
  tagOptions: MultiSelectOption[];
};
