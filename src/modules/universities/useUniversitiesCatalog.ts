import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { universitiesApi } from "@/modules/universities/universitiesApi";
import type { CreateRequirementPayload } from "@/modules/universities/universitiesApi.types";
import {
  mapCourseToUi,
  mapUniversityDetailToUi,
} from "@/modules/universities/universitiesMappers";
import {
  universitiesCatalogQueryKey,
  universitiesCatalogService,
  universityCoursesQueryKey,
  universityQueryKey,
  type CourseInput,
  type UniversityInput,
} from "@/modules/universities/universitiesCatalogService";
import { resolveAccessToken } from "@/shared/services/http/authHeaders";

function useUniversitiesApiEnabled(extraEnabled = true) {
  const { isInitializing } = useAuth();
  const hasToken = Boolean(resolveAccessToken());

  return extraEnabled && hasToken && !isInitializing;
}

export const countriesQueryKey = ["universities", "countries"] as const;
export const universitiesByCountryQueryKey = (countryCode: string) =>
  ["universities", "by-country", countryCode] as const;

export function useUniversitiesCatalog() {
  const apiEnabled = useUniversitiesApiEnabled();

  return useQuery({
    queryKey: universitiesCatalogQueryKey,
    queryFn: () => universitiesCatalogService.getCatalog(),
    enabled: apiEnabled,
  });
}

export function useCountries() {
  const apiEnabled = useUniversitiesApiEnabled();

  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: () => universitiesApi.listCountries(),
    enabled: apiEnabled,
  });
}

export function useUniversitiesByCountry(countryCode: string | undefined) {
  const apiEnabled = useUniversitiesApiEnabled(Boolean(countryCode));

  return useQuery({
    queryKey: universitiesByCountryQueryKey(countryCode ?? ""),
    queryFn: async () => {
      if (!countryCode) {
        return [];
      }
      return universitiesApi.listAllUniversities({ countryCode });
    },
    enabled: apiEnabled,
  });
}

export function useUniversity(universityId: string | undefined) {
  const apiEnabled = useUniversitiesApiEnabled(Boolean(universityId));

  return useQuery({
    queryKey: universityQueryKey(universityId ?? ""),
    queryFn: async () => {
      if (!universityId) {
        return undefined;
      }

      const detail = await universitiesApi.getUniversity(universityId);
      return mapUniversityDetailToUi(detail);
    },
    enabled: apiEnabled,
  });
}

export function useUniversityCourses(universityId: string | undefined) {
  const apiEnabled = useUniversitiesApiEnabled(Boolean(universityId));

  return useQuery({
    queryKey: universityCoursesQueryKey(universityId ?? ""),
    queryFn: async () => {
      if (!universityId) {
        return [];
      }

      const courses = await universitiesApi.listAllUniversityCourses(universityId);
      return courses.map((course) => mapCourseToUi(course, universityId));
    },
    enabled: apiEnabled,
  });
}

/** Raw course DTOs for forms that need studyLevel and other API fields. */
export function useUniversityCourseOptions(universityId: string | undefined) {
  const apiEnabled = useUniversitiesApiEnabled(Boolean(universityId));

  return useQuery({
    queryKey: [...universityCoursesQueryKey(universityId ?? ""), "options"] as const,
    queryFn: async () => {
      if (!universityId) {
        return [];
      }
      return universitiesApi.listAllUniversityCourses(universityId);
    },
    enabled: apiEnabled,
  });
}

export function useUniversityMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: universitiesCatalogQueryKey });
    queryClient.invalidateQueries({ queryKey: ["universities"] });
  };

  const saveUniversityMutation = useMutation({
    mutationFn: (input: UniversityInput) => universitiesCatalogService.saveUniversity(input),
    onSuccess: invalidateAll,
  });

  const saveCourseMutation = useMutation({
    mutationFn: (input: CourseInput) => universitiesCatalogService.saveCourse(input),
    onSuccess: invalidateAll,
  });

  const createRequirementMutation = useMutation({
    mutationFn: ({
      universityId,
      payload,
    }: {
      universityId: string;
      payload: CreateRequirementPayload;
    }) => universitiesApi.createRequirement(universityId, payload),
    onSuccess: invalidateAll,
  });

  return {
    saveUniversityMutation,
    saveCourseMutation,
    createRequirementMutation,
  };
}
