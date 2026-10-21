import type { Booking } from "@/modules/bookings/bookingsApi";

export type BookingView = "upcoming" | "past";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The range each view asks the API for. Upcoming starts at today's midnight so a session
 * already under way today still shows; past is the 60 days before that.
 */
export function rangeFor(view: BookingView, now: Date = new Date()): { from: string; to: string } {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (view === "past") {
    return {
      from: new Date(midnight.getTime() - 60 * DAY_MS).toISOString(),
      to: midnight.toISOString(),
    };
  }
  return {
    from: midnight.toISOString(),
    to: new Date(midnight.getTime() + 90 * DAY_MS).toISOString(),
  };
}

/** Sessions grouped by local calendar day, in the order given. */
export function groupByDay(bookings: Booking[]): { day: string; label: string; bookings: Booking[] }[] {
  const groups = new Map<string, { day: string; label: string; bookings: Booking[] }>();
  for (const booking of bookings) {
    const start = new Date(booking.startsAt);
    const day = `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
    let group = groups.get(day);
    if (!group) {
      group = { day, label: dayLabel(start), bookings: [] };
      groups.set(day, group);
    }
    group.bookings.push(booking);
  }
  return [...groups.values()];
}

/** "Today", "Tomorrow", or "Sat 25 Oct". */
export function dayLabel(date: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(date) - startOf(now)) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "3:00 PM – 5:00 PM". */
export function timeRange(booking: Booking): string {
  const format = (value: string) =>
    new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${format(booking.startsAt)} – ${format(booking.endsAt)}`;
}

/** Headline numbers for the upcoming view: sessions and hours today and in the next 7 days. */
export function summarize(bookings: Booking[], now: Date = new Date()) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const live = bookings.filter((b) => b.status !== "CANCELLED");
  const inDays = (b: Booking, days: number) => {
    const start = new Date(b.startsAt).getTime();
    return start >= midnight && start < midnight + days * DAY_MS;
  };
  const today = live.filter((b) => inDays(b, 1));
  const week = live.filter((b) => inDays(b, 7));
  return {
    todaySessions: today.length,
    weekSessions: week.length,
    weekHours: week.reduce((sum, b) => sum + b.hours, 0),
    pending: live.filter((b) => b.status === "PENDING").length,
  };
}
