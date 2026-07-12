import type { CourseSortOption } from "@/modules/universities/universities.types";

export type CourseSearchOptionSetting = {
  label: string;
  value: string;
};

export type CourseSearchCheckboxFilterSetting = {
  enabled: boolean;
  key: string;
  label: string;
  /** When true, appends live course counts per option (used for countries). */
  showCounts?: boolean;
  options: CourseSearchOptionSetting[];
};

export type CourseSearchSliderFilterSetting = {
  enabled: boolean;
  key: string;
  label: string;
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
    title: "Filter Courses",
    applyButtonLabel: "Apply Filters",
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
      label: "Country",
      showCounts: true,
      options: [
        { label: "UK", value: "GB" },
        { label: "Ireland", value: "IE" },
        { label: "Australia", value: "AU" },
        { label: "Canada", value: "CA" },
        { label: "New Zealand", value: "NZ" },
      ],
    } satisfies CourseSearchCheckboxFilterSetting,
    level: {
      enabled: true,
      key: "level",
      label: "Level",
      options: [
        { label: "Undergraduate", value: "undergraduate" },
        { label: "Masters (PG)", value: "masters" },
        { label: "PhD", value: "phd" },
        { label: "Diploma / Foundation", value: "diploma" },
      ],
    } satisfies CourseSearchCheckboxFilterSetting,
    intake: {
      enabled: true,
      key: "intake",
      label: "Intake",
      options: [
        { label: "Sep 2025", value: "Sep 2025" },
        { label: "Jan 2026", value: "Jan 2026" },
        { label: "Feb 2026", value: "Feb 2026" },
        { label: "May 2026", value: "May 2026" },
      ],
    } satisfies CourseSearchCheckboxFilterSetting,
    tuition: {
      enabled: true,
      key: "tuition",
      label: "Annual Tuition (₹ Lakh)",
      min: 5,
      max: 60,
      helperText: "₹5L – ₹60L per year",
    } satisfies CourseSearchSliderFilterSetting,
    ielts: {
      enabled: true,
      key: "ielts",
      label: "IELTS Requirement",
      min: 5.5,
      max: 8,
      step: 0.5,
      helperText: "Filter by course IELTS requirement",
    } satisfies CourseSearchSliderFilterSetting,
    eligibility: {
      enabled: true,
      key: "eligibility",
      label: "Eligibility Match",
    },
  },
  /**
   * Initial filter state when the page loads or when filters are reset.
   * Empty arrays mean “no filter applied” for checkbox groups.
   */
  defaults: {
    countries: [] as string[],
    levels: [] as string[],
    intakes: [] as string[],
    tuition: [5, 60] as [number, number],
    ielts: [5.5, 8] as [number, number],
    matchStudent: false,
    eligibleOnly: false,
    sort: "best-match" as CourseSortOption,
  },
} as const;

export type CourseSearchSettings = typeof courseSearchSettings;
