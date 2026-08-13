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
  sourceName: string | null;
  assignedToName: string | null;
  destinationCountries: string[] | null;
  fieldOfStudy: string | null;
  currentStudyLevel: string | null;
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
  importLeads: async (file: File): Promise<LeadImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<LeadImportResult>(
      `${API_CONFIG.leads}/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },
};
