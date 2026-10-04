import type { CallDirection } from "@/modules/call-records/callRecords.types";

export const callRecordsRoutePaths = {
  /** The summary page: Today / Yesterday / Last Week cards. */
  list: "/call-records",
  /** The details page: the calls behind one card or tile, or every call. */
  details: "/call-records/details",
} as const;

/** Link to the details page, optionally narrowed to a period ("today" | "yesterday" | "lastWeek") and/or a direction. */
export function callRecordsDetailsPath(filters: { period?: string | null; direction?: CallDirection | null } = {}) {
  const params = new URLSearchParams();
  if (filters.period) params.set("period", filters.period);
  if (filters.direction) params.set("direction", filters.direction);
  const query = params.toString();
  return query ? `${callRecordsRoutePaths.details}?${query}` : callRecordsRoutePaths.details;
}
