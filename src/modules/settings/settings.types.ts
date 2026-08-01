import type { PermissionKey } from "@/config/permissions/permissions";
import type { RoleKey } from "@/config/roles/roles";

export type RoleDefinitionType = "system" | "custom";

/** Visibility scope a role grants its users: own records / their team / whole tenant. */
export type RoleScope = "SELF" | "TEAM" | "TENANT";

export interface RoleDefinition {
  id: string;
  roleName: string;
  name: string;
  description?: string;
  scopeLevel: RoleScope;
  permissions: PermissionKey[];
  type: RoleDefinitionType;
  systemRoleKey?: RoleKey;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  roleLabel: string;
  supervisorId?: string;
  active: boolean;
}

export interface CreateTenantUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  supervisorId?: string;
  tenantId: string;
}

export interface CreateCustomRolePayload {
  name: string;
  description?: string;
  scopeLevel: RoleScope;
  permissions: PermissionKey[];
}

export interface UpdateCustomRolePayload {
  name: string;
  description?: string;
  scopeLevel: RoleScope;
  permissions: PermissionKey[];
}

export interface AddUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  supervisorId: string;
}

export interface RoleFormValues {
  name: string;
  description: string;
  scopeLevel: RoleScope;
  permissions: PermissionKey[];
}
