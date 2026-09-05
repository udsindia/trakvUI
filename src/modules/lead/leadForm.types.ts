import type { MultiSelectOption } from "@/shared/components/MultiSelectAutocomplete";

export type LeadFormValues = {
  agent: string;
  collegeName: string;
  /** Free-text source, used only when `source` is "Other". */
  otherSource: string;
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

/** The "Lead Source" option that reveals the free-text source field. */
export const OTHER_SOURCE = "Other";

/** Longest custom source we accept — lead_sources.name is varchar(255). */
export const MAX_SOURCE_LENGTH = 60;

/**
 * Letters, digits, spaces and the punctuation that shows up in real source names
 * ("Walk-in", "Agent Partner", "Facebook / Meta", "Expo '26"). Deliberately excludes
 * the characters that signal a paste of junk or markup.
 *
 * \p{M} matters as much as \p{L} here: Indic vowel signs are combining marks, so
 * without it a Devanagari name like मेला is rejected while Cyrillic passes.
 */
const SOURCE_ALLOWED = /^[\p{L}\p{M}\p{N} .,&'()\/-]+$/u;

/**
 * Validates a custom lead source. Returns an error message, or null when valid.
 * `existingOptions` are the sources already selectable — re-typing one of those
 * should become a pick from the list rather than a near-duplicate row.
 */
export function validateCustomSource(
  raw: string,
  existingOptions: string[] = [],
): string | null {
  const value = raw.trim();

  if (!value) return "Lead source is required.";
  if (value.length < 2) return "Enter at least 2 characters.";
  if (value.length > MAX_SOURCE_LENGTH) {
    return `Keep it under ${MAX_SOURCE_LENGTH} characters.`;
  }
  if (!SOURCE_ALLOWED.test(value)) {
    return "Use letters, numbers, spaces and . , & ' ( ) / - only.";
  }

  // Typing "Other" would create a lead_sources row literally named "Other",
  // which tells nobody anything about where the lead came from.
  if (value.toLowerCase() === OTHER_SOURCE.toLowerCase()) {
    return "Enter the actual source name, not \"Other\".";
  }

  const clash = existingOptions.find(
    (option) => option.toLowerCase() === value.toLowerCase() && option !== OTHER_SOURCE,
  );
  if (clash) return `"${clash}" is already in the list — select it instead.`;

  return null;
}

// Matches backend AddLeadRequestDTO
export type CreateLeadPayload = {
  tenantId?: string;
  assignedToId: string;
  assignedToName: string;
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
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
