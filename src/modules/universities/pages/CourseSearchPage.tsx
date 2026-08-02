import { useMemo, useState } from "react";
import { TuneRounded } from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { courseSearchSettings } from "@/config/universities/courseSearchSettings";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { CourseSearchCard } from "@/modules/universities/components/CourseSearchCard";
import { ShortlistTray } from "@/modules/universities/components/ShortlistTray";
import {
  buildCourseSearchFilterConfig,
  getCourseSearchDefaultFilterValues,
  getCourseSearchSliderFallbacks,
} from "@/modules/universities/courseSearchFilterConfig";
import {
  buildCourseSearchResults,
  filterCourseSearchResults,
  getCountryCounts,
  sortCourseSearchResults,
} from "@/modules/universities/courseSearchUtils";
import { useCountries, useUniversitiesCatalog } from "@/modules/universities/useUniversitiesCatalog";
import {
  courseDetailsPath,
  universityDetailsPath,
} from "@/modules/universities/universitiesRoutePaths";
import {
  universitiesContentSx,
  universitiesPagePaperSx,
} from "@/modules/universities/universitiesStyles";
import type {
  CourseLevel,
  CourseSearchFilters,
  CourseSortOption,
} from "@/modules/universities/universities.types";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import type { FilterPanelValue, FilterPanelValues } from "@/shared/components/FilterPanel";
import { FilterPanel } from "@/shared/components/FilterPanel";

const { defaults: defaultSearchSettings, filters: filterKeys } = courseSearchSettings;
const sliderFallbacks = getCourseSearchSliderFallbacks();

function countActiveFilters(
  values: FilterPanelValues,
  filterConfig: ReturnType<typeof buildCourseSearchFilterConfig>,
  defaults: FilterPanelValues,
): number {
  return filterConfig.reduce((count, filter) => {
    const value = values[filter.key];
    switch (filter.type) {
      case "checkbox-group":
        return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
      case "slider": {
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value as [number, number];
          const defaultValue = defaults[filter.key] as [number, number] | undefined;
          if (defaultValue && (min !== defaultValue[0] || max !== defaultValue[1])) {
            return count + 1;
          }
        }
        return count;
      }
      default:
        return count;
    }
  }, 0);
}

function asStringArray(value: FilterPanelValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.every((entry) => typeof entry === "string") ? value : [];
}

function asNumberRange(
  value: FilterPanelValue | undefined,
  fallback: [number, number],
): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    return fallback;
  }

  const [min, max] = value;
  if (typeof min !== "number" || typeof max !== "number") {
    return fallback;
  }

  return [min, max];
}

function toSearchFilters(
  filterValues: FilterPanelValues,
  query: string,
  sort: CourseSortOption,
): CourseSearchFilters {
  return {
    query,
    countries: asStringArray(filterValues[filterKeys.country.key]),
    levels: asStringArray(filterValues[filterKeys.level.key]) as CourseLevel[],
    intakes: asStringArray(filterValues[filterKeys.intake.key]),
    tuitionRange: asNumberRange(filterValues[filterKeys.tuition.key], sliderFallbacks.tuition),
    ieltsRange: asNumberRange(filterValues[filterKeys.ielts.key], sliderFallbacks.ielts),
    eligibleOnly: false,
    matchStudent: false,
    sort,
  };
}

