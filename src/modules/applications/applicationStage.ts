import type { ApplicationStage } from "@/modules/applications/applicationForm.types";

/**
 * How an application's progress is turned into a label.
 *
 * Kept apart from applicationsApi so it stays free of the HTTP client, which reads
 * import.meta.env and cannot be imported by the node-side unit tests.
 */

/**
 * ApplicationOutcome on the server, as a label.
 *
 * The first block is the real enum (com.Trakv.enums.ApplicationOutcome). The second is
 * the older vocabulary this map used to be written against, kept because it costs nothing
 * and older rows may still carry those values.
 *
 * The two barely overlapped: OFFER_ACCEPTED, ENROLLED, OFFER_DECLINED, WITHDRAWN and
 * REJECTED all fell through to the "Draft" default, so a withdrawn application read as a
 * draft one.
 */
const OUTCOME_TO_STAGE: Record<string, string> = {
  IN_PROGRESS: "Processing",
  OFFER_ACCEPTED: "Offer Accepted",
  ENROLLED: "Enrolled",
  VISA_REJECTED: "Visa Rejected",
  OFFER_DECLINED: "Offer Declined",
  WITHDRAWN: "Withdrawn",
  REJECTED: "Rejected",

  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  VISA_APPLIED: "Visa Applied",
  VISA_APPROVED: "Visa Approved",
  COMPLETED: "Completed",
};

const STAGE_TO_OUTCOME: Record<ApplicationStage, string> = {
  Draft: "DRAFT",
  Submitted: "SUBMITTED",
  Processing: "IN_PROGRESS",
  "Visa Applied": "VISA_APPLIED",
  "Visa Approved": "VISA_APPROVED",
  "Visa Rejected": "VISA_REJECTED",
  Completed: "COMPLETED",
};

export function mapOutcomeToStage(outcome: string | null | undefined): string {
  if (!outcome) {
    return "Draft";
  }

  const normalized = outcome.trim().toUpperCase().replace(/\s+/g, "_");
  // An outcome we do not know reads as itself, title-cased. Defaulting to "Draft" made a
  // new enum value look like a real, wrong status instead of an obviously unhandled one.
  return (
    OUTCOME_TO_STAGE[normalized] ??
    normalized
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/**
 * The label to show for an application's progress.
 *
 * outcome is not it. It is set to IN_PROGRESS when the application is created and only
 * moves again when the application closes, so mapping it alone labels every open
 * application "Processing" no matter which stage it has actually reached. The real
 * progress is currentStageName, which follows the country's stage template.
 *
 * Falls back to the outcome for an application with no stages, which is the only case
 * where the outcome really is the whole story.
 */
export function applicationStageLabel(application: {
  currentStageName?: string | null;
  stage?: string | null;
  outcome?: string | null;
}): string {
  return (
    application.currentStageName?.trim() ||
    application.stage?.trim() ||
    mapOutcomeToStage(application.outcome)
  );
}

export function mapStageToOutcome(stage: ApplicationStage): string {
  return STAGE_TO_OUTCOME[stage] ?? "DRAFT";
}

/**
 * Solid tints rather than alpha overlays, so chips read consistently on both
 * the white row and the tinted hover/selected states.
 *
 * Lives here rather than beside one table because two lists now draw the same
 * stage — the applications table and the application-status column on the
 * students list — and a stage that is blue in one and grey in the other reads
 * as two different things. A stage with no entry falls back to MUI's default
 * chip, which is the neutral grey a Draft already uses.
 */
export const applicationStageStyles: Record<
  string,
  { backgroundColor: string; color: string }
> = {
  Draft: { backgroundColor: "#EEF2F6", color: "#55707C" },
  Submitted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Processing: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  "Visa Applied": { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  "Visa Approved": { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  "Documents Verified": { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  "Visa Rejected": { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Completed: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
};
