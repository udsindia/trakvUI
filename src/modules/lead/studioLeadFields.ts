/**
 * The fields a studio tracks on a lead on top of its stage: how keen the lead is, what they
 * want to book, and whether it is a one-off or a series. Values match the backend
 * (InterestLevel, BookingFrequency, leads.service_requirement).
 */

/** Weakest first, the order the backend ranks them in. */
export const INTEREST_LEVELS = [
  { value: "CASUAL_ENQUIRY", label: "Casual enquiry", backgroundColor: "#EEF2F6", color: "#55707C" },
  { value: "PROSPECTIVE", label: "Prospective", backgroundColor: "#FDEEDD", color: "#B35A00" },
  { value: "INTERESTED", label: "Interested", backgroundColor: "#E1F5EC", color: "#0B7A57" },
] as const;

export type InterestLevelValue = (typeof INTEREST_LEVELS)[number]["value"];

export function interestLevelOption(value: string | null | undefined) {
  return INTEREST_LEVELS.find((level) => level.value === value) ?? null;
}

/**
 * The studio's offerings, as the WhatsApp chat offers them too. A suggestion list, not a
 * closed set: the requirement is free text, so a new offering can be typed in.
 */
export const SERVICE_REQUIREMENTS = [
  "Shoot only",
  "Shoot + Anchor",
  "Shoot + Anchor + Editing",
  "Outdoor shoot",
] as const;

/** The backend caps leads.service_requirement at this. */
export const MAX_SERVICE_REQUIREMENT_LENGTH = 80;

export const BOOKING_FREQUENCIES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "RECURRING", label: "Recurring" },
] as const;

export function bookingFrequencyLabel(value: string | null | undefined): string | null {
  return BOOKING_FREQUENCIES.find((frequency) => frequency.value === value)?.label ?? null;
}

/** "Shoot + Anchor · Recurring", or whichever half is known, or null. */
export function describeRequirement(
  serviceRequirement: string | null | undefined,
  bookingFrequency: string | null | undefined,
): string | null {
  const parts = [serviceRequirement?.trim() || null, bookingFrequencyLabel(bookingFrequency)].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
