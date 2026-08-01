import { isMockAuthEnabled } from "@/app/auth/authService";
import { ROLE_LABELS, ROLES, type RoleKey } from "@/config/roles/roles";
import { ROLE_PERMISSION_MAP } from "@/config/permissions/permissions";
import { customRolesStorage } from "@/modules/settings/customRolesStorage";
import { rolesApi, type BackendRole } from "@/modules/settings/rolesApi";
import type {
  CreateCustomRolePayload,
  RoleDefinition,
  RoleScope,
  UpdateCustomRolePayload,
} from "@/modules/settings/settings.types";

/** Fixed scope of the built-in system roles (mirrors the backend seed). */
const SYSTEM_ROLE_SCOPE: Record<RoleKey, RoleScope> = {
  [ROLES.SUPER_ADMIN]: "TENANT",
  [ROLES.AGENCY_ADMIN]: "TENANT",
  [ROLES.MANAGER]: "TEAM",
  [ROLES.COUNSELLOR]: "SELF",
  [ROLES.LEAD_MANAGER]: "SELF",
};
import { formatScreamingSnakeLabel } from "@/shared/utils/formatLabel";

const MOCK_LATENCY_MS = 300;

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function buildSystemRoles(): RoleDefinition[] {
  return (Object.values(ROLES) as RoleKey[]).map((roleKey) => ({
    id: roleKey,
    roleName: roleKey.toUpperCase(),
    name: ROLE_LABELS[roleKey],
    description: "Built-in workspace role",
    scopeLevel: SYSTEM_ROLE_SCOPE[roleKey],
    permissions: ROLE_PERMISSION_MAP[roleKey],
    type: "system" as const,
    systemRoleKey: roleKey,
  }));
}

function mapBackendRole(role: BackendRole): RoleDefinition {
  return {
    id: role.id,
    roleName: role.roleName,
    name: formatScreamingSnakeLabel(role.roleName),
    description: role.description,
    scopeLevel: (role.scopeLevel as RoleScope) ?? "SELF",
    permissions: role.permissions.map((permission) => permission.permissionName),
    type: role.system ? "system" : "custom",
  };
}

function toUpsertPayload(payload: CreateCustomRolePayload | UpdateCustomRolePayload) {
  return {
    roleName: payload.name.trim().replace(/\s+/g, "_").toUpperCase(),
    description: payload.description,
    scopeLevel: payload.scopeLevel,
    permissions: payload.permissions,
  };
}

export const rolesService = {
  async getRoles(tenantId: string): Promise<RoleDefinition[]> {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      return [...buildSystemRoles(), ...customRolesStorage.list(tenantId)];
    }

    try {
      const backendRoles = await rolesApi.getRoles();
      return backendRoles.map(mapBackendRole);
    } catch {
      return [...buildSystemRoles(), ...customRolesStorage.list(tenantId)];
    }
  },

  async getRoleById(tenantId: string, roleId: string): Promise<RoleDefinition | null> {
    const roles = await this.getRoles(tenantId);
    return roles.find((role) => role.id === roleId) ?? null;
  },

  async createCustomRole(tenantId: string, payload: CreateCustomRolePayload) {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      return customRolesStorage.create(tenantId, payload);
    }

    try {
      const createdRole = await rolesApi.createRole(toUpsertPayload(payload));
      return mapBackendRole(createdRole);
    } catch {
      return customRolesStorage.create(tenantId, payload);
    }
  },

  async updateCustomRole(
    tenantId: string,
    roleId: string,
    payload: UpdateCustomRolePayload,
  ) {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      return customRolesStorage.update(tenantId, roleId, payload);
    }

    try {
      const updatedRole = await rolesApi.updateRole(roleId, toUpsertPayload(payload));
      return mapBackendRole(updatedRole);
    } catch {
      return customRolesStorage.update(tenantId, roleId, payload);
    }
  },

  async deleteCustomRole(tenantId: string, roleId: string) {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      customRolesStorage.remove(tenantId, roleId);
      return;
    }

    try {
      await rolesApi.deleteRole(roleId);
    } catch {
      customRolesStorage.remove(tenantId, roleId);
    }
  },
};
