/**
 * "Enrolled" is the UI name for the stored CONVERTED stage — dashboard conversion-rate
 * queries key off that literal, so the label changed and the stored value did not.
 * Moving a lead into it makes the backend create the student record automatically.
 */
const UI_TO_BACKEND_STAGE: Record<string, string> = {
  New: "NEW",
  Contacted: "CONTACTED",
  Qualified: "QUALIFIED",
  Prospective: "PROSPECTIVE",
  Enrolled: "CONVERTED",
};

const BACKEND_TO_UI_STAGE: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROSPECTIVE: "Prospective",
  // Retired in favour of PROSPECTIVE; kept so pre-migration rows still render.
  PROPOSAL_SENT: "Prospective",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Enrolled",
  LOST: "Lost",
  ARCHIVED: "Archived",
};

/** The stage whose selection enrols the lead as a student. */
export const ENROLLED_STAGE = "Enrolled";

export function toBackendLeadStage(stage: string): string {
  return UI_TO_BACKEND_STAGE[stage] ?? stage.toUpperCase().replace(/\s+/g, "_");
}

export function fromBackendLeadStage(stage: string | null | undefined): string {
  if (!stage) return "New";
  return BACKEND_TO_UI_STAGE[stage] ?? stage;
}
