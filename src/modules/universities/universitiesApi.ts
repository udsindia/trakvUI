import { API_CONFIG } from "@/config/api/config";
import { createAuthRequestConfig } from "@/shared/services/http/authHeaders";
import { httpClient } from "@/shared/services/http/client";
import type {
  CountryDto,
  CourseImportCommitPayload,
  CourseImportPreviewResponse,
  CourseImportResultResponse,
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
  UniversityImportCommitPayload,
  UniversityImportPreviewResponse,
  UniversityImportResultResponse,
  UniversitySummaryDto,
  UpdateUniversityPayload,
} from "@/modules/universities/universitiesApi.types";

const DEFAULT_PAGE_SIZE = 100;

/**
 * Builds the multipart body + config for a CSV upload.
 *
 * The auth config sets a JSON Content-Type; axios must own that header for multipart so
 * it can append the boundary. Depending on the axios version `headers` is either an
 * AxiosHeaders instance (has .delete) or a plain object, hence the guarded removal.
 */
function buildCsvUpload(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const config = createAuthRequestConfig();

  try {
    if (config.headers && typeof (config.headers as any).delete === "function") {
      (config.headers as any).delete("Content-Type");
    }
  } catch {
    // ignore header adjustment failures and proceed — axios will attempt to set headers
  }
  config.headers = {
    ...config.headers,
    "Content-Type": "multipart/form-data",
  };

  return { formData, config };
}

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

  /** Parses + validates the CSV and reports what would happen — writes nothing. */
  previewCourseImport: async (file: File): Promise<CourseImportPreviewResponse> => {
    const { formData, config } = buildCsvUpload(file);

    const response = await httpClient.post<CourseImportPreviewResponse>(
      `${API_CONFIG.adminCourses}/import/preview`,
      formData,
      config,
    );

    return response.data;
  },

  /** Actually performs the import for the reviewed rows returned by previewCourseImport. */
  commitCourseImport: async (payload: CourseImportCommitPayload): Promise<CourseImportResultResponse> => {
    const response = await httpClient.post<CourseImportResultResponse>(
      `${API_CONFIG.adminCourses}/import/commit`,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  /** Same two-phase flow as the course import, but the unit is a university. */
  previewUniversityImport: async (file: File): Promise<UniversityImportPreviewResponse> => {
    const { formData, config } = buildCsvUpload(file);

    const response = await httpClient.post<UniversityImportPreviewResponse>(
      `${API_CONFIG.adminUniversities}/import/preview`,
      formData,
      config,
    );

    return response.data;
  },

  commitUniversityImport: async (
    payload: UniversityImportCommitPayload,
  ): Promise<UniversityImportResultResponse> => {
    const response = await httpClient.post<UniversityImportResultResponse>(
      `${API_CONFIG.adminUniversities}/import/commit`,
      payload,
      createAuthRequestConfig(),
    );
    return response.data;
  },

  /** CSV template with the expected university columns, served by the backend. */
  downloadUniversityImportTemplate: async (): Promise<string> => {
    const response = await httpClient.get<string>(
      `${API_CONFIG.adminUniversities}/import/template`,
      { ...createAuthRequestConfig(), responseType: "text" },
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
