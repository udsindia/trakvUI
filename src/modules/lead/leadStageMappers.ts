const UI_TO_BACKEND_STAGE: Record<string, string> = {
  New: "NEW",
  Contacted: "CONTACTED",
  Qualified: "QUALIFIED",
  Prospective: "PROSPECTIVE",
  // "Enrolled" is the UI name for the existing CONVERTED stage rather than a
  // separate one, so converted leads keep their stored value.
  Enrolled: "CONVERTED",
};

const BACKEND_TO_UI_STAGE: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROSPECTIVE: "Prospective",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Enrolled",
  LOST: "Lost",
  ARCHIVED: "Archived",
};

export function toBackendLeadStage(stage: string): string {
  return UI_TO_BACKEND_STAGE[stage] ?? stage.toUpperCase().replace(/\s+/g, "_");
}

export function fromBackendLeadStage(stage: string | null | undefined): string {
  if (!stage) return "New";
  return BACKEND_TO_UI_STAGE[stage] ?? stage;
}
