import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import type {
  CreateApplicationPayload,
  ApplicationStage,
} from "@/modules/applications/applicationForm.types";

/** List item — backend ApplicationSummaryDTO (with a couple of legacy-tolerant fields). */
export interface BackendApplication {
  id: string;
  createdAt: string;
  updatedAt?: string;

  studentId?: string;
  studentName?: string;
  email?: string;
  assignedTo?: string;
  universityName?: string;
  courseName?: string;
  studyLevel?: string | null;
  destinationCountry?: string;
  intakeMonth?: string;
  intakeYear?: number;
  currentStageName?: string | null;
  outcome?: string;

  // Legacy/optional (may be absent)
  leadId?: string;
  phone?: string;
  targetCountry?: string;
  targetUniversity?: string;
  course?: string;
  stage?: ApplicationStage;
}

/** A stage row on an application (backend ApplicationStageDTO). */
export interface ApplicationStageDetail {
  id: string;
  stageName: string;
  stageOrder: number;
  enteredAt: string | null;
  exitedAt: string | null;
}

/** Full application detail — backend ApplicationDetailDTO. */
export interface ApplicationDetail {
  id: string;
  studentId: string;
  assignedTo?: string;
  universityName: string;
  courseName: string;
  studyLevel?: string | null;
  destinationCountry?: string;
  intakeMonth?: string;
  intakeYear?: number;
  tuitionFeeInr?: number | null;
  applicationFeeInr?: number | null;
  // Only present when the caller has COMMISSION_VIEW; otherwise null/absent.
  commissionAmount?: number | null;
  commissionCurrency?: string | null;
  currentStageId?: string | null;
  outcome: string;
  outcomeReason?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  stages: ApplicationStageDetail[];
}

/** A stage-transition audit entry — backend StageHistoryDTO. */
export interface StageHistoryEntry {
  id: string;
  fromStageId?: string | null;
  fromStageName?: string | null;
  toStageId: string;
  toStageName?: string | null;
  changedBy?: string;
  note?: string;
  changedAt: string;
}

/** The list endpoint returns a Spring Page ({ content: [...] }); older builds returned a raw array. */
interface Paged<T> {
  content?: T[];
}

const OUTCOME_TO_STAGE: Record<string, ApplicationStage> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_PROGRESS: "Processing",
  PROCESSING: "Processing",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved",
  VISA_REJECTED: "Visa Rejected",
  COMPLETED: "Completed",
};

const STAGE_TO_OUTCOME: Record<ApplicationStage, string> = {
  Draft: "DRAFT",
  Submitted: "SUBMITTED",
  Processing: "IN_PROGRESS",
  "Visa Applied": "VISA_APPLIED",
  "Visa Approved": "VISA_APPROVED",
  "Visa Rejected": "VISA_REJECTED",
  Completed: "COMPLETED",
};

export function mapOutcomeToStage(
  outcome: string | null | undefined,
): ApplicationStage {
  if (!outcome) {
    return "Draft";
  }

  const normalized = outcome.trim().toUpperCase().replace(/\s+/g, "_");
  return OUTCOME_TO_STAGE[normalized] ?? "Draft";
}

export function mapStageToOutcome(stage: ApplicationStage): string {
  return STAGE_TO_OUTCOME[stage] ?? "DRAFT";
}

export const applicationsApi = {
  getApplications: async (): Promise<BackendApplication[]> => {
    const response = await httpClient.get<
      BackendApplication[] | Paged<BackendApplication>
    >(API_CONFIG.applications);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  },

  createApplication: async (
    payload: CreateApplicationPayload,
  ): Promise<ApplicationDetail> => {
    const response = await httpClient.post<ApplicationDetail>(
      API_CONFIG.applications,
      payload,
    );
    return response.data;
  },

  getApplicationById: async (id: string): Promise<ApplicationDetail> => {
    const response = await httpClient.get<ApplicationDetail>(
      `${API_CONFIG.applications}/${id}`,
    );
    return response.data;
  },

  /** Advance the application to the next stage. `note` must be at least 10 characters. */
  moveStage: async (id: string, note: string): Promise<ApplicationDetail> => {
    const response = await httpClient.patch<ApplicationDetail>(
      `${API_CONFIG.applications}/${id}/move-stage`,
      { note },
    );
    return response.data;
  },

  /** Close the application with a terminal outcome. */
  closeApplication: async (
    id: string,
    outcome: string,
    reason: string,
  ): Promise<ApplicationDetail> => {
    const response = await httpClient.patch<ApplicationDetail>(
      `${API_CONFIG.applications}/${id}/close`,
      { outcome, reason },
    );
    return response.data;
  },

  /** Set/update commission. Backend requires COMMISSION_MANAGE. */
  updateCommission: async (
    id: string,
    amount: number | null,
    currency: string,
  ): Promise<ApplicationDetail> => {
    const response = await httpClient.patch<ApplicationDetail>(
      `${API_CONFIG.applications}/${id}/commission`,
      { amount, currency },
    );
    return response.data;
  },

  getHistory: async (id: string): Promise<StageHistoryEntry[]> => {
    const response = await httpClient.get<StageHistoryEntry[]>(
      `${API_CONFIG.applications}/${id}/history`,
    );
    return response.data;
  },
};
