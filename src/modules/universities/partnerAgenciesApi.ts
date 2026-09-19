import { httpClient } from "@/shared/services/http/client";

/** One agency's arrangement with one university. */
export type UniversityPartnerAgency = {
  id: string;
  partnerAgencyId: string;
  agencyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  commissionPercentage?: number | null;
  /**
   * A–D, derived by the server from the commission. Not stored — moving a band boundary
   * is a config change there rather than a backfill here.
   */
  commissionGrade?: string | null;
  ranking?: number | null;
  notes?: string | null;
};

export type SaveUniversityPartnerAgency = {
  /** An existing agency… */
  partnerAgencyId?: string | null;
  /** …or a name to find-or-create. Matched case-insensitively on the server. */
  agencyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  commissionPercentage?: number | null;
  ranking?: number | null;
  notes?: string | null;
};

const base = (universityId: string) => `/universities/${universityId}/partner-agencies`;

/** One agency across the whole tenant — what the name field suggests from. */
export type PartnerAgencySummary = {
  id: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  universityCount: number;
  lowestCommission?: number | null;
  highestCommission?: number | null;
  bestGrade?: string | null;
};

export const partnerAgenciesApi = {
  /** Every agency the tenant already works with, for suggesting an existing one. */
  forTenant: async (): Promise<PartnerAgencySummary[]> => {
    const response = await httpClient.get<PartnerAgencySummary[]>("/partner-agencies");
    return response.data ?? [];
  },

  forUniversity: async (universityId: string): Promise<UniversityPartnerAgency[]> => {
    const response = await httpClient.get<UniversityPartnerAgency[]>(base(universityId));
    return response.data ?? [];
  },

  /** Adds an agency to this university, or updates its commission and rank. */
  save: async (
    universityId: string,
    payload: SaveUniversityPartnerAgency,
  ): Promise<UniversityPartnerAgency> => {
    const response = await httpClient.put<UniversityPartnerAgency>(base(universityId), payload);
    return response.data;
  },

  /** Removes the arrangement. The agency survives — it may cover other universities. */
  remove: async (universityId: string, linkId: string): Promise<void> => {
    await httpClient.delete(`${base(universityId)}/${linkId}`);
  },

  /** Which universities one agency covers. */
  coverage: async (partnerAgencyId: string): Promise<string[]> => {
    const response = await httpClient.get<string[]>(
      `/partner-agencies/${partnerAgencyId}/universities`,
    );
    return response.data ?? [];
  },
};

/** Colours for the A–D grade. Green through to grey: a D is a weak deal, not an error. */
export const GRADE_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  A: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  B: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  C: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  D: { backgroundColor: "#EEF2F6", color: "#55707C" },
};
