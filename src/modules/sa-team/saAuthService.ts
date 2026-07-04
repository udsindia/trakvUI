import axios from "axios";
import type { SaSession } from "@/modules/sa-team/sa.types";

const SA_SESSION_KEY = "vutrak.sa.session";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function loadSession(): SaSession | null {
  try {
    const raw = localStorage.getItem(SA_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SaSession) : null;
  } catch {
    return null;
  }
}

export const saAuthService = {
  async login(email: string, password: string): Promise<SaSession> {
    const response = await axios.post<{ accessToken: string }>(
      `${BASE_URL}/sa/auth/login`,
      { email, password },
      { headers: { "Content-Type": "application/json" } },
    );
    const token = response.data.accessToken;
    const payload = parseJwtPayload(token);
    const session: SaSession = {
      token,
      userId: String(payload.saUserId ?? ""),
      email: String(payload.sub ?? ""),
      role: String(payload.saRole ?? ""),
      permissions: Array.isArray(payload.saPermissions) ? (payload.saPermissions as string[]) : [],
    };
    localStorage.setItem(SA_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async setPassword(token: string, password: string): Promise<void> {
    await axios.post(
      `${BASE_URL}/sa/auth/set-password`,
      { token, password },
      { headers: { "Content-Type": "application/json" } },
    );
  },

  restore(): SaSession | null {
    return loadSession();
  },

  clear(): void {
    localStorage.removeItem(SA_SESSION_KEY);
  },

  getToken(): string | null {
    return loadSession()?.token ?? null;
  },

  hasPermission(code: string): boolean {
    const session = loadSession();
    if (!session) return false;
    if (session.role === "SA_OWNER") return true;
    return session.permissions.includes(code);
  },
};
