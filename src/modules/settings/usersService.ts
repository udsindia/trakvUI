import { authService, isMockAuthEnabled } from "@/app/auth/authService";
import { usersApi, type BackendUser, type UpdateUserPayload } from "@/modules/settings/usersApi";
import type {
  CreateTenantUserPayload,
  TenantUser,
} from "@/modules/settings/settings.types";

const MOCK_LATENCY_MS = 300;
const MOCK_USERS_STORAGE_PREFIX = "edutrack.mockUsers";

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function readMockUsers(tenantId: string): TenantUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  const serialized = window.localStorage.getItem(
    `${MOCK_USERS_STORAGE_PREFIX}.${tenantId}`,
  );

  if (!serialized) {
    return [];
  }

  try {
    return JSON.parse(serialized) as TenantUser[];
  } catch {
    return [];
  }
}

function writeMockUsers(tenantId: string, users: TenantUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    `${MOCK_USERS_STORAGE_PREFIX}.${tenantId}`,
    JSON.stringify(users),
  );
}

function mapBackendUser(user: BackendUser): TenantUser {
  const name =
    user.fullName ??
    user.name ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email;

  return {
    id: user.id,
    name: name || user.email,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId ?? "",
    roleLabel: user.roleName ?? user.role ?? "Member",
    supervisorId: user.supervisorId,
    active: user.active ?? user.isActive ?? true,
  };
}

export const usersService = {
  async getUsers(tenantId: string): Promise<TenantUser[]> {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      return readMockUsers(tenantId);
    }

    const users = await usersApi.getUsers(tenantId);
    return users.map(mapBackendUser);
  },

  async createUser(payload: CreateTenantUserPayload) {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      const users = readMockUsers(payload.tenantId);
      const user: TenantUser = {
        id: crypto.randomUUID(),
        name: [payload.firstName, payload.lastName].filter(Boolean).join(" "),
        email: payload.email,
        phone: payload.phone,
        roleId: payload.role,
        roleLabel: payload.role,
        supervisorId: payload.supervisorId,
        active: true,
      };
      writeMockUsers(payload.tenantId, [...users, user]);
      return user;
    }

    return authService.registerAdminUser({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      supervisorId: payload.supervisorId,
      tenantId: payload.tenantId,
    });
  },

  async updateUser(userId: string, payload: UpdateUserPayload) {
    return usersApi.updateUser(userId, payload);
  },

  async setUserActive(tenantId: string, userId: string, active: 'deactivate' | 'reactivate') {
    if (isMockAuthEnabled) {
      await wait(MOCK_LATENCY_MS);
      const users = readMockUsers(tenantId).map((user) =>
        user.id === userId ? { ...user, active } : user,
      );
      // writeMockUsers(tenantId, users);
      return;
    }

    await usersApi.setUserActive(tenantId, userId, active);
  },
};
