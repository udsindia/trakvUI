import type { OnboardingRegisterRequest } from "@/app/auth/auth.types";
import { isMockAuthEnabled } from "@/app/auth/authService";
import { agenciesApi } from "@/modules/super-admin/agenciesApi";
import { mockAgencies } from "@/modules/super-admin/agenciesMockData";
import type {
  Agency,
  CreateAgencyRequest,
  UpdateAgencyProfileRequest,
  UpdateAgencySubscriptionRequest,
  UpdateAgencyTrialRequest,
} from "@/modules/super-admin/superAdmin.types";

let mockStore = [...mockAgencies];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function findMockAgency(agencyId: string) {
  const agency = mockStore.find((item) => item.id === agencyId);
  if (!agency) {
    throw new Error("Agency not found.");
  }
  return agency;
}

function toOnboardingRequest(request: CreateAgencyRequest): OnboardingRegisterRequest {
  return {
    consultancyName: request.consultancyName,
    registrationID: request.registrationID,
    consultancyAddress: request.consultancyAddress,
    consultancyCity: request.consultancyCity,
    consultancyState: request.consultancyState,
    consultancyCountry: request.consultancyCountry,
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone,
  };
}

export const agenciesService = {
  async getAgencies(): Promise<Agency[]> {
    if (isMockAuthEnabled) {
      return delay([...mockStore]);
    }

    return agenciesApi.list();
  },

  async getAgency(agencyId: string): Promise<Agency> {
    if (isMockAuthEnabled) {
      return delay({ ...findMockAgency(agencyId) });
    }

    return agenciesApi.getById(agencyId);
  },

  async createAgency(request: CreateAgencyRequest): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency: Agency = {
        id: `agency-${crypto.randomUUID().slice(0, 8)}`,
        name: request.consultancyName,
        registrationId: request.registrationID,
        address: request.consultancyAddress,
        city: request.consultancyCity,
        state: request.consultancyState,
        country: request.consultancyCountry,
        status: "pending_verification",
        verificationStatus: "pending",
        subscriptionPlan: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        subscriptionEndsAt: null,
        userCount: 1,
        studentCount: 0,
        leadCount: 0,
        applicationCount: 0,
        createdAt: new Date().toISOString(),
        admin: {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
        },
      };
      mockStore = [agency, ...mockStore];
      return delay(agency);
    }

    return agenciesApi.create(toOnboardingRequest(request));
  },

  async updateProfile(agencyId: string, request: UpdateAgencyProfileRequest): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency = findMockAgency(agencyId);
      const updated: Agency = {
        ...agency,
        name: request.name ?? agency.name,
        registrationId: request.registrationId ?? agency.registrationId,
        address: request.address ?? agency.address,
        city: request.city ?? agency.city,
        state: request.state ?? agency.state,
        country: request.country ?? agency.country,
      };
      mockStore = mockStore.map((item) => (item.id === agencyId ? updated : item));
      return delay(updated);
    }

    return agenciesApi.updateProfile(agencyId, request);
  },

  async setStatus(agencyId: string, status: Agency["status"]): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency = findMockAgency(agencyId);
      const updated = { ...agency, status };
      mockStore = mockStore.map((item) => (item.id === agencyId ? updated : item));
      return delay(updated);
    }

    return agenciesApi.setStatus(agencyId, status);
  },

  async verifyAgency(
    agencyId: string,
    verificationStatus: Agency["verificationStatus"],
  ): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency = findMockAgency(agencyId);
      const updated: Agency = {
        ...agency,
        verificationStatus,
        status: verificationStatus === "verified" ? "active" : agency.status,
      };
      mockStore = mockStore.map((item) => (item.id === agencyId ? updated : item));
      return delay(updated);
    }

    return agenciesApi.verify(agencyId, verificationStatus);
  },

  async updateTrial(agencyId: string, request: UpdateAgencyTrialRequest): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency = findMockAgency(agencyId);
      const updated: Agency = {
        ...agency,
        trialEndsAt: request.trialEndsAt,
        subscriptionPlan: "trial",
      };
      mockStore = mockStore.map((item) => (item.id === agencyId ? updated : item));
      return delay(updated);
    }

    return agenciesApi.updateTrial(agencyId, request);
  },

  async updateSubscription(
    agencyId: string,
    request: UpdateAgencySubscriptionRequest,
  ): Promise<Agency> {
    if (isMockAuthEnabled) {
      const agency = findMockAgency(agencyId);
      const updated: Agency = {
        ...agency,
        subscriptionPlan: request.plan,
        subscriptionEndsAt: request.subscriptionEndsAt,
        trialEndsAt: null,
      };
      mockStore = mockStore.map((item) => (item.id === agencyId ? updated : item));
      return delay(updated);
    }

    return agenciesApi.updateSubscription(agencyId, request);
  },
};
