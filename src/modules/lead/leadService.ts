import { leadApi } from "@/modules/lead/leadApi";
import type { CreateLeadPayload } from "@/modules/lead/leadForm.types";

export const leadService = {
  createLead: async (payload: CreateLeadPayload) => {
    return await leadApi.createLead(payload);
  },

  getLeads: async () => {
    return await leadApi.getLeads();
  },

  getLeadById: async (id: string) => {
    return await leadApi.getLeadById(id);
  },

  updateLead: async (id: string, payload: Partial<CreateLeadPayload>) => {
    return await leadApi.updateLead(id, payload);
  },

  deleteLead: async (id: string) => {
    return await leadApi.deleteLead(id);
  },
};
