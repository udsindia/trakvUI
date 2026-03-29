import axios from "axios";
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSession,
  TenantContextState,
} from "@/app/auth/auth.types";
import {
  MODULE_KEYS,
  defaultTenantModules,
  type TenantModuleMap,
} from "@/config/modules/modules";
import { getPermissionsForRoles } from "@/config/permissions/permissions";
import { ROLES, type RoleKey } from "@/config/roles/roles";
import { httpClient } from "@/shared/services/http/client";

const AUTH_STORAGE_KEY = "edutrack.auth.session";
const AUTH_LOGIN_ENDPOINT = "/auth/login";
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE ?? "mock";
const MOCK_AUTH_LATENCY_MS = 450;
const MOCK_SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const MOCK_TENANT_ID = "edutrack-demo";
const MOCK_TENANT_NAME = "Arpan Consultancy";

type MockPersona = {
  fallbackName: string;
  keywords: string[];
  roles: RoleKey[];
};

const defaultMockPersona: MockPersona = {
  fallbackName: "Demo Tenant Admin",
  keywords: [],
  roles: [ROLES.TENANT_ADMIN],
};

const mockPersonas: MockPersona[] = [
  {
    fallbackName: "Demo Super Admin",
    keywords: ["super", "owner", "root"],
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    fallbackName: "Demo Tenant Admin",
    keywords: ["admin"],
    roles: [ROLES.TENANT_ADMIN],
  },
  {
    fallbackName: "Demo Counsellor",
    keywords: ["counsellor", "counselor", "advisor"],
    roles: [ROLES.COUNSELLOR],
  },
  {
    fallbackName: "Demo Application Manager",
    keywords: ["application", "applications"],
    roles: [ROLES.APPLICATION_MANAGER],
  },
  {
    fallbackName: "Demo Activity Manager",
    keywords: ["activity", "activities"],
    roles: [ROLES.ACTIVITY_MANAGER],
  },
  {
    fallbackName: "Demo Analyst",
    keywords: ["analyst", "reporting"],
    roles: [ROLES.ANALYST],
  },
];

let cachedSession: AuthSession | null | undefined;

export const isMockAuthEnabled = AUTH_MODE !== "api";

function getEmptyTenantModules(): TenantModuleMap {
  return Object.values(MODULE_KEYS).reduce((moduleMap, moduleKey) => {
    moduleMap[moduleKey] = false;
    return moduleMap;
  }, {} as TenantModuleMap);
}

function decodeJwtPayload(token: string) {
  try {
    const [, rawPayload] = token.split(".");

    if (!rawPayload) {
      return null;
    }

    const normalizedPayload = rawPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(globalThis.atob(paddedPayload)) as { exp?: number };
  } catch {
    return null;
  }
}

function resolveTokenExpiry(token: string) {
  const payload = decodeJwtPayload(token);

  return typeof payload?.exp === "number" ? payload.exp * 1000 : undefined;
}

function buildTenantContext(response: AuthLoginResponse): TenantContextState {
  return {
    tenantId: response.tenantId,
    tenantName: response.tenantName ?? response.tenantId,
    enabledModules: {
      ...getEmptyTenantModules(),
      ...response.enabledModules,
    },
  };
}

function mapResponseToSession(response: AuthLoginResponse): AuthSession {
  return {
    user: response.user,
    roles: Array.from(new Set(response.roles)),
    permissions: Array.from(new Set(response.permissions)),
    tenant: buildTenantContext(response),
    tokens: {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType ?? "Bearer",
      expiresAt: resolveTokenExpiry(response.accessToken),
    },
  };
}

function isSessionExpired(session: AuthSession) {
  return Boolean(session.tokens.expiresAt && session.tokens.expiresAt <= Date.now());
}

function isValidSession(session: unknown): session is AuthSession {
  if (!session || typeof session !== "object") {
    return false;
  }

  const candidate = session as Partial<AuthSession>;

  return Boolean(
    candidate.user &&
      candidate.tenant &&
      candidate.tokens?.accessToken &&
      Array.isArray(candidate.roles) &&
      Array.isArray(candidate.permissions),
  );
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const serializedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!serializedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(serializedSession) as unknown;

    return isValidSession(parsedSession) ? parsedSession : null;
  } catch {
    return null;
  }
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function sanitizeIdentifier(value: string) {
  const sanitizedValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitizedValue || "demo-user";
}

function toDisplayName(identifier: string) {
  const normalizedValue = identifier
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(/\s+/)
    .map((segment) =>
      segment ? `${segment[0].toUpperCase()}${segment.slice(1).toLowerCase()}` : "",
    )
    .join(" ");
}

function resolveMockPersona(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return (
    mockPersonas.find(({ keywords }) =>
      keywords.some((keyword) => normalizedIdentifier.includes(keyword)),
    ) ?? defaultMockPersona
  );
}

function buildMockSession(request: AuthLoginRequest): AuthSession {
  if (request.strategy === "sso") {
    throw new Error("Mock SSO is not wired yet. Use credentials mode for demos.");
  }

  const identifier = request.identifier.trim();
  const password = request.password.trim();

  if (!identifier || !password) {
    throw new Error("Enter any demo username and password to continue.");
  }

  const mockPersona = resolveMockPersona(identifier);
  const roles = mockPersona.roles;
  const permissions = getPermissionsForRoles(roles);
  const userKey = sanitizeIdentifier(identifier);
  const userName = toDisplayName(identifier) || mockPersona.fallbackName;
  const email = identifier.includes("@") ? identifier : `${userKey}@demo.local`;
  const expiresAt = Date.now() + MOCK_SESSION_DURATION_MS;

  return {
    user: {
      id: `mock-${userKey}`,
      name: userName,
      email,
    },
    roles,
    permissions,
    tenant: {
      tenantId: MOCK_TENANT_ID,
      tenantName: MOCK_TENANT_NAME,
      enabledModules: {
        ...defaultTenantModules,
      },
    },
    tokens: {
      accessToken: `mock-access-token-${userKey}-${expiresAt}`,
      refreshToken: `mock-refresh-token-${userKey}`,
      tokenType: "Bearer",
      expiresAt,
    },
  };
}

export function getAuthErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
        ? error.response.data.message
        : null;

    return responseMessage ?? error.message ?? "Authentication request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Authentication request failed.";
}

export const authService = {
  async login(request: AuthLoginRequest) {
    if (isMockAuthEnabled) {
      await wait(MOCK_AUTH_LATENCY_MS);

      const session = buildMockSession(request);

      this.persistSession(session);

      return session;
    }

    const { data } = await httpClient.post<AuthLoginResponse>(AUTH_LOGIN_ENDPOINT, {
      ...request,
      strategy: request.strategy ?? "credentials",
    });

    const session = mapResponseToSession(data);

    this.persistSession(session);

    return session;
  },

  persistSession(session: AuthSession) {
    cachedSession = session;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  },

  restoreSession() {
    if (cachedSession) {
      if (isSessionExpired(cachedSession)) {
        this.clearSession();
        return null;
      }

      return cachedSession;
    }

    const storedSession = readStoredSession();

    if (!storedSession || isSessionExpired(storedSession)) {
      this.clearSession();
      return null;
    }

    cachedSession = storedSession;

    return storedSession;
  },

  clearSession() {
    cachedSession = null;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  getAccessToken() {
    return this.restoreSession()?.tokens.accessToken ?? null;
  },
};
