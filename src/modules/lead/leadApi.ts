import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type { CreateLeadPayload } from "@/modules/lead/leadForm.types";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  agent: string;
  stage: string;
  lastActivity: string;
  nextAction?: string;
  score: number;
  countries: string[];
  courses: string[];
  intakeDate: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export const leadApi = {
  createLead: async (payload: CreateLeadPayload): Promise<CreateLeadResponse> => {
    const response = await httpClient.post(API_CONFIG.leads, payload);
    return response.data;
  },

  getLeads: async (params?: {
    page?: number;
    pageSize?: number;
    agent?: string;
    country?: string;
    source?: string;
    stage?: string;
    search?: string;
  }): Promise<GetLeadsResponse> => {
    const response = await httpClient.get(API_CONFIG.leads, { params });

    return response.data;
  },

  getLeadById: async (id: string): Promise<{ success: boolean; data: Lead }> => {
    const response = await httpClient.get(`${API_CONFIG.leads}/${id}`);
    return response.data;
  },

  updateLead: async (id: string, payload: Partial<CreateLeadPayload>): Promise<{ success: boolean; data: Lead }> => {
    const response = await httpClient.put(`${API_CONFIG.leads}/${id}`, payload);
    return response.data;
  },

  deleteLead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await httpClient.delete(`${API_CONFIG.leads}/${id}`);
    return response.data;
  }
}