import type { CourseSortOption } from "@/modules/universities/universities.types";

export type CourseSearchOptionSetting = {
  label: string;
  value: string;
};

export type CourseSearchFilterSection =
  | "destinations-intakes"
  | "student-details"
  | "institution-details"
  | "course-details";

type CourseSearchBaseFilterSetting = {
  enabled: boolean;
  key: string;
  label: string;
  section: CourseSearchFilterSection;
};

export type CourseSearchCheckboxFilterSetting = CourseSearchBaseFilterSetting & {
  /** When true, appends live course counts per option (used for countries). */
  showCounts?: boolean;
  options: CourseSearchOptionSetting[];
};

export type CourseSearchDropdownFilterSetting = CourseSearchBaseFilterSetting & {
  options: CourseSearchOptionSetting[];
  placeholder?: string;
};

export type CourseSearchSliderFilterSetting = CourseSearchBaseFilterSetting & {
  min: number;
  max: number;
  step?: number;
  helperText?: string;
};

export type CourseSearchSortOptionSetting = {
  label: string;
  value: CourseSortOption;
};

/**
 * Course search filter and UI settings.
 *
 * Modify this config to add/remove countries, intakes, levels, slider ranges, etc.
 * The course search page reads from here — no page code changes required.
 */
export const courseSearchSettings = {
  search: {
    placeholder: "Search courses, universities, cities...",
  },
  filterPanel: {
    title: "Advance Filter",
    applyButtonLabel: "Apply",
  },
  sort: {
    options: [
      { label: "Sort: Best Match", value: "best-match" },
      { label: "Sort: Tuition: Low", value: "tuition-low" },
      { label: "Sort: QS Rank", value: "qs-rank" },
      { label: "Sort: Intake", value: "intake" },
    ] satisfies CourseSearchSortOptionSetting[],
  },
  filters: {
    country: {
      enabled: true,
      key: "country",
      label: "Destination",
      section: "destinations-intakes",
      placeholder: "Select destination",
      options: [
        // Labels are the country's full name everywhere, matching CountryNames on the server
        // and COUNTRY_ALPHA3_TO_UI on the client. A picker that said "UK" while every other
        // screen said "United Kingdom" read as two different countries.
        { label: "United Kingdom", value: "GB" },
        { label: "Ireland", value: "IE" },
        { label: "Australia", value: "AU" },
        { label: "Canada", value: "CA" },
        { label: "New Zealand", value: "NZ" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    level: {
      enabled: true,
      key: "level",
      label: "Course Levels",
      section: "course-details",
      placeholder: "Select course level",
      options: [
        { label: "Undergraduate", value: "undergraduate" },
        { label: "Masters (PG)", value: "masters" },
        { label: "PhD", value: "phd" },
        { label: "Diploma / Foundation", value: "diploma" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    intake: {
      enabled: true,
      key: "intake",
      section: "destinations-intakes",
      label: "Intake",
      placeholder: "Select intake",
      options: [
        { label: "Sep 2025", value: "Sep 2025" },
        { label: "Jan 2026", value: "Jan 2026" },
        { label: "Feb 2026", value: "Feb 2026" },
        { label: "May 2026", value: "May 2026" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    intakeStatus: {
      enabled: true,
      key: "intakeStatus",
      label: "Intake Status",
      section: "destinations-intakes",
      placeholder: "Select Intake Status",
      options: [
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
        { label: "Waitlist", value: "waitlist" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    nearestCity: {
      enabled: true,
      key: "nearestCity",
      label: "Nearest City",
      section: "institution-details",
      placeholder: "Select",
      options: [],
    } satisfies CourseSearchDropdownFilterSetting,
    institution: {
      enabled: true,
      key: "institution",
      label: "Institutions",
      section: "institution-details",
      placeholder: "Select",
      options: [],
    } satisfies CourseSearchDropdownFilterSetting,
    nationality: {
      enabled: true,
      key: "nationality",
      label: "Nationality",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "India", value: "india" },
        { label: "Nepal", value: "nepal" },
        { label: "Pakistan", value: "pakistan" },
        { label: "Bangladesh", value: "bangladesh" },
        { label: "Sri Lanka", value: "sri-lanka" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    regionState: {
      enabled: true,
      key: "regionState",
      label: "Region",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "Andhra Pradesh", value: "andhra-pradesh" },
        { label: "Karnataka", value: "karnataka" },
        { label: "Maharashtra", value: "maharashtra" },
        { label: "Tamil Nadu", value: "tamil-nadu" },
        { label: "Telangana", value: "telangana" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    onshore: {
      enabled: true,
      key: "onshore",
      label: "The student is onshore",
      section: "student-details",
      options: [{ label: "The student is onshore", value: "onshore" }],
    } satisfies CourseSearchCheckboxFilterSetting,
    highestEducationLevel: {
      enabled: true,
      key: "highestEducationLevel",
      label: "Highest Education Level",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "Diploma", value: "diploma" },
        { label: "Bachelor", value: "bachelor" },
        { label: "Master", value: "master" },
        { label: "PhD", value: "phd" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    countryOfEducation: {
      enabled: true,
      key: "countryOfEducation",
      label: "Country of Education",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "India", value: "india" },
        { label: "Nepal", value: "nepal" },
        { label: "Pakistan", value: "pakistan" },
        { label: "Bangladesh", value: "bangladesh" },
        { label: "Sri Lanka", value: "sri-lanka" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    gradingSystem: {
      enabled: true,
      key: "gradingSystem",
      label: "Grading System",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "GPA (4-point)", value: "gpa-4" },
        { label: "CGPA (10-point)", value: "cgpa-10" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    backlogs: {
      enabled: true,
      key: "backlogs",
      label: "Backlogs",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "0", value: "0" },
        { label: "1-3", value: "1-3" },
        { label: "4-6", value: "4-6" },
        { label: "7+", value: "7-plus" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    educationGap: {
      enabled: true,
      key: "educationGap",
      label: "Education Gap",
      section: "student-details",
      placeholder: "Select",
      options: [
        { label: "No gap", value: "0" },
        { label: "Up to 1 year", value: "0-1" },
        { label: "1-2 years", value: "1-2" },
        { label: "2+ years", value: "2-plus" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    turnaround: {
      enabled: true,
      key: "turnaround",
      label: "Reported Turnaround Time",
      section: "institution-details",
      min: 0,
      max: 45,
      helperText: "0 to 45 days",
    } satisfies CourseSearchSliderFilterSetting,
    discipline: {
      enabled: true,
      key: "discipline",
      label: "Disciplines",
      section: "course-details",
      placeholder: "Select",
      options: [],
    } satisfies CourseSearchDropdownFilterSetting,
    duration: {
      enabled: true,
      key: "duration",
      label: "Course Duration",
      section: "course-details",
      placeholder: "Select",
      options: [],
    } satisfies CourseSearchDropdownFilterSetting,
    delivery: {
      enabled: true,
      key: "delivery",
      label: "Course Delivery",
      section: "course-details",
      placeholder: "Select",
      options: [
        { label: "In person", value: "in-person" },
        { label: "Online", value: "online" },
        { label: "Hybrid", value: "hybrid" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    postStudyWorkPermit: {
      enabled: true,
      key: "postStudyWorkPermit",
      label: "Post Study Work Permit",
      section: "course-details",
      placeholder: "Select",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    tuition: {
      enabled: true,
      key: "tuition",
      label: "Tuition Fees",
      section: "course-details",
      min: 5,
      max: 60,
      helperText: "₹5L – ₹60L per year",
    } satisfies CourseSearchSliderFilterSetting,
    ielts: {
      enabled: true,
      key: "ielts",
      label: "IELTS Requirement",
      section: "student-details",
      min: 5.5,
      max: 8,
      step: 0.5,
      helperText: "Filter by course IELTS requirement",
    } satisfies CourseSearchSliderFilterSetting,
    eligibility: {
      enabled: false,
      key: "eligibility",
      label: "Eligibility Match",
    },
  },
  /**
   * Initial filter state when the page loads or when filters are reset.
   * Empty arrays mean “no filter applied” for checkbox groups.
   */
  defaults: {
    countries: "" as string,
    levels: "" as string,
    intakes: "" as string,
    intakeStatus: "" as string,
    nearestCity: "" as string,
    institution: "" as string,
    nationality: "" as string,
    regionState: "" as string,
    onshore: false,
    highestEducationLevel: "" as string,
    countryOfEducation: "" as string,
    gradingSystem: "" as string,
    backlogs: "" as string,
    educationGap: "" as string,
    turnaround: [0, 45] as [number, number],
    discipline: "" as string,
    duration: "" as string,
    delivery: "" as string,
    postStudyWorkPermit: "" as string,
    tuition: [5, 60] as [number, number],
    ielts: [5.5, 8] as [number, number],
    matchStudent: false,
    eligibleOnly: false,
    sort: "best-match" as CourseSortOption,
  },
} as const;

export type CourseSearchSettings = typeof courseSearchSettings;
