import type { OnboardingRegisterRequest } from "@/app/auth/auth.types";
import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";
import type {
  Agency,
  UpdateAgencyProfileRequest,
  UpdateAgencySubscriptionRequest,
  UpdateAgencyTrialRequest,
} from "@/modules/super-admin/superAdmin.types";

type BackendAgency = {
  id: string;
  name: string;
  registrationId?: string;
  registrationID?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  verificationStatus?: string;
  subscriptionPlan?: string;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  userCount?: number;
  studentCount?: number;
  leadCount?: number;
  applicationCount?: number;
  createdAt?: string;
  admin?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

function mapAgency(agency: BackendAgency): Agency {
  return {
    id: agency.id,
    name: agency.name,
    registrationId: agency.registrationId ?? agency.registrationID ?? "",
    address: agency.address ?? "",
    city: agency.city ?? "",
    state: agency.state ?? "",
    country: agency.country ?? "",
    status: (agency.status as Agency["status"]) ?? "pending_verification",
    verificationStatus: (agency.verificationStatus as Agency["verificationStatus"]) ?? "pending",
    subscriptionPlan: (agency.subscriptionPlan as Agency["subscriptionPlan"]) ?? "trial",
    trialEndsAt: agency.trialEndsAt ?? null,
    subscriptionEndsAt: agency.subscriptionEndsAt ?? null,
    userCount: agency.userCount ?? 0,
    studentCount: agency.studentCount ?? 0,
    leadCount: agency.leadCount ?? 0,
    applicationCount: agency.applicationCount ?? 0,
    createdAt: agency.createdAt ?? new Date().toISOString(),
    admin: agency.admin ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  };
}

export const agenciesApi = {
  async list(): Promise<Agency[]> {
    const { data } = await httpClient.get<BackendAgency[]>(API_CONFIG.agencies);
    return (data ?? []).map(mapAgency);
  },

  async getById(agencyId: string): Promise<Agency> {
    const { data } = await httpClient.get<BackendAgency>(`${API_CONFIG.agencies}/${agencyId}`);
    return mapAgency(data);
  },

  async create(request: OnboardingRegisterRequest): Promise<Agency> {
    const { data } = await httpClient.post<BackendAgency>("/onboarding/register", request);
    return mapAgency(data);
  },

  async updateProfile(agencyId: string, request: UpdateAgencyProfileRequest): Promise<Agency> {
    const { data } = await httpClient.patch<BackendAgency>(
      `${API_CONFIG.agencies}/${agencyId}`,
      request,
    );
    return mapAgency(data);
  },

  async setStatus(agencyId: string, status: Agency["status"]): Promise<Agency> {
    const { data } = await httpClient.patch<BackendAgency>(
      `${API_CONFIG.agencies}/${agencyId}/status`,
      { status },
    );
    return mapAgency(data);
  },

  async verify(agencyId: string, verificationStatus: Agency["verificationStatus"]): Promise<Agency> {
    const { data } = await httpClient.patch<BackendAgency>(
      `${API_CONFIG.agencies}/${agencyId}/verification`,
      { verificationStatus },
    );
    return mapAgency(data);
  },

  async updateTrial(agencyId: string, request: UpdateAgencyTrialRequest): Promise<Agency> {
    const { data } = await httpClient.patch<BackendAgency>(
      `${API_CONFIG.agencies}/${agencyId}/trial`,
      request,
    );
    return mapAgency(data);
  },

  async updateSubscription(
    agencyId: string,
    request: UpdateAgencySubscriptionRequest,
  ): Promise<Agency> {
    const { data } = await httpClient.patch<BackendAgency>(
      `${API_CONFIG.agencies}/${agencyId}/subscription`,
      request,
    );
    return mapAgency(data);
  },
};
