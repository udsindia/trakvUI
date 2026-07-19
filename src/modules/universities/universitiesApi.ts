import { API_CONFIG } from "@/config/api/config";
import { createAuthRequestConfig } from "@/shared/services/http/authHeaders";
import { httpClient } from "@/shared/services/http/client";
import type {
  CountryDto,
  CreateCoursePayload,
  CreateRequirementPayload,
  CreateUniversityPayload,
  CourseDto,
  CreatedCourseDto,
  CreatedRequirementDto,
  CreatedUniversityDto,
  ListUniversitiesParams,
  ListUniversityCoursesParams,
  UniversitiesPageResponse,
  UniversityCoursesPageResponse,
  UniversityDetailDto,
  UniversitySummaryDto,
  UpdateUniversityPayload,
} from "@/modules/universities/universitiesApi.types";

const DEFAULT_PAGE_SIZE = 100;

async function fetchAllUniversityPages<T>(
  fetchPage: (page: number, size: number) => Promise<UniversitiesPageResponse<T>>,
): Promise<T[]> {
  const firstPage = await fetchPage(0, DEFAULT_PAGE_SIZE);
  const allItems = [...firstPage.content];
  const totalPages = Math.ceil(firstPage.totalElements / firstPage.size);

  for (let page = 1; page < totalPages; page += 1) {
    const nextPage = await fetchPage(page, DEFAULT_PAGE_SIZE);
    allItems.push(...nextPage.content);
  }

  return allItems;
}

async function fetchAllCoursePages(
  universityId: string,
  params: Omit<ListUniversityCoursesParams, "page" | "size"> = {},
): Promise<CourseDto[]> {
  const fetchPage = async (page: number, size: number) => {
    const response = await httpClient.get<UniversityCoursesPageResponse>(
      `${API_CONFIG.universities}/${universityId}/courses`,
      createAuthRequestConfig({
        params: { availableOnly: false, ...params, page, size },
      }),
    );
    return response.data;
  };

  const firstPage = await fetchPage(0, DEFAULT_PAGE_SIZE);
  const allItems = [...firstPage.content];
  const totalPages = Math.ceil(firstPage.totalElements / firstPage.size);

  for (let page = 1; page < totalPages; page += 1) {
    const nextPage = await fetchPage(page, DEFAULT_PAGE_SIZE);
    allItems.push(...nextPage.content);
  }

  return allItems;
}

export const universitiesApi = {
  listUniversities: async (
    params: ListUniversitiesParams = {},
  ): Promise<UniversitiesPageResponse<UniversitySummaryDto>> => {
    const response = await httpClient.get<UniversitiesPageResponse<UniversitySummaryDto>>(
      API_CONFIG.universities,
      createAuthRequestConfig({ params }),
    );
    return response.data;
  },

  listAllUniversities: async (
    params: Omit<ListUniversitiesParams, "page" | "size"> = {},
  ): Promise<UniversitySummaryDto[]> => {
    return fetchAllUniversityPages((page, size) =>
      universitiesApi.listUniversities({ ...params, page, size }),
    );
  },

  listCountries: async (): Promise<CountryDto[]> => {
    const response = await httpClient.get<CountryDto[]>(
      `${API_CONFIG.universities}/countries`,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  getUniversity: async (universityId: string): Promise<UniversityDetailDto> => {
    const response = await httpClient.get<UniversityDetailDto>(
      `${API_CONFIG.universities}/${universityId}`,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  listUniversityCourses: async (
    universityId: string,
    params: ListUniversityCoursesParams = {},
  ): Promise<UniversityCoursesPageResponse> => {
    const response = await httpClient.get<UniversityCoursesPageResponse>(
      `${API_CONFIG.universities}/${universityId}/courses`,
      createAuthRequestConfig({
        params: { availableOnly: false, ...params },
      }),
    );
    return response.data;
  },

  listAllUniversityCourses: async (
    universityId: string,
    params: Omit<ListUniversityCoursesParams, "page" | "size"> = {},
  ): Promise<CourseDto[]> => {
    return fetchAllCoursePages(universityId, params);
  },

  createUniversity: async (payload: CreateUniversityPayload): Promise<CreatedUniversityDto> => {
    const response = await httpClient.post<CreatedUniversityDto>(
      API_CONFIG.adminUniversities,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  updateUniversity: async (
    universityId: string,
    payload: UpdateUniversityPayload,
  ): Promise<UniversityDetailDto> => {
    const response = await httpClient.patch<UniversityDetailDto>(
      `${API_CONFIG.adminUniversities}/${universityId}`,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  createCourse: async (
    universityId: string,
    payload: CreateCoursePayload,
  ): Promise<CreatedCourseDto> => {
    const response = await httpClient.post<CreatedCourseDto>(
      `${API_CONFIG.adminUniversities}/${universityId}/courses`,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  createRequirement: async (
    universityId: string,
    payload: CreateRequirementPayload,
  ): Promise<CreatedRequirementDto> => {
    const response = await httpClient.post<CreatedRequirementDto>(
      `${API_CONFIG.adminUniversities}/${universityId}/requirements`,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },
};
