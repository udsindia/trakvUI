export interface EmployeeDeviceRow {
  userId: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  tags: string[];
  modelName: string;
  appVersion: string;
  registeredAt: string;
  lastCallAt: string;
  lastSyncAt: string;
  leadEnabled: boolean;
  callRecordingSyncEnabled: boolean;
}

export interface UpdateEmployeeDevicePayload {
  employeeCode?: string;
  tags?: string[];
  leadEnabled?: boolean;
  callRecordingSyncEnabled?: boolean;
}
