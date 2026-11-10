import { describe, expect, test } from "vitest";
import type { Booking } from "../src/modules/bookings/bookingsApi";
import { dayLabel, groupByDay, matchesFrequency, rangeFor, summarize } from "../src/modules/bookings/bookingRange";

const NOW = new Date(2026, 9, 21, 10, 0); // Wed 21 Oct 2026, 10:00 local

function booking(id: string, start: Date, hours: number, status: Booking["status"] = "CONFIRMED"): Booking {
  return {
    id,
    externalId: id,
    clientName: `Client ${id}`,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + hours * 3600_000).toISOString(),
    hours,
    status,
  };
}

describe("rangeFor", () => {
  test("upcoming starts at today's midnight, so a session already under way still shows", () => {
    const { from } = rangeFor("upcoming", NOW);
    expect(new Date(from).getTime()).toBe(new Date(2026, 9, 21).getTime());
  });

  test("past ends where upcoming begins", () => {
    expect(rangeFor("past", NOW).to).toBe(rangeFor("upcoming", NOW).from);
  });
});

describe("groupByDay", () => {
  test("sessions on the same local day share a group, in order", () => {
    const groups = groupByDay([
      booking("a", new Date(2026, 9, 21, 11), 1),
      booking("b", new Date(2026, 9, 21, 15), 2),
      booking("c", new Date(2026, 9, 23, 9), 1),
    ]);
    expect(groups.map((g) => g.bookings.map((b) => b.id))).toEqual([["a", "b"], ["c"]]);
  });
});

describe("dayLabel", () => {
  test("names the days either side of today", () => {
    expect(dayLabel(new Date(2026, 9, 21, 18), NOW)).toBe("Today");
    expect(dayLabel(new Date(2026, 9, 22, 8), NOW)).toBe("Tomorrow");
    expect(dayLabel(new Date(2026, 9, 20, 8), NOW)).toBe("Yesterday");
  });
});

describe("summarize", () => {
  test("counts live sessions and hours, leaving cancelled ones out", () => {
    const summary = summarize(
      [
        booking("a", new Date(2026, 9, 21, 11), 2),
        booking("b", new Date(2026, 9, 21, 15), 1, "CANCELLED"),
        booking("c", new Date(2026, 9, 24, 9), 3, "PENDING"),
        booking("d", new Date(2026, 10, 10, 9), 4),
      ],
      NOW,
    );
    expect(summary).toEqual({ todaySessions: 1, weekSessions: 2, weekHours: 5, pending: 1 });
  });
});

describe("matchesFrequency", () => {
  const start = new Date(2026, 9, 21, 11);
  const recurring = { ...booking("r", start, 1), bookingFrequency: "RECURRING" };
  const oneTime = { ...booking("o", start, 1), bookingFrequency: "ONE_TIME" };
  const unknown = booking("u", start, 1);

  test("all clients shows every booking", () => {
    expect([recurring, oneTime, unknown].every((b) => matchesFrequency(b, "all"))).toBe(true);
  });

  test("a frequency filter keeps only bookings known to match it", () => {
    expect([recurring, oneTime, unknown].filter((b) => matchesFrequency(b, "RECURRING"))).toEqual([recurring]);
    expect([recurring, oneTime, unknown].filter((b) => matchesFrequency(b, "ONE_TIME"))).toEqual([oneTime]);
  });
});
