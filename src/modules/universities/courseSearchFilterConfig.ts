import { courseSearchSettings, type CourseSearchSettings } from "@/config/universities/courseSearchSettings";
import type { StudentProfile } from "@/modules/universities/universities.types";
import {
  getDefaultFilterPanelValues,
  type FilterConfig,
  type FilterPanelValues,
} from "@/shared/components/FilterPanel";

type BuildFilterConfigContext = {
  countryCounts: Record<string, number>;
  selectedStudent: StudentProfile | null;
  settings?: CourseSearchSettings;
};

export function buildCourseSearchFilterConfig({
  countryCounts,
  selectedStudent,
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

  if (filterSettings.eligibility.enabled) {
    filters.push({
      type: "checkbox-group",
      label: filterSettings.eligibility.label,
      key: filterSettings.eligibility.key,
      options: selectedStudent
        ? [
            {
              label: `Matches ${selectedStudent.name}`,
              value: selectedStudent.id,
            },
          ]
        : [],
      helperText: selectedStudent
        ? `IELTS ${selectedStudent.ieltsOverall} · ${selectedStudent.degree} ${selectedStudent.percentage}%`
        : "Select a student in the search bar above",
    });
  }

  return filters;
}

export function getCourseSearchDefaultFilterValues(
  filterConfig: FilterConfig[],
  settings: CourseSearchSettings = courseSearchSettings,
  selectedStudent?: StudentProfile | null,
): FilterPanelValues {
  const baseValues = getDefaultFilterPanelValues(filterConfig);
  const { defaults, filters } = settings;

  return {
    ...baseValues,
    ...(filters.country.enabled ? { [filters.country.key]: defaults.countries } : {}),
    ...(filters.level.enabled ? { [filters.level.key]: defaults.levels } : {}),
    ...(filters.intake.enabled ? { [filters.intake.key]: defaults.intakes } : {}),
    ...(filters.tuition.enabled ? { [filters.tuition.key]: defaults.tuition } : {}),
    ...(filters.ielts.enabled ? { [filters.ielts.key]: defaults.ielts } : {}),
    ...(filters.eligibility.enabled
      ? {
          [filters.eligibility.key]:
            defaults.matchStudent && selectedStudent ? [selectedStudent.id] : [],
        }
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
  };
}
