import { ENGLISH_TEST_OPTIONS } from "@/config/universities/requirementOptions";
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
        // Labels match COUNTRY_ALPHA3_TO_UI exactly, so the picker and every screen that
        // renders a stored code use one wording. A picker that said "UK" while the list
        // said "United Kingdom" read as two different countries.
        { label: "UK", value: "GB" },
        { label: "Ireland", value: "IE" },
        { label: "Australia", value: "AU" },
        { label: "Canada", value: "CA" },
        { label: "New Zealand", value: "NZ" },
        { label: "USA", value: "US" },
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
        // Months, not months-and-years: an intake recurs, so the catalogue records
        // "September" and a year here would match nothing.
        { label: "January", value: "January" },
        { label: "February", value: "February" },
        { label: "March", value: "March" },
        { label: "April", value: "April" },
        { label: "May", value: "May" },
        { label: "June", value: "June" },
        { label: "July", value: "July" },
        { label: "August", value: "August" },
        { label: "September", value: "September" },
        { label: "October", value: "October" },
        { label: "November", value: "November" },
        { label: "December", value: "December" },
      ],
    } satisfies CourseSearchDropdownFilterSetting,
    intakeStatus: {
      // Hidden deliberately: the backend does filter on it, but a counsellor picks a
      // month, not a status, and the status belongs on the card instead.
      enabled: false,
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
      enabled: false,
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
      enabled: false,
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
      // Hidden: the API accepts this and ignores it — AdvancedCourseSearchRequest
      // marks it NOT YET FILTERED. A filter that changes nothing is worse than a
      // missing one, because it makes the finder look broken. Set true once the
      // backend actually filters on it.
      enabled: false,
      key: "onshore",
      label: "The student is onshore",
      section: "student-details",
      options: [{ label: "The student is onshore", value: "onshore" }],
    } satisfies CourseSearchCheckboxFilterSetting,
    highestEducationLevel: {
      // Hidden: the API accepts this and ignores it — AdvancedCourseSearchRequest
      // marks it NOT YET FILTERED. A filter that changes nothing is worse than a
      // missing one, because it makes the finder look broken. Set true once the
      // backend actually filters on it.
      enabled: false,
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
      // Hidden: the API accepts this and ignores it — AdvancedCourseSearchRequest
      // marks it NOT YET FILTERED. A filter that changes nothing is worse than a
      // missing one, because it makes the finder look broken. Set true once the
      // backend actually filters on it.
      enabled: false,
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
      // Hidden: the API accepts this and ignores it — AdvancedCourseSearchRequest
      // marks it NOT YET FILTERED. A filter that changes nothing is worse than a
      // missing one, because it makes the finder look broken. Set true once the
      // backend actually filters on it.
      enabled: false,
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
      // The backend does filter on this: searchAdvanced reads it and applies a
      // threshold clause. A course with no limit recorded still matches, because
      // most of the catalogue has none and a strict reading would return nothing.
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
      // The backend does filter on this: searchAdvanced reads it and applies a
      // threshold clause. A course with no limit recorded still matches, because
      // most of the catalogue has none and a strict reading would return nothing.
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
      // Hidden: the API accepts this and ignores it — AdvancedCourseSearchRequest
      // marks it NOT YET FILTERED. A filter that changes nothing is worse than a
      // missing one, because it makes the finder look broken. Set true once the
      // backend actually filters on it.
      enabled: false,
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
      label: "Field of Study",
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
      enabled: false,
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
      // Replaced by englishTest + englishScore. This asked "which courses want IELTS
      // between 5.5 and 8", but a counsellor has a student with a score already, so the
      // useful question is which courses that score opens. It also covered only IELTS,
      // while the catalogue records PTE, TOEFL, Duolingo, Class 12 English and MOI.
      enabled: false,
      key: "ielts",
      label: "IELTS Requirement",
      section: "student-details",
      min: 5.5,
      max: 8,
      step: 0.5,
      helperText: "Filter by course IELTS requirement",
    } satisfies CourseSearchSliderFilterSetting,
    // ── English proficiency, asked from the student's side ─────────────────────
    // The test is chosen first and the score scale follows from it, because the scales
    // are not comparable: IELTS runs to 9, PTE to 90, Duolingo to 160, Class 12 English
    // is a percentage, and MOI has no score at all. The score options are filled in at
    // runtime from ENGLISH_TEST_OPTIONS for whichever test is selected.
    englishTest: {
      enabled: true,
      key: "englishTest",
      label: "English test the student holds",
      section: "student-details",
      placeholder: "Select test",
      // Exactly the tests a course can state a requirement in, named the way the
      // requirements editor names them, so one vocabulary covers both screens.
      options: ENGLISH_TEST_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value as string,
      })),
    } satisfies CourseSearchDropdownFilterSetting,
    englishScore: {
      enabled: true,
      key: "englishScore",
      label: "Their score",
      section: "student-details",
      placeholder: "Select score",
      // Filled from the chosen test. Empty until one is picked, and stays empty for MOI,
      // which is held or not held rather than scored.
      options: [] as CourseSearchOptionSetting[],
    } satisfies CourseSearchDropdownFilterSetting,
    englishUnstated: {
      enabled: true,
      key: "englishUnstated",
      label: "English requirement",
      section: "student-details",
      // Phrased as an opt-in to the strict reading, so the default — an empty box — is the
      // safe one. Most of the catalogue records no language requirement, and excluding
      // those empties the list rather than narrowing it.
      options: [
        { label: "Only courses with a stated requirement I clear", value: "onlyStated" },
      ],
    } satisfies CourseSearchCheckboxFilterSetting,
    aptitudeTest: {
      enabled: true,
      key: "aptitudeTest",
      label: "Aptitude test",
      section: "student-details",
      // Not a country rule. GRE and GMAT are usual for the USA and unusual for the UK,
      // but that already shows up in the requirement rows, so filtering the data stays
      // right when a UK course does want a GMAT.
      options: [
        { label: "Exclude courses requiring GRE / GMAT / SAT", value: "exclude" },
      ],
    } satisfies CourseSearchCheckboxFilterSetting,
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
    englishTest: "",
    englishScore: "",
    englishUnstated: [] as string[],
    aptitudeTest: [] as string[],
    matchStudent: false,
    eligibleOnly: false,
    sort: "best-match" as CourseSortOption,
  },
} as const;

export type CourseSearchSettings = typeof courseSearchSettings;
