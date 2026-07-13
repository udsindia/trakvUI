const UI_TO_BACKEND_STAGE: Record<string, string> = {
  New: "NEW",
  Contacted: "CONTACTED",
  Qualified: "QUALIFIED",
  Proposal: "PROPOSAL_SENT",
};

const BACKEND_TO_UI_STAGE: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Converted",
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
