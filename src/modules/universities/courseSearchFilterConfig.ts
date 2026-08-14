import {
  courseSearchSettings,
  type CourseSearchFilterSection,
  type CourseSearchOptionSetting,
  type CourseSearchSettings,
} from "@/config/universities/courseSearchSettings";
import {
  getDefaultFilterPanelValues,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";

type BuildFilterConfigContext = {
  countryCounts: Record<string, number>;
  dynamicOptions?: Partial<Record<"city" | "institution" | "discipline" | "duration", CourseSearchOptionSetting[]>>;
  settings?: CourseSearchSettings;
};

export type CourseSearchFilterSectionConfig = {
  key: CourseSearchFilterSection;
  title: string;
  filterKeys: string[];
};

const sectionTitles: Record<CourseSearchFilterSection, string> = {
  "destinations-intakes": "Destinations & Intakes",
  "student-details": "Student Details",
  "institution-details": "Institution Details",
  "course-details": "Course Details",
};

function getDropdownOptions(
  staticOptions: CourseSearchOptionSetting[],
  dynamicOptions: CourseSearchOptionSetting[] | undefined,
) {
  return dynamicOptions && dynamicOptions.length > 0 ? dynamicOptions : staticOptions;
}

function pushDropdownFilter(
  filters: FilterConfig[],
  filter: {
    disabled?: boolean;
    key: string;
    label: string;
    options: CourseSearchOptionSetting[];
    placeholder?: string;
  },
) {
  filters.push({
    type: "dropdown",
    key: filter.key,
    label: filter.label,
    options: filter.options,
    placeholder: filter.placeholder,
    disabled: filter.disabled,
  });
}

export function buildCourseSearchFilterConfig({
  countryCounts,
  dynamicOptions,
  settings = courseSearchSettings,
}: BuildFilterConfigContext): FilterConfig[] {
  const filters: FilterConfig[] = [];
  const { filters: filterSettings } = settings;

  if (filterSettings.country.enabled) {
    filters.push({
      type: "checkbox-group",
      label: filterSettings.country.label,
      key: filterSettings.country.key,
      options: filterSettings.country.options.map((option) => ({
        label: filterSettings.country.showCounts
          ? `${option.label} (${countryCounts[option.value] ?? 0})`
          : option.label,
        value: option.value,
      })),
    });
  }

  if (filterSettings.level.enabled) {
    filters.push({
      type: "checkbox-group",
      label: filterSettings.level.label,
      key: filterSettings.level.key,
      options: filterSettings.level.options,
    });
  }

  if (filterSettings.intake.enabled) {
    filters.push({
      type: "checkbox-group",
      label: filterSettings.intake.label,
      key: filterSettings.intake.key,
      options: filterSettings.intake.options,
    });
  }

  if (filterSettings.intakeStatus.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.intakeStatus.key,
      label: filterSettings.intakeStatus.label,
      options: filterSettings.intakeStatus.options,
      placeholder: filterSettings.intakeStatus.placeholder,
    });
  }

  if (filterSettings.nearestCity.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.nearestCity.key,
      label: filterSettings.nearestCity.label,
      options: getDropdownOptions(filterSettings.nearestCity.options, dynamicOptions?.city),
      placeholder: filterSettings.nearestCity.placeholder,
    });
  }

  if (filterSettings.institution.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.institution.key,
      label: filterSettings.institution.label,
      options: getDropdownOptions(filterSettings.institution.options, dynamicOptions?.institution),
      placeholder: filterSettings.institution.placeholder,
    });
  }

  if (filterSettings.nationality.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.nationality.key,
      label: filterSettings.nationality.label,
      options: filterSettings.nationality.options,
      placeholder: filterSettings.nationality.placeholder,
    });
  }

  if (filterSettings.regionState.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.regionState.key,
      label: filterSettings.regionState.label,
      options: filterSettings.regionState.options,
      placeholder: filterSettings.regionState.placeholder,
    });
  }

  if (filterSettings.onshore.enabled) {
    filters.push({
      type: "checkbox-group",
      label: filterSettings.onshore.label,
      key: filterSettings.onshore.key,
      options: filterSettings.onshore.options,
    });
  }

  if (filterSettings.highestEducationLevel.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.highestEducationLevel.key,
      label: filterSettings.highestEducationLevel.label,
      options: filterSettings.highestEducationLevel.options,
      placeholder: filterSettings.highestEducationLevel.placeholder,
    });
  }

  if (filterSettings.countryOfEducation.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.countryOfEducation.key,
      label: filterSettings.countryOfEducation.label,
      options: filterSettings.countryOfEducation.options,
      placeholder: filterSettings.countryOfEducation.placeholder,
    });
  }

  if (filterSettings.gradingSystem.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.gradingSystem.key,
      label: filterSettings.gradingSystem.label,
      options: filterSettings.gradingSystem.options,
      placeholder: filterSettings.gradingSystem.placeholder,
    });
  }

  if (filterSettings.backlogs.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.backlogs.key,
      label: filterSettings.backlogs.label,
      options: filterSettings.backlogs.options,
      placeholder: filterSettings.backlogs.placeholder,
    });
  }

  if (filterSettings.educationGap.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.educationGap.key,
      label: filterSettings.educationGap.label,
      options: filterSettings.educationGap.options,
      placeholder: filterSettings.educationGap.placeholder,
    });
  }

  if (filterSettings.turnaround.enabled) {
    filters.push({
      type: "slider",
      label: filterSettings.turnaround.label,
      key: filterSettings.turnaround.key,
      min: filterSettings.turnaround.min,
      max: filterSettings.turnaround.max,
      helperText: filterSettings.turnaround.helperText,
    });
  }

  if (filterSettings.tuition.enabled) {
    filters.push({
      type: "slider",
      label: filterSettings.tuition.label,
      key: filterSettings.tuition.key,
      min: filterSettings.tuition.min,
      max: filterSettings.tuition.max,
      helperText: filterSettings.tuition.helperText,
    });
  }

  if (filterSettings.ielts.enabled) {
    filters.push({
      type: "slider",
      label: filterSettings.ielts.label,
      key: filterSettings.ielts.key,
      min: filterSettings.ielts.min,
      max: filterSettings.ielts.max,
      step: filterSettings.ielts.step,
      helperText: filterSettings.ielts.helperText,
    });
  }

  if (filterSettings.discipline.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.discipline.key,
      label: filterSettings.discipline.label,
      options: getDropdownOptions(filterSettings.discipline.options, dynamicOptions?.discipline),
      placeholder: filterSettings.discipline.placeholder,
    });
  }

  if (filterSettings.duration.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.duration.key,
      label: filterSettings.duration.label,
      options: getDropdownOptions(filterSettings.duration.options, dynamicOptions?.duration),
      placeholder: filterSettings.duration.placeholder,
    });
  }

  if (filterSettings.delivery.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.delivery.key,
      label: filterSettings.delivery.label,
      options: filterSettings.delivery.options,
      placeholder: filterSettings.delivery.placeholder,
    });
  }

  if (filterSettings.postStudyWorkPermit.enabled) {
    pushDropdownFilter(filters, {
      key: filterSettings.postStudyWorkPermit.key,
      label: filterSettings.postStudyWorkPermit.label,
      options: filterSettings.postStudyWorkPermit.options,
      placeholder: filterSettings.postStudyWorkPermit.placeholder,
    });
  }

  return filters;
}

