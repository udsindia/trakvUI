import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";

export type BookingStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

/** One studio session, as GET /api/bookings returns it. */
export interface Booking {
  id: string;
  externalId: string;
  clientName: string;
  phone?: string | null;
  email?: string | null;
  startsAt: string;
  endsAt: string;
  hours: number;
  status: BookingStatus;
  notes?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  leadStage?: string | null;
  /** From the linked lead: what they booked, e.g. "Shoot + Anchor". */
  serviceRequirement?: string | null;
  /** From the linked lead: ONE_TIME | RECURRING, or null when not known. */
  bookingFrequency?: string | null;
  confirmationSentAt?: string | null;
  reminderSentAt?: string | null;
  cancellationSentAt?: string | null;
}

export const bookingsApi = {
  /** Sessions starting in [from, to), soonest first. Both are ISO instants. */
  list: async (range: { from: string; to: string }): Promise<Booking[]> => {
    const response = await httpClient.get<Booking[]>(API_CONFIG.bookings, { params: range });
    return response.data;
  },
};
