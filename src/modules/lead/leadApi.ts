import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type { CreateLeadPayload } from "@/modules/lead/leadForm.types";

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  leadStage?: string;
  assignedToId?: string;
  assignedToName?: string;
};

// Matches backend LeadResponseDTO
export interface BackendLead {
  id: string;
  consultancyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isArchived: boolean;
  leadStage: string;
  assignedToId: string;
  assignedToName: string;
  sourceName: string;
  score: number | null;
  destinationCountries: string[];
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SortDirection = "ASC" | "DESC";

export type CourseSearchInstitution = {
  id?: string;
  name: string;
};

export type CourseSearchRequest = {
  destinations?: string[];
  institutions?: CourseSearchInstitution[];
  nearestCity?: string;
  intakeMonths?: string[];
  intakeYears?: number[];
  intakeAvailableOnly?: boolean;
  courseLevels?: string[];
  disciplines?: string[];
  minDurationMonths?: number;
  maxDurationMonths?: number;
  postStudyWorkPermit?: boolean;
  studentId?: string;
  page?: number;
  size?: number;
};

export type CourseSearchResultItem = {
  id?: string;
  courseId?: string;
  name?: string;
  courseName?: string;
  title?: string;
  universityName?: string;
  institutionName?: string;
  destination?: string;
  country?: string;
  city?: string;
  nearestCity?: string;
  studentEmail?: string;
  email?: string;
  phone?: string;
  studentPhone?: string;
  createdAt?: string;
  score?: number;
  [key: string]: unknown;
};

export type CourseSearchResponse = {
  content?: CourseSearchResultItem[];
  items?: CourseSearchResultItem[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  [key: string]: unknown;
};

export interface PaginatedLeadsResponse {
  content: BackendLead[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export type GetLeadsPaginatedParams = {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: SortDirection;
};

/** Full lead detail (matches backend LeadDetailsResponseDTO). */
export interface LeadDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  leadStage: string;
  score: number | null;
  sourceId: string | null;
  sourceName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  destinationCountries: string[] | null;
  fieldOfStudy: string | null;
  currentStudyLevel: string | null;
  isWhatsAppAvailable: boolean | null;
  englishProficiencyTest: string | null;
  englishProficiencyTestScore: string | null;
  college: string | null;
  createdAt: string | null;
  lastActivityAt: string | null;
  targetIntakeMonth: string | null;
  targetIntakeYear: number | null;
  courseInterests: string[] | null;
  studyLevels: string[] | null;
  budgetMinInr: number | null;
  budgetMaxInr: number | null;
  notes: string | null;
}

/** Result of a CSV bulk import (matches backend ImportResponseDTO). */
export interface LeadImportSkip {
  row: number;
  reason: string;
}
export interface LeadImportResult {
  importBatchId: string;
  imported: number;
  leads: BackendLead[];
  skippedReasons: LeadImportSkip[];
}

export const leadApi = {
  getLeadCount: async (): Promise<number> => {
    const response = await httpClient.get<{ count: number }>(`${API_CONFIG.leads}/count`);
    return response.data.count;
  },

  getLeads: async (): Promise<BackendLead[]> => {
    console.debug("[leadApi] getLeads called");
    const response = await httpClient.get<BackendLead[]>(API_CONFIG.leads);
    console.debug("[leadApi] getLeads response:", response.data);
    return response.data;
  },

  getLeadsPaginated: async ({
    page,
    size,
    sortBy = "createdAt",
    sortDirection = "DESC",
  }: GetLeadsPaginatedParams): Promise<PaginatedLeadsResponse> => {
    const response = await httpClient.get<PaginatedLeadsResponse>(`${API_CONFIG.leads}/paginated`, {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
      },
    });
    return response.data;
  },

  searchCourses: async (payload: CourseSearchRequest): Promise<CourseSearchResponse> => {
    const response = await httpClient.get<CourseSearchResponse>(`${API_CONFIG.courses}/search`, { params: payload });
    return response.data;
  },

  // Distinct filter values, sourced from the backend so the drawer reflects the
  // tenant's real data rather than a hardcoded list.
  getSources: async (): Promise<string[]> => {
    const response = await httpClient.get<string[]>(`${API_CONFIG.leads}/sources`);
    return response.data;
  },

  getCountries: async (): Promise<string[]> => {
    const response = await httpClient.get<string[]>(`${API_CONFIG.leads}/countries`);
    return response.data;
  },

  createLead: async (payload: CreateLeadPayload): Promise<BackendLead> => {
    console.debug("[leadApi] createLead payload:", payload);
    const response = await httpClient.post<BackendLead>(API_CONFIG.leads, payload);
    return response.data;
  },

  getLeadById: async (id: string): Promise<BackendLead> => {
    const response = await httpClient.get<BackendLead>(`${API_CONFIG.leads}/${id}`);
    return response.data;
  },

  /** Full lead detail for the details page (GET /api/leads/{id}). */
  getLeadDetails: async (id: string): Promise<LeadDetails> => {
    const response = await httpClient.get<LeadDetails>(`${API_CONFIG.leads}/${id}`);
    return response.data;
  },

  updateLead: async (id: string, payload: UpdateLeadPayload): Promise<BackendLead> => {
    const response = await httpClient.patch<BackendLead>(`${API_CONFIG.leads}/${id}`, payload);
    return response.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.leads}/${id}`);
  },

  bulkUpdateLeads: async (
    leadIds: string[],
    updates: UpdateLeadPayload,
  ): Promise<BackendLead[]> => {
    const response = await httpClient.post<BackendLead[]>(`${API_CONFIG.leads}/bulk`, {
      leadIds,
      updates,
    });
    return response.data;
  },

  /** Bulk-import leads from a CSV file (POST /api/leads/import, multipart). */
  /** Detects the column headers in a file the user is about to import, for a mapping step. */
  detectImportColumns: async (file: File): Promise<string[]> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<{ headers: string[] }>(
      `${API_CONFIG.leads}/import/columns`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.headers;
  },

  /**
   * @param mapping our field name -> the file's column header to read it from.
   * @param collegeName when set, every row in the batch is imported with Lead Source
   *                    "College" and this as its college name, regardless of mapping.
   */
  importLeads: async (
    file: File,
    mapping?: Record<string, string>,
    collegeName?: string,
  ): Promise<LeadImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    if (mapping) {
      for (const [field, header] of Object.entries(mapping)) {
        if (header) formData.append(`mapping_${field}`, header);
      }
    }
    if (collegeName) formData.append("collegeName", collegeName);
    const response = await httpClient.post<LeadImportResult>(
      `${API_CONFIG.leads}/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },
};
