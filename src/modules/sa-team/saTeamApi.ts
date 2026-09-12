import axios, { AxiosHeaders } from "axios";
import type {
  AdChannelConfig,
  OnboardTenantFormValues,
  SaDashboardStats,
  SaRole,
  SaUser,
  TenantSummary,
  WhatsAppConfig,
} from "@/modules/sa-team/sa.types";
import { saAuthService } from "@/modules/sa-team/saAuthService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const saClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

saClient.interceptors.request.use((config) => {
  const token = saAuthService.getToken();
  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/** Backend TenantWipeReport — per-entity counts, ordered as the wipe runs. */
export interface TenantWipeReport {
  tenantId: string;
  tenantName: string;
  counts: Record<string, number>;
  total: number;
}

export const saTeamApi = {
  // ── SA Team ──────────────────────────────────────────────────────────────

  listUsers: async (): Promise<SaUser[]> => {
    const res = await saClient.get<SaUser[]>("/superadmin/sa-team/users");
    return res.data;
  },

  inviteUser: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    saRoleId: string;
  }): Promise<SaUser> => {
    const res = await saClient.post<SaUser>("/superadmin/sa-team/users", payload);
    return res.data;
  },

  updateUserRole: async (userId: string, saRoleId: string): Promise<SaUser> => {
    const res = await saClient.patch<SaUser>(
      `/superadmin/sa-team/users/${userId}/role`,
      { saRoleId },
    );
    return res.data;
  },

  deactivateUser: async (userId: string): Promise<void> => {
    await saClient.patch(`/superadmin/sa-team/users/${userId}/deactivate`);
  },

  reactivateUser: async (userId: string): Promise<void> => {
    await saClient.patch(`/superadmin/sa-team/users/${userId}/reactivate`);
  },

  listRoles: async (): Promise<SaRole[]> => {
    const res = await saClient.get<SaRole[]>("/superadmin/sa-team/roles");
    return res.data;
  },

  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<SaRole> => {
    const res = await saClient.put<SaRole>(
      `/superadmin/sa-team/roles/${roleId}/permissions`,
      { permissions },
    );
    return res.data;
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  getDashboardStats: async (): Promise<SaDashboardStats> => {
    const res = await saClient.get<SaDashboardStats>("/superadmin/dashboard");
    return res.data;
  },

  // ── Tenants ───────────────────────────────────────────────────────────────

  listTenants: async (): Promise<TenantSummary[]> => {
    const res = await saClient.get<TenantSummary[]>("/superadmin/tenants");
    return res.data;
  },

  getTenant: async (id: string): Promise<TenantSummary> => {
    const res = await saClient.get<TenantSummary>(`/superadmin/tenants/${id}`);
    return res.data;
  },

  suspendTenant: async (id: string): Promise<TenantSummary> => {
    const res = await saClient.patch<TenantSummary>(`/superadmin/tenants/${id}/suspend`);
    return res.data;
  },

  reactivateTenant: async (id: string): Promise<TenantSummary> => {
    const res = await saClient.patch<TenantSummary>(`/superadmin/tenants/${id}/reactivate`);
    return res.data;
  },

  updateTenantPlan: async (id: string, plan: string): Promise<TenantSummary> => {
    const res = await saClient.patch<TenantSummary>(`/superadmin/tenants/${id}/plan`, { plan });
    return res.data;
  },

  /** What clearing this tenant would remove, counted but not removed. */
  async previewTenantWipe(id: string) {
    const res = await saClient.get<TenantWipeReport>(`/superadmin/tenants/${id}/wipe-preview`);
    return res.data;
  },

  /**
   * Clears the tenant's operational records. confirmName must match the tenant's name;
   * the server checks it too, so a caller cannot skip the guardrail.
   */
  async wipeTenantData(id: string, confirmName: string) {
    const res = await saClient.post<TenantWipeReport>(`/superadmin/tenants/${id}/wipe`, {
      confirmName,
    });
    return res.data;
  },

  // ── WhatsApp Config ───────────────────────────────────────────────────────

  getTenantWhatsAppConfig: async (tenantId: string): Promise<WhatsAppConfig | null> => {
    const res = await saClient.get<WhatsAppConfig>(
      `/superadmin/tenants/${tenantId}/whatsapp-config`,
    );
    return res.status === 204 ? null : res.data;
  },

  saveTenantWhatsAppConfig: async (
    tenantId: string,
    data: {
      phoneNumberId: string;
      wabaId?: string;
      accessToken: string;
      webhookVerifyToken: string;
      welcomeTemplateName?: string;
      tenantDisplayName?: string;
      isActive: boolean;
    },
  ): Promise<WhatsAppConfig> => {
    const res = await saClient.put<WhatsAppConfig>(
      `/superadmin/tenants/${tenantId}/whatsapp-config`,
      data,
    );
    return res.data;
  },

  exchangeWhatsAppEmbeddedSignup: async (
    tenantId: string,
    data: {
      code: string;
      wabaId?: string;
      phoneNumberId?: string;
      welcomeTemplateName?: string;
      tenantDisplayName?: string;
    },
  ): Promise<WhatsAppConfig> => {
    const res = await saClient.post<WhatsAppConfig>(
      `/superadmin/tenants/${tenantId}/whatsapp-config/embedded-signup`,
      data,
    );
    return res.data;
  },

  // ── Ads Config ────────────────────────────────────────────────────────────

  getTenantAdsConfig: async (tenantId: string): Promise<AdChannelConfig[]> => {
    const res = await saClient.get<AdChannelConfig[]>(
      `/superadmin/tenants/${tenantId}/ads-config`,
    );
    return res.data;
  },

  saveTenantMetaAdsConfig: async (
    tenantId: string,
    data: {
      pageId: string;
      formId?: string;
      accessToken: string;
      isActive: boolean;
    },
  ): Promise<AdChannelConfig> => {
    const res = await saClient.put<AdChannelConfig>(
      `/superadmin/tenants/${tenantId}/ads-config/meta`,
      data,
    );
    return res.data;
  },

  // ── Onboard Tenant ────────────────────────────────────────────────────────

  onboardTenant: async (data: OnboardTenantFormValues): Promise<unknown> => {
    const res = await saClient.post("/onboarding/register", data);
    return res.data;
  },
};
