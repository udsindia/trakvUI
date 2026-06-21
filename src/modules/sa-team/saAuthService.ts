import axios from "axios";
import type { SaSession } from "./sa.types";

const SA_SESSION_KEY = "vutrak.sa.session";
const SA_API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api";

export const saAuthService = {
  async login(email: string, password: string): Promise<SaSession> {
    const { data } = await axios.post<{
      accessToken: string;
      tokenType: string;
      user: SaSession["user"];
    }>(`${SA_API_BASE}/sa/auth/login`, { email, password });

    const session: SaSession = {
      accessToken: data.accessToken,
      user: data.user,
      permissions: [], // permissions are embedded in JWT; we parse them below
    };

    // Parse permissions from JWT payload
    try {
      const [, rawPayload] = data.accessToken.split(".");
      const padded = rawPayload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(rawPayload.length + ((4 - (rawPayload.length % 4)) % 4), "=");
      const payload = JSON.parse(atob(padded)) as { saPermissions?: string[] };
      session.permissions = payload.saPermissions ?? [];
    } catch {
      /* ignore parse errors */
    }

    this.persist(session);
    return session;
  },

  async setPassword(token: string, password: string): Promise<void> {
    await axios.post(`${SA_API_BASE}/sa/auth/set-password`, { token, password });
  },

  persist(session: SaSession) {
    localStorage.setItem(SA_SESSION_KEY, JSON.stringify(session));
  },

  restore(): SaSession | null {
    try {
      const raw = localStorage.getItem(SA_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaSession;
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(SA_SESSION_KEY);
  },

  getToken(): string | null {
    return this.restore()?.accessToken ?? null;
  },

  hasPermission(permission: string): boolean {
    return this.restore()?.permissions.includes(permission) ?? false;
  },
};
