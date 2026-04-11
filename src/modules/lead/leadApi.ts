import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type { CreateLeadPayload } from "@/modules/lead/leadForm.types";

// Matches backend LeadResponseDTO
export interface BackendLead {
  id: string;
  consultencyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
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
  getLeads: async (): Promise<BackendLead[]> => {
    console.debug("[leadApi] getLeads called");
    const response = await httpClient.get<BackendLead[]>(API_CONFIG.leads);
    console.debug("[leadApi] getLeads response:", response.data);
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

  updateLead: async (id: string, payload: Partial<CreateLeadPayload>): Promise<BackendLead> => {
    const response = await httpClient.put<BackendLead>(`${API_CONFIG.leads}/${id}`, payload);
    return response.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.leads}/${id}`);
  },
};
