import type {
  CreateCustomRolePayload,
  RoleDefinition,
} from "@/modules/settings/settings.types";

const CUSTOM_ROLES_STORAGE_PREFIX = "edutrack.customRoles";

function getStorageKey(tenantId: string) {
  return `${CUSTOM_ROLES_STORAGE_PREFIX}.${tenantId}`;
}

function readCustomRoles(tenantId: string): RoleDefinition[] {
  if (typeof window === "undefined") {
    return [];
  }

  const serialized = window.localStorage.getItem(getStorageKey(tenantId));

  if (!serialized) {
    return [];
  }

  try {
    return JSON.parse(serialized) as RoleDefinition[];
  } catch {
    return [];
  }
}

function writeCustomRoles(tenantId: string, roles: RoleDefinition[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(tenantId), JSON.stringify(roles));
}

function slugifyRoleName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const customRolesStorage = {
  list(tenantId: string) {
    return readCustomRoles(tenantId);
  },

  create(tenantId: string, payload: CreateCustomRolePayload) {
    const existingRoles = readCustomRoles(tenantId);
    const baseId = `custom_${slugifyRoleName(payload.name) || "role"}`;
    let roleId = baseId;
    let suffix = 1;

    while (existingRoles.some((role) => role.id === roleId)) {
      roleId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const roleName = payload.name.trim().replace(/\s+/g, "_").toUpperCase();
    const role: RoleDefinition = {
      id: roleId,
      roleName,
      name: payload.name.trim(),
      description: payload.description?.trim(),
      permissions: payload.permissions,
      type: "custom",
    };

    writeCustomRoles(tenantId, [...existingRoles, role]);

    return role;
  },

  update(tenantId: string, roleId: string, payload: CreateCustomRolePayload) {
    const existingRoles = readCustomRoles(tenantId);
    const roleIndex = existingRoles.findIndex((role) => role.id === roleId);

    if (roleIndex === -1) {
      throw new Error("Custom role not found.");
    }

    const updatedRole: RoleDefinition = {
      ...existingRoles[roleIndex],
      roleName: payload.name.trim().replace(/\s+/g, "_").toUpperCase(),
      name: payload.name.trim(),
      description: payload.description?.trim(),
      permissions: payload.permissions,
    };

    const nextRoles = [...existingRoles];
    nextRoles[roleIndex] = updatedRole;
    writeCustomRoles(tenantId, nextRoles);

    return updatedRole;
  },

  remove(tenantId: string, roleId: string) {
    const existingRoles = readCustomRoles(tenantId);
    writeCustomRoles(
      tenantId,
      existingRoles.filter((role) => role.id !== roleId),
    );
  },

  getById(tenantId: string, roleId: string) {
    return readCustomRoles(tenantId).find((role) => role.id === roleId) ?? null;
  },
};
