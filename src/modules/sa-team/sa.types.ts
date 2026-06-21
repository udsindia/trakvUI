export interface SaUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  roleName: string;
  roleDisplayName: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SaRole {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  system: boolean;
  permissions: string[];
}

export interface SaSession {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    roleName: string;
    roleDisplayName: string;
  };
  permissions: string[];
}

export interface InviteSaUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  saRoleId: string;
}

export interface UpdateSaRolePermissionsPayload {
  permissions: string[];
}
