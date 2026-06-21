import axios from "axios";
import type { SaRole, SaUser } from "./sa.types";
import { saAuthService } from "./saAuthService";

const SA_API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api";

const saClient = axios.create({ baseURL: SA_API_BASE });

saClient.interceptors.request.use((config) => {
  const token = saAuthService.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const saTeamApi = {
  // Users
  listUsers: async (): Promise<SaUser[]> => {
    const { data } = await saClient.get<SaUser[]>("/superadmin/sa-team/users");
    return data;
  },

  inviteUser: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    saRoleId: string;
  }): Promise<SaUser> => {
    const { data } = await saClient.post<SaUser>("/superadmin/sa-team/users", payload);
    return data;
  },

  updateUserRole: async (userId: string, saRoleId: string): Promise<SaUser> => {
    const { data } = await saClient.patch<SaUser>(
      `/superadmin/sa-team/users/${userId}/role`,
      { saRoleId },
    );
    return data;
  },

  deactivateUser: async (userId: string): Promise<void> => {
    await saClient.patch(`/superadmin/sa-team/users/${userId}/deactivate`);
  },

  reactivateUser: async (userId: string): Promise<void> => {
    await saClient.patch(`/superadmin/sa-team/users/${userId}/reactivate`);
  },

  // Roles
  listRoles: async (): Promise<SaRole[]> => {
    const { data } = await saClient.get<SaRole[]>("/superadmin/sa-team/roles");
    return data;
  },

  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<SaRole> => {
    const { data } = await saClient.put<SaRole>(
      `/superadmin/sa-team/roles/${roleId}/permissions`,
      { permissions },
    );
    return data;
  },
};
