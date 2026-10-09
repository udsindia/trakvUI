export type CallDirection = "INCOMING" | "OUTGOING" | "MISSED";

export interface CallRecordingRow {
  id: string;
  externalId: string;
  userId: string;
  employeeName: string;
  phoneNumber: string;
  /** If the caller's number matches a known user/lead/student, e.g. "Lead: Jane Doe". */
  matchedContactLabel: string;
  direction: CallDirection;
  startedAt: string;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  status: string;
  createdAt: string;
}

export interface CallSummaryBucket {
  calls: number;
  durationSeconds: number;
}

/** One card at the top of the Call Records page: Today, Yesterday or Last Week. */
export interface CallSummaryPeriod {
  key: string;
  label: string;
  /** e.g. "03 Oct 2026" or "21 to 27 Sep 2026". */
  rangeLabel: string;
  /** The period as an instant range [from, to) in ISO-8601, used to fetch exactly its calls. */
  from: string;
  to: string;
  totalCalls: number;
  totalDurationSeconds: number;
  incoming: CallSummaryBucket;
  outgoing: CallSummaryBucket;
  missedCalls: number;
}
