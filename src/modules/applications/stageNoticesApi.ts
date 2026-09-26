import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";

/** A stage the counsellor still has to settle — backend StageChangeNoticeService.PendingStage. */
export interface PendingStage {
  stageId: string;
  stageName: string;
  stageOrder: number;
}

/**
 * One record that an application's stage sequence changed underneath it.
 *
 * `summary` is the narrative — what was added, removed, or kept because it had already
 * been passed. `needsDecision` is computed fresh by the server from the application's own
 * stages, so it is never stale.
 */
export interface StageChangeNotice {
  id: string;
  scope: "COUNTRY" | "UNIVERSITY";
  scopeLabel: string | null;
  changedAt: string;
  summary: {
    added?: string[];
    addedBehindCurrent?: string[];
    removed?: string[];
    keptBecausePassed?: string[];
  };
  needsDecision: PendingStage[];
}

const BASE = API_CONFIG.applications;

export const stageNoticesApi = {
  /**
   * Open notices for one application. The server returns an empty list to anyone who is
   * not the assigned counsellor, so the caller does not decide who sees this.
   */
  list: async (applicationId: string): Promise<StageChangeNotice[]> => {
    const { data } = await httpClient.get<StageChangeNotice[]>(
      `${BASE}/${applicationId}/stage-notices`,
    );
    return Array.isArray(data) ? data : [];
  },

  /** "This step did happen" — records the stage as entered and exited. */
  markDone: async (applicationId: string, stageId: string): Promise<void> => {
    await httpClient.post(`${BASE}/${applicationId}/stage-notices/stages/${stageId}/done`);
  },

  /** "This step does not apply here" — removes the stage from this application only. */
  markNotRequired: async (applicationId: string, stageId: string): Promise<void> => {
    await httpClient.post(
      `${BASE}/${applicationId}/stage-notices/stages/${stageId}/not-required`,
    );
  },

  /** Clears the informational half. Anything still needing a decision keeps the banner. */
  dismiss: async (applicationId: string, noticeId: string): Promise<void> => {
    await httpClient.post(`${BASE}/${applicationId}/stage-notices/${noticeId}/dismiss`);
  },

  /** How many applications still have a question outstanding, for the dashboard. */
  count: async (): Promise<number> => {
    const { data } = await httpClient.get<{ applicationsNeedingAttention?: number }>(
      `${BASE}/stage-notices/count`,
    );
    return data?.applicationsNeedingAttention ?? 0;
  },
};
