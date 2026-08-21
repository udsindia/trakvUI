import type { LeadFormOptions } from "@/modules/lead/leadForm.types";

export const leadFormOptions: LeadFormOptions = {
  agentOptions: [
    {
      agentId: "7b0bdb9f-2e47-43f7-8c5e-1d42dd7f9401",
      agentName: "Aisha Khan",
    },
    {
      agentId: "58edc5b2-02f8-4a81-b8ef-0b6183c44f81",
      agentName: "Rahul Verma",
    },
    {
      agentId: "c1f04f33-3de1-40c7-8a4e-486c9ef56f57",
      agentName: "Priya Menon",
    },
  ],
  countryOptions: ["Canada", "Australia", "United Kingdom", "Germany"],
  courseOptions: [
    "MBA",
    "Computer Science",
    "Business Analytics",
    "Hospitality Management",
    "Cyber Security",
  ],
  englishTestOptions: ["IELTS", "TOEFL", "PTE", "Duolingo", "Other", "None"],
  // "Other" must stay last — it reveals the free-text source field.
  sourceOptions: [
    "Website",
    "Referral",
    "Social Media",
    "Walk-in",
    "Email Campaign",
    "College",
    "Other",
  ],
  studyLevelOptions: ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Not Specified"],
  tagOptions: ["High Intent", "Scholarship", "Priority", "Parent Involved", "Repeat Enquiry"],
};
