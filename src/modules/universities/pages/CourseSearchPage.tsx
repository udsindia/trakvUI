import { useMemo, useState } from "react";
import {
  Box,
  Chip,
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
import { useUniversitiesCatalog } from "@/modules/universities/useUniversitiesCatalog";
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
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);

  const baseResults = useMemo(
    () => buildCourseSearchResults(courses, universities),
    [courses, universities],
  );

  const countryCounts = useMemo(() => getCountryCounts(baseResults), [baseResults]);

  const filterConfig = useMemo(
    () => buildCourseSearchFilterConfig({ countryCounts }),
    [countryCounts],
  );

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
    setFilterValues(getCourseSearchDefaultFilterValues(filterConfig));
    setSort(defaultSearchSettings.sort);
    setSearchQuery("");
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

      <Box
        sx={{
          display: "grid",
          flex: 1,
          gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0, 1fr)" },
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            borderColor: "#edf2f7",
            borderBottom: { xs: "1px solid", lg: 0 },
            maxHeight: { lg: "100%" },
            minHeight: 0,
            overflow: "hidden",
            px: { xs: 2.5, md: 3, lg: 0 },
            py: { xs: 2.5, md: 3, lg: 3 },
          }}
        >
          <FilterPanel
            applyButtonLabel={courseSearchSettings.filterPanel.applyButtonLabel}
            filtersConfig={filterConfig}
            title={courseSearchSettings.filterPanel.title}
            values={filterValues}
            width={250}
            onApplyFilters={setFilterValues}
            onFiltersChange={setFilterValues}
          />
          <Box sx={{ display: { xs: "block", lg: "none" }, mt: 1, px: 2 }}>
            <Chip
              clickable
              label="Reset filters"
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
            />
          </Box>
        </Box>

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
                    sx={{ display: { xs: "none", lg: "inline-flex" } }}
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
    </Paper>
  );
}
