import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";
import type { UpdateEmployeeDevicePayload } from "@/modules/employees/employees.types";

export interface BackendEmployeeDevice {
  userId: string;
  name?: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  tags?: string[];
  modelName?: string;
  appVersion?: string;
  registeredAt?: string;
  lastCallAt?: string;
  lastSyncAt?: string;
  leadEnabled: boolean;
  callRecordingSyncEnabled: boolean;
}

export const employeesApi = {
  list: async (): Promise<BackendEmployeeDevice[]> => {
    const response = await httpClient.get<BackendEmployeeDevice[]>(API_CONFIG.employeeDevices);
    return response.data;
  },

  update: async (userId: string, payload: UpdateEmployeeDevicePayload): Promise<BackendEmployeeDevice> => {
    const response = await httpClient.patch<BackendEmployeeDevice>(
      `${API_CONFIG.employeeDevices}/${userId}`,
      payload,
    );
    return response.data;
  },
};