export function buildCourseSearchFilterSections(
  settings: CourseSearchSettings = courseSearchSettings,
): CourseSearchFilterSectionConfig[] {
  const { filters } = settings;
  const sectionOrder: CourseSearchFilterSection[] = [
    "destinations-intakes",
    "student-details",
    "institution-details",
    "course-details",
  ];

  const bySection = Object.values(filters).reduce<Record<CourseSearchFilterSection, string[]>>(
    (accumulator, filter) => {
      if (!filter.enabled || !("section" in filter)) {
        return accumulator;
      }
      accumulator[filter.section].push(filter.key);
      return accumulator;
    },
    {
      "destinations-intakes": [],
      "student-details": [],
      "institution-details": [],
      "course-details": [],
    },
  );

  return sectionOrder
    .map((key) => ({ key, title: sectionTitles[key], filterKeys: bySection[key] }))
    .filter((section) => section.filterKeys.length > 0);
}

export function getCourseSearchDefaultFilterValues(
  filterConfig: FilterConfig[],
  settings: CourseSearchSettings = courseSearchSettings,
): FilterPanelValues {
  const baseValues = getDefaultFilterPanelValues(filterConfig);
  const { defaults, filters } = settings;

  return {
    ...baseValues,
    ...(filters.country.enabled ? { [filters.country.key]: defaults.countries } : {}),
    ...(filters.level.enabled ? { [filters.level.key]: defaults.levels } : {}),
    ...(filters.intake.enabled ? { [filters.intake.key]: defaults.intakes } : {}),
    ...(filters.intakeStatus.enabled ? { [filters.intakeStatus.key]: defaults.intakeStatus } : {}),
    ...(filters.nearestCity.enabled ? { [filters.nearestCity.key]: defaults.nearestCity } : {}),
    ...(filters.institution.enabled ? { [filters.institution.key]: defaults.institution } : {}),
    ...(filters.nationality.enabled ? { [filters.nationality.key]: defaults.nationality } : {}),
    ...(filters.regionState.enabled ? { [filters.regionState.key]: defaults.regionState } : {}),
    ...(filters.onshore.enabled
      ? { [filters.onshore.key]: defaults.onshore ? ["onshore"] : [] }
      : {}),
    ...(filters.highestEducationLevel.enabled
      ? { [filters.highestEducationLevel.key]: defaults.highestEducationLevel }
      : {}),
    ...(filters.countryOfEducation.enabled
      ? { [filters.countryOfEducation.key]: defaults.countryOfEducation }
      : {}),
    ...(filters.gradingSystem.enabled ? { [filters.gradingSystem.key]: defaults.gradingSystem } : {}),
    ...(filters.backlogs.enabled ? { [filters.backlogs.key]: defaults.backlogs } : {}),
    ...(filters.educationGap.enabled ? { [filters.educationGap.key]: defaults.educationGap } : {}),
    ...(filters.turnaround.enabled ? { [filters.turnaround.key]: defaults.turnaround } : {}),
    ...(filters.tuition.enabled ? { [filters.tuition.key]: defaults.tuition } : {}),
    ...(filters.ielts.enabled ? { [filters.ielts.key]: defaults.ielts } : {}),
    ...(filters.discipline.enabled ? { [filters.discipline.key]: defaults.discipline } : {}),
    ...(filters.duration.enabled ? { [filters.duration.key]: defaults.duration } : {}),
    ...(filters.delivery.enabled ? { [filters.delivery.key]: defaults.delivery } : {}),
    ...(filters.postStudyWorkPermit.enabled
      ? { [filters.postStudyWorkPermit.key]: defaults.postStudyWorkPermit }
      : {}),
  };
}

export function getCourseSearchSliderFallbacks(settings: CourseSearchSettings = courseSearchSettings) {
  return {
    tuition: settings.filters.tuition.enabled
      ? ([settings.filters.tuition.min, settings.filters.tuition.max] as [number, number])
      : ([5, 60] as [number, number]),
    ielts: settings.filters.ielts.enabled
      ? ([settings.filters.ielts.min, settings.filters.ielts.max] as [number, number])
      : ([5.5, 8] as [number, number]),
    turnaround: settings.filters.turnaround.enabled
      ? ([settings.filters.turnaround.min, settings.filters.turnaround.max] as [number, number])
      : ([0, 45] as [number, number]),
  };
}
