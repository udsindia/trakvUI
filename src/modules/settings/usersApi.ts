import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";

export interface BackendUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  role?: string;
  supervisorId?: string;
  active?: boolean;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  roleId?: string;
  supervisorId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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

  updateUser: async (userId: string, payload: UpdateUserPayload): Promise<BackendUser> => {
    const response = await httpClient.patch<BackendUser>(
      `${API_CONFIG.users}/${userId}`,
      payload,
    );
    return response.data;
  },

  setUserActive: async (tenantId: string, userId: string, active: 'deactivate' | 'reactivate') => {
    const response = await httpClient.patch(
      `${API_CONFIG.users}/${userId}/${active}`,
      {
        tenantId,
        active,
      },
    );
    return response.data;
  },
};
