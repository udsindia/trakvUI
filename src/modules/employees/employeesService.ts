import { employeesApi, type BackendEmployeeDevice } from "@/modules/employees/employeesApi";
import type { EmployeeDeviceRow, UpdateEmployeeDevicePayload } from "@/modules/employees/employees.types";

function mapRow(device: BackendEmployeeDevice): EmployeeDeviceRow {
  return {
    userId: device.userId,
    name: device.name ?? device.email,
    email: device.email,
    phone: device.phone ?? "",
    employeeCode: device.employeeCode ?? "",
    tags: device.tags ?? [],
    modelName: device.modelName ?? "",
    appVersion: device.appVersion ?? "",
    registeredAt: device.registeredAt ?? "",
    lastCallAt: device.lastCallAt ?? "",
    lastSyncAt: device.lastSyncAt ?? "",
    leadEnabled: device.leadEnabled,
    callRecordingSyncEnabled: device.callRecordingSyncEnabled,
  };
}

export const employeesService = {
  async list(): Promise<EmployeeDeviceRow[]> {
    const devices = await employeesApi.list();
    return devices.map(mapRow);
  },

  async update(userId: string, payload: UpdateEmployeeDevicePayload): Promise<EmployeeDeviceRow> {
    const device = await employeesApi.update(userId, payload);
    return mapRow(device);
  },
};
