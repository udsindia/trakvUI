import { callRecordsApi, type BackendCallRecording } from "@/modules/call-records/callRecordsApi";
import type { CallRecordingRow, CallSummaryPeriod } from "@/modules/call-records/callRecords.types";

function mapRow(recording: BackendCallRecording): CallRecordingRow {
  return {
    id: recording.id,
    externalId: recording.externalId,
    userId: recording.userId,
    employeeName: recording.employeeName,
    phoneNumber: recording.phoneNumber,
    matchedContactLabel: recording.matchedContactLabel ?? "",
    direction: recording.direction,
    startedAt: recording.startedAt,
    durationSeconds: recording.durationSeconds,
    fileSizeBytes: recording.fileSizeBytes,
    mimeType: recording.mimeType,
    status: recording.status,
    createdAt: recording.createdAt,
  };
}

export const callRecordsService = {
  async list(range?: { from: string; to: string }): Promise<CallRecordingRow[]> {
    const recordings = await callRecordsApi.list(range);
    return recordings.map(mapRow);
  },

  async getSummary(): Promise<CallSummaryPeriod[]> {
    return (await callRecordsApi.getSummary()).periods;
  },

  getAudioBlob: callRecordsApi.getAudioBlob,
};
