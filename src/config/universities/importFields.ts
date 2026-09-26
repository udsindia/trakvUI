/**
 * Canonical import columns for the university and course importers, mirroring the
 * HEADERS / REQUIRED_HEADERS arrays on the matching backend services. Kept here so the
 * mapping UI and the server agree on both the field names and which ones are required.
 */

export const UNIVERSITY_IMPORT_FIELDS = [
  "university_name",
  "country_code",
  "city",
  "university_type",
  "qs_ranking",
  "website",
  "living_cost_currency",
  "living_cost_amount",
] as const;

/** Only these two are fatal — everything else warns and is dropped. */
export const UNIVERSITY_IMPORT_REQUIRED = ["university_name", "country_code"] as const;

export const COURSE_IMPORT_FIELDS = [
  "university_name",
  "country_code",
  "course_name",
  "course_code",
  "study_level",
  "subject_area",
  "duration_months",
  "tuition_currency",
  "tuition_amount",
  "course_url",
  "application_fee_currency",
  "application_fee_amount",
  "course_start_date",
  "course_end_date",
  "pgwp_eligible",
  "scholarship_note",
  "intake_month",
  "intake_year",
  "intake_available",
  "application_deadline",
  "ielts_overall",
  "ielts_per_band",
  "toefl_overall",
  "pte_overall",
  "duolingo_overall",
  "inter_english_overall",
  "moi_accepted",
  "gre_score",
  "gmat_score",
  "sat_score",
  "dmat_score",
  "min_gpa",
  "gpa_scale",
  "max_backlogs",
] as const;

export const COURSE_IMPORT_REQUIRED = [
  "university_name",
  "country_code",
  "course_name",
  "study_level",
] as const;

export const IMPORT_FIELD_LABELS: Record<string, string> = {
  university_name: "University Name",
  country_code: "Country Code",
  city: "City",
  university_type: "University Type",
  qs_ranking: "QS Ranking",
  website: "Website",
  course_name: "Course Name",
  course_code: "Course Code",
  study_level: "Study Level",
  subject_area: "Subject Area",
  duration_months: "Duration (months)",
  tuition_currency: "Tuition Currency",
  tuition_amount: "Tuition Amount",
  course_url: "Course URL",
  application_fee_currency: "Application Fee Currency",
  application_fee_amount: "Application Fee Amount",
  living_cost_currency: "Living Cost Currency",
  living_cost_amount: "Living Cost Amount",
  course_start_date: "Course Start Date",
  course_end_date: "Course End Date",
  pgwp_eligible: "PGWP Eligible",
  scholarship_note: "Scholarship Note",
  intake_month: "Intake Month",
  intake_year: "Intake Year",
  intake_available: "Intake Available",
  application_deadline: "Application Deadline",
  ielts_overall: "IELTS — overall",
  ielts_per_band: "IELTS — each band",
  toefl_overall: "TOEFL — overall",
  pte_overall: "PTE — overall",
  duolingo_overall: "Duolingo — overall",
  inter_english_overall: "Inter / Class 12 English",
  moi_accepted: "MOI accepted (true/false)",
  gre_score: "GRE — minimum",
  gmat_score: "GMAT — minimum",
  sat_score: "SAT — minimum",
  dmat_score: "DMAT — minimum",
  min_gpa: "Minimum GPA",
  gpa_scale: "GPA scale",
  max_backlogs: "Maximum backlogs",
};

/**
 * Display grouping for the mapping step.
 *
 * The course importer has 22 columns, which is a lot to scan as one list, so they are
 * split into labelled blocks. The university importer has only its own six — courses
 * are imported separately, from their own button.
 */
export type ImportFieldGroup = {
  label: string;
  description?: string;
  fields: readonly string[];
};

export const UNIVERSITY_IMPORT_GROUPS: ImportFieldGroup[] = [
  {
    label: "University",
    fields: [
      "university_name",
      "country_code",
      "city",
      "university_type",
      "qs_ranking",
      "website",
      "living_cost_currency",
      "living_cost_amount",
    ],
  },
];

export const COURSE_IMPORT_GROUPS: ImportFieldGroup[] = [
  {
    label: "Which university",
    description: "Used to find an existing university in your catalogue — it must already be there.",
    fields: ["university_name", "country_code"],
  },
  {
    label: "Course",
    fields: ["course_name", "course_code", "study_level", "subject_area", "duration_months", "course_url"],
  },
  {
    label: "Fees (optional)",
    description:
      "Living cost is not here — it belongs to the university, not the programme, so it is set on the university instead.",
    fields: [
      "tuition_currency",
      "tuition_amount",
      "application_fee_currency",
      "application_fee_amount",
    ],
  },
  {
    label: "Dates and intake (optional)",
    description:
      "Supply intake month and year together, or neither — a course with no intake will not appear in searches filtered to available courses.",
    fields: [
      "course_start_date",
      "course_end_date",
      "intake_month",
      "intake_year",
      "intake_available",
      "application_deadline",
    ],
  },
  {
    label: "English proficiency (optional)",
    description:
      "The minimum score for each accepted test. Leave a test blank if it is not accepted — each score filled in becomes its own requirement, so a student meeting any one of them qualifies. MOI is a waiver, so it takes true/false rather than a score.",
    fields: [
      "ielts_overall",
      "ielts_per_band",
      "toefl_overall",
      "pte_overall",
      "duolingo_overall",
      "inter_english_overall",
      "moi_accepted",
    ],
  },
  {
    label: "Aptitude test (optional)",
    description: "Minimum score for each accepted entrance test.",
    fields: ["gre_score", "gmat_score", "sat_score", "dmat_score"],
  },
  {
    label: "Highest degree (optional)",
    description:
      "Thresholds on the applicant's highest completed degree — the bachelor's, for a master's applicant.",
    fields: ["min_gpa", "gpa_scale", "max_backlogs"],
  },
  {
    label: "Other (optional)",
    fields: ["pgwp_eligible", "scholarship_note"],
  },
];
