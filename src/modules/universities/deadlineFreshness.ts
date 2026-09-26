/**
 * How much to trust a stored application deadline.
 *
 * A deadline is the one piece of intake data that moves on its own, and a stale one is
 * worse than none: a counsellor who trusts "15 March" after the university quietly moved
 * it to 30 April loses an application that would have succeeded. So a deadline is shown
 * with the age of the claim, and stops being shown as fact once it is old or passed.
 */
export type DeadlineTone = "none" | "fresh" | "ageing" | "stale" | "passed";

export type DeadlineVerdict = {
  tone: DeadlineTone;
  /** What to show instead of, or alongside, the date. */
  label: string;
  /** Null when there is nothing to qualify. */
  note: string | null;
};

/** Beyond this, a deadline has not been checked recently enough to state plainly. */
const AGEING_DAYS = 60;
const STALE_DAYS = 180;

const daysBetween = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / 86_400_000);

function ago(days: number): string {
  if (days <= 1) return "today";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return "over a year ago";
}

export function assessDeadline(
  applicationDeadline?: string | null,
  deadlineConfirmedAt?: string | null,
  now: Date = new Date(),
): DeadlineVerdict {
  if (!applicationDeadline) {
    return { tone: "none", label: "Rolling", note: null };
  }

  const due = new Date(applicationDeadline);
  if (Number.isNaN(due.getTime())) {
    return { tone: "none", label: "Rolling", note: null };
  }

  // A date in the past is not a deadline any more, whenever it was confirmed. Showing it
  // plainly would read as "you have until then".
  if (daysBetween(due, now) > 0) {
    return {
      tone: "passed",
      label: `Closed ${applicationDeadline}`,
      note: "This date has passed — confirm with the university before applying.",
    };
  }

  if (!deadlineConfirmedAt) {
    return {
      tone: "stale",
      label: `Apply by ${applicationDeadline}`,
      note: "Never confirmed — check with the university.",
    };
  }

  const confirmed = new Date(deadlineConfirmedAt);
  if (Number.isNaN(confirmed.getTime())) {
    return { tone: "stale", label: `Apply by ${applicationDeadline}`, note: "Never confirmed." };
  }

  const age = daysBetween(confirmed, now);
  if (age >= STALE_DAYS) {
    return {
      tone: "stale",
      label: `Apply by ${applicationDeadline}`,
      note: `Last confirmed ${ago(age)} — check before relying on it.`,
    };
  }
  if (age >= AGEING_DAYS) {
    return {
      tone: "ageing",
      label: `Apply by ${applicationDeadline}`,
      note: `Confirmed ${ago(age)}.`,
    };
  }
  return {
    tone: "fresh",
    label: `Apply by ${applicationDeadline}`,
    note: `Confirmed ${ago(age)}.`,
  };
}
