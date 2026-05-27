import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type { CreateApplicationPayload, UpdateVisaPayload, ApplicationStage } from "@/modules/applications/applicationForm.types";

export interface BackendApplication {
  id: string;
  leadId?: string;
  studentName: string;
  email: string;
  phone: string;
  targetCountry: string;
  targetUniversity: string;
  course: string;
  intakeMonth: string;
  intakeYear: number;
  stage: ApplicationStage;
  createdAt: string;
  updatedAt: string;
  visaDetails?: UpdateVisaPayload;
}

export const applicationsApi = {
  getApplications: async (): Promise<BackendApplication[]> => {
    console.debug("[applicationsApi] getApplications called");
    const response = await httpClient.get<BackendApplication[]>(API_CONFIG.applications);
    return response.data;
  },

  createApplication: async (payload: CreateApplicationPayload): Promise<BackendApplication> => {
    const response = await httpClient.post<BackendApplication>(API_CONFIG.applications, payload);
    return response.data;
  },

  getApplicationById: async (id: string): Promise<BackendApplication> => {
    const response = await httpClient.get<BackendApplication>(`${API_CONFIG.applications}/${id}`);
    return response.data;
  },

  updateApplication: async (id: string, payload: Partial<CreateApplicationPayload>): Promise<BackendApplication> => {
    const response = await httpClient.put<BackendApplication>(`${API_CONFIG.applications}/${id}`, payload);
    return response.data;
  },

  updateVisaDetails: async (id: string, payload: UpdateVisaPayload): Promise<BackendApplication> => {
    const response = await httpClient.put<BackendApplication>(`${API_CONFIG.applications}/${id}/visa`, payload);
    return response.data;
  },

  deleteApplication: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.applications}/${id}`);
  },
};
