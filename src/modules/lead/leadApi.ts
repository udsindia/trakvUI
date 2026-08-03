import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type { CreateLeadPayload } from "@/modules/lead/leadForm.types";

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  leadStage?: string;
  assignedToId?: string;
  assignedToName?: string;
};

// Matches backend LeadService.checkDuplicate result
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: BackendLead[];
}

// Matches backend LeadDetailsResponseDTO (GET /leads/{id})
export interface LeadDetails {
  targetIntakeMonth: string | null;
  targetIntakeYear: number | null;
  courseInterests: string[] | null;
  studyLevels: string[] | null;
  notes: string | null;
}

// Matches backend ImportResponseDTO
export interface ImportLeadsResult {
  importBatchId: string;
  totalSubmitted: number;
  imported: number;
  skipped: number;
  skippedReasons: { row: number; reason: string }[];
}

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

  // GET /leads/{id} returns the extended detail DTO (intake / courses / notes),
  // used to prefill the edit form alongside the list row's identity fields.
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

  checkDuplicate: async (params: { email?: string; phone?: string }): Promise<DuplicateCheckResult> => {
    const response = await httpClient.get<DuplicateCheckResult>(
      `${API_CONFIG.leads}/duplicate-check`,
      { params },
    );
    return response.data;
  },

  importLeads: async (file: File): Promise<ImportLeadsResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<ImportLeadsResult>(
      `${API_CONFIG.leads}/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
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
