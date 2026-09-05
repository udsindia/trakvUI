import { httpClient } from "@/shared/services/http/client";
import type { UpdateApplicationPayload } from "@/modules/applications/applicationForm.types";
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
  destinationCountryCode?: string;
  intakeMonth?: string;
  intakeYear?: number;
  currentStageName?: string | null;
  /** Third party processing the application; absent or empty means in-house. */
  processedBy?: string | null;
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
  destinationCountryCode?: string;
  intakeMonth?: string;
  intakeYear?: number;
  tuitionFeeInr?: number | null;
  applicationFeeInr?: number | null;
  currentStageId?: string | null;
  outcome: string;
  outcomeReason?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  processedBy?: string | null;
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


export const applicationsApi = {
  getApplications: async (): Promise<BackendApplication[]> => {
    const response = await httpClient.get<
      BackendApplication[] | Paged<BackendApplication>
    >(API_CONFIG.applications);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  },

  /** Every application belonging to one student, newest stage state included. */
  getApplicationsByStudent: async (
    studentId: string,
  ): Promise<BackendApplication[]> => {
    const response = await httpClient.get<BackendApplication[] | Paged<BackendApplication>>(
      `${API_CONFIG.applications}/student/${studentId}`,
    );
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

  /** Partial update; permitted only while the application is still a draft. */
  updateApplication: async (
    id: string,
    payload: UpdateApplicationPayload,
  ): Promise<ApplicationDetail> => {
    const response = await httpClient.patch<ApplicationDetail>(
      `${API_CONFIG.applications}/${id}`,
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

  /** Soft-delete (archive) an application. It is then hidden from lists. */
  deleteApplication: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.applications}/${id}`);
  },

  getHistory: async (id: string): Promise<StageHistoryEntry[]> => {
    const response = await httpClient.get<StageHistoryEntry[]>(
      `${API_CONFIG.applications}/${id}/history`,
    );
    return response.data;
  },
};
