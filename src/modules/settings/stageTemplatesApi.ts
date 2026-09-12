import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";

/**
 * The country code standing for "every country without a sequence of its own".
 *
 * Matches CountryStageTemplateService.ANY_COUNTRY on the server. A real destination is
 * always an ISO-3166 alpha-3 code, so this can never collide with one.
 */
export const ANY_COUNTRY = "*";

/** Where a resolved sequence came from — backend StageTemplateDTO.Source. */
export type StageTemplateSource =
  | "UNIVERSITY"
  | "TENANT"
  | "TENANT_DEFAULT"
  | "SYSTEM"
  | "SYSTEM_DEFAULT"
  | "FALLBACK";

export interface StageTemplateStage {
  name: string;
  order: number;
  active: boolean;
}

/** Backend StageTemplateDTO. */
export interface StageTemplate {
  countryCode: string;
  countryName: string;
  source: StageTemplateSource;
  stages: StageTemplateStage[];
}

/** True when the tenant owns this sequence rather than inheriting it. */
export function isOverride(source: StageTemplateSource) {
  return source === "TENANT" || source === "TENANT_DEFAULT" || source === "UNIVERSITY";
}

/** How a sequence's origin reads in the UI. */
export function sourceLabel(source: StageTemplateSource) {
  switch (source) {
    case "UNIVERSITY":
      return "This university's own";
    case "TENANT":
      return "Your sequence";
    case "TENANT_DEFAULT":
      return "Your default";
    case "SYSTEM":
      return "Standard sequence";
    case "SYSTEM_DEFAULT":
      return "Standard default";
    case "FALLBACK":
      return "Built-in fallback";
  }
}


/** What saving a sequence would do to applications already in flight. */
export interface StageChangePreview {
  applicationsAffected: number;
  applicationsNeedingAction: number;
  changes: {
    applicationId: string;
    added: string[];
    addedBehindCurrent: string[];
    removed: string[];
    keptBecausePassed: string[];
  }[];
}

const BASE = API_CONFIG.stageTemplates;

export const stageTemplatesApi = {
  /** Every country with a sequence, wildcard first. */
  list: async (): Promise<StageTemplate[]> => {
    const { data } = await httpClient.get<StageTemplate[]>(BASE);
    return Array.isArray(data) ? data : [];
  },

  get: async (countryCode: string): Promise<StageTemplate> => {
    const { data } = await httpClient.get<StageTemplate>(
      `${BASE}/${encodeURIComponent(countryCode)}`,
    );
    return data;
  },

  /**
   * Replaces the tenant's sequence for a country. Order is the order of the array;
   * stage_order is the server's business.
   */
  save: async (
    countryCode: string,
    stages: { name: string; active: boolean }[],
  ): Promise<StageTemplate> => {
    const { data } = await httpClient.put<StageTemplate>(
      `${BASE}/${encodeURIComponent(countryCode)}`,
      { stages },
    );
    return data;
  },

  /** The sequence in force for one university: its own, or the one it inherits. */
  getForUniversity: async (universityId: string, countryCode?: string): Promise<StageTemplate> => {
    const { data } = await httpClient.get<StageTemplate>(
      `${BASE}/university/${universityId}`,
      { params: countryCode ? { countryCode } : undefined },
    );
    return data;
  },

  saveForUniversity: async (
    universityId: string,
    stages: { name: string; active: boolean }[],
    countryCode?: string,
  ): Promise<StageTemplate> => {
    const { data } = await httpClient.put<StageTemplate>(
      `${BASE}/university/${universityId}`,
      { stages },
      { params: countryCode ? { countryCode } : undefined },
    );
    return data;
  },

  resetForUniversity: async (universityId: string, countryCode?: string): Promise<StageTemplate> => {
    const { data } = await httpClient.delete<StageTemplate>(
      `${BASE}/university/${universityId}`,
      { params: countryCode ? { countryCode } : undefined },
    );
    return data;
  },

  /**
   * What saving would do to applications already in flight. Asked before the save so the
   * confirmation can name a real number rather than warn about change in the abstract.
   */
  previewCountry: async (
    countryCode: string,
    stages: { name: string; active: boolean }[],
  ): Promise<StageChangePreview> => {
    const { data } = await httpClient.post<StageChangePreview>(
      `${BASE}/${encodeURIComponent(countryCode)}/preview`,
      { stages },
    );
    return data;
  },

  previewUniversity: async (
    universityId: string,
    stages: { name: string; active: boolean }[],
  ): Promise<StageChangePreview> => {
    const { data } = await httpClient.post<StageChangePreview>(
      `${BASE}/university/${universityId}/preview`,
      { stages },
    );
    return data;
  },

  /** Drops the override; returns whatever the country now inherits. */
  reset: async (countryCode: string): Promise<StageTemplate> => {
    const { data } = await httpClient.delete<StageTemplate>(
      `${BASE}/${encodeURIComponent(countryCode)}`,
    );
    return data;
  },
};