export function CourseSearchPage() {
  const navigate = useNavigate();
  const { data: catalog, isLoading, isError } = useUniversitiesCatalog();
  const { data: countries = [] } = useCountries();
  const universities = catalog?.universities ?? [];
  const courses = catalog?.courses ?? [];

  const [filterValues, setFilterValues] = useState<FilterPanelValues>(() =>
    getCourseSearchDefaultFilterValues(
      buildCourseSearchFilterConfig({
        countryCounts: {},
      }),
    ),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<CourseSortOption>(defaultSearchSettings.sort);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);

  const baseResults = useMemo(
    () => buildCourseSearchResults(courses, universities),
    [courses, universities],
  );

  const countryCounts = useMemo(() => getCountryCounts(baseResults), [baseResults]);

  const countryFilterOptions = useMemo(() => {
    const apiOptions = countries
      .map((country) => ({ label: country.name, value: country.code }))
      .filter((option) => option.label && option.value);

    if (apiOptions.length > 0) {
      return apiOptions;
    }

    return courseSearchSettings.filters.country.options.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  }, [countries]);

  const filterConfig = useMemo(() => {
    const config = buildCourseSearchFilterConfig({ countryCounts });
    return config.map((filter) => {
      if (filter.type !== "checkbox-group" || filter.key !== filterKeys.country.key) {
        return filter;
      }

      return {
        ...filter,
        options: countryFilterOptions.map((option) => ({
          label: filterKeys.country.showCounts
            ? `${option.label} (${countryCounts[option.value] ?? 0})`
            : option.label,
          value: option.value,
        })),
      };
    });
  }, [countryCounts, countryFilterOptions]);

  const defaultFilterValues = useMemo(
    () => getCourseSearchDefaultFilterValues(filterConfig),
    [filterConfig],
  );
  const activeFilterCount = countActiveFilters(filterValues, filterConfig, defaultFilterValues);

  const filteredResults = useMemo(() => {
    const filters = toSearchFilters(filterValues, searchQuery, sort);
    const filtered = filterCourseSearchResults(baseResults, filters);
    return sortCourseSearchResults(filtered, sort);
  }, [baseResults, filterValues, searchQuery, sort]);

  const shortlistItems = useMemo(
    () => baseResults.filter((result) => shortlistIds.includes(result.id)),
    [baseResults, shortlistIds],
  );

  const handleToggleShortlist = (courseId: string) => {
    setShortlistIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
  };

  const handleClearFilters = () => {
    setFilterValues(defaultFilterValues);
    setSort(defaultSearchSettings.sort);
    setSearchQuery("");
  };

  const handleApplyFilters = (values: FilterPanelValues) => {
    setFilterValues(values);
    setDrawerOpen(false);
  };

  return (
    <Paper
      elevation={0}
      sx={[
        universitiesPagePaperSx,
        { height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` } },
      ]}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "#edf2f7" }}>
        <PageHeader
          actions={
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{ alignItems: "center" }}
            >
              <GlobalSearchBar
                placeholder={courseSearchSettings.search.placeholder}
                sx={{ width: { xs: "100%", md: 300 } }}
                value={searchQuery}
                onSearch={setSearchQuery}
              />
              <Badge
                badgeContent={activeFilterCount}
                color="primary"
                overlap="rectangular"
                sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontWeight: 700 } }}
              >
                <Button
                  startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
                  variant="outlined"
                  sx={{
                    borderRadius: "9px",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setDrawerOpen(true)}
                >
                  Filters
                </Button>
              </Badge>
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  sx={{ fontSize: 13 }}
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CourseSortOption)}
                >
                  {courseSearchSettings.sort.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          }
          subtitle="Browse courses across partner universities"
          title="Course Search"
        />
      </Box>

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <Box sx={[universitiesContentSx, { display: "flex", flexDirection: "column" }]}>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2.75 }}>
            {isLoading ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Loading courses...
              </Typography>
            ) : isError ? (
              <Typography color="error" sx={{ py: 4, textAlign: "center" }}>
                Failed to load courses. Please try again.
              </Typography>
            ) : (
              <>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "space-between",
                    mb: 1.75,
                  }}
                >
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                      {filteredResults.length}
                    </Box>{" "}
                    courses found
                  </Typography>
                  <Chip
                    clickable
                    label="Reset filters"
                    size="small"
                    sx={{
                      borderColor: "divider",
                      borderRadius: "8px",
                      color: "text.secondary",
                      display: { xs: "none", lg: "inline-flex" },
                      fontWeight: 600,
                    }}
                    variant="outlined"
                    onClick={handleClearFilters}
                  />
                </Stack>

                <Stack spacing={1.25}>
                  {filteredResults.map((result) => (
                    <CourseSearchCard
                      key={result.id}
                      isShortlisted={shortlistIds.includes(result.id)}
                      result={result}
                      onAddToShortlist={() => handleToggleShortlist(result.id)}
                      onViewCourse={() =>
                        navigate(courseDetailsPath(result.universityId, result.id))
                      }
                      onViewUniversity={() =>
                        navigate(universityDetailsPath(result.universityId))
                      }
                    />
                  ))}

                  {filteredResults.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        No courses match your search.
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        Try clearing filters or searching by course, university, or city.
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </>
            )}
          </Box>

          <ShortlistTray
            items={shortlistItems}
            onRemove={(courseId) => handleToggleShortlist(courseId)}
            onSend={() => undefined}
          />
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        slotProps={{ paper: { sx: { display: "flex", flexDirection: "column", width: { xs: "100%", sm: 360 } } } }}
        onClose={() => setDrawerOpen(false)}
      >
        <FilterPanel
          applyButtonLabel={courseSearchSettings.filterPanel.applyButtonLabel}
          filtersConfig={filterConfig}
          sx={{ height: "100%" }}
          title={courseSearchSettings.filterPanel.title}
          values={filterValues}
          width="100%"
          onApplyFilters={handleApplyFilters}
          onFiltersChange={setFilterValues}
        />
      </Drawer>
    </Paper>
  );
}
