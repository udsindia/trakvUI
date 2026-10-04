import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";
import type { CallDirection, CallSummaryPeriod } from "@/modules/call-records/callRecords.types";

export interface BackendCallRecording {
  id: string;
  externalId: string;
  userId: string;
  employeeName: string;
  phoneNumber: string;
  matchedContactLabel?: string | null;
  direction: CallDirection;
  startedAt: string;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  status: string;
  createdAt: string;
}

export interface BackendCallSummary {
  periods: CallSummaryPeriod[];
}

export const callRecordsApi = {
  /** Today / Yesterday / Last Week totals, cut into days in this browser's time zone. */
  getSummary: async (): Promise<BackendCallSummary> => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await httpClient.get<BackendCallSummary>(`${API_CONFIG.callRecordings}/summary`, {
      params: { timeZone },
    });
    return response.data;
  },

  /** With a range, only calls that started in [from, to). */
  list: async (range?: { from: string; to: string }): Promise<BackendCallRecording[]> => {
    const response = await httpClient.get<BackendCallRecording[]>(API_CONFIG.callRecordings, {
      params: range,
    });
    return response.data;
  },

  /** Fetches the audio bytes through the backend (JWT-authenticated) rather than a public URL. */
  getAudioBlob: async (id: string): Promise<Blob> => {
    const response = await httpClient.get(`${API_CONFIG.callRecordings}/${id}/audio`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
