import { API_CONFIG } from "@/config/api/config";
import type { PermissionKey } from "@/config/permissions/permissions";
import { httpClient } from "@/shared/services/http/client";

export interface BackendPermission {
  id: string;
  permissionName: PermissionKey;
  createdAt?: string;
}

export interface BackendRole {
  id: string;
  roleName: string;
  description?: string;
  permissions: BackendPermission[];
  system?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertRolePayload {
  roleName: string;
  description?: string;
  permissions: PermissionKey[];
}

export const rolesApi = {
  getRoles: async (): Promise<BackendRole[]> => {
    const response = await httpClient.get<BackendRole[]>(API_CONFIG.roles);
    return response.data;
  },

  createRole: async (payload: UpsertRolePayload): Promise<BackendRole> => {
    const response = await httpClient.post<BackendRole>(API_CONFIG.roles, payload);
    return response.data;
  },

  updateRole: async (roleId: string, payload: UpsertRolePayload): Promise<BackendRole> => {
    const response = await httpClient.put<BackendRole>(`${API_CONFIG.roles}/${roleId}`, payload);
    return response.data;
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.roles}/${roleId}`);
  },
};
