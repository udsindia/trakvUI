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
};
