import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";

export interface BackendUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  roleId?: string;
  role?: string;
  active?: boolean;
  isActive?: boolean;
}

export const usersApi = {
  getUsers: async (tenantId: string): Promise<BackendUser[]> => {
    const response = await httpClient.get<BackendUser[]>(
      `${API_CONFIG.users}`,
      {
        params: { tenantId },
      },
    );
    return response.data;
  },

  setUserActive: async (tenantId: string, userId: string, active: boolean) => {
    const response = await httpClient.patch(
      `${API_CONFIG.users}/${userId}/active`,
      {
        tenantId,
        active,
      },
    );
    return response.data;
  },
};
