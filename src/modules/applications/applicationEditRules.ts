import type { ApplicationDetail, ApplicationStageDetail } from "@/modules/applications/applicationsApi";

/**
 * When an application's details may be edited. Mirrors ApplicationService on the backend
 * (isWithinEditableStages / isInFirstStage / editableUpToIndex) — keep the two in step.
 *
 * Details — destination country included — are editable while the application is open
 * and the current stage is at or before "Visa Applied". Changing the country keeps the
 * application's existing stages.
 */

const VISA_RESULT_WORDS = [
  "received", "granted", "approved", "issued", "stamped",
  "refused", "rejected", "denied", "decision", "outcome",
];

function isVisaResultStage(name: string | null | undefined): boolean {
  const n = (name ?? "").toLowerCase();
  return n.includes("visa") && VISA_RESULT_WORDS.some((w) => n.includes(w));
}

/**
 * Index of the last editable stage: "Visa Applied" if present; else the stage just before
 * the first visa result stage ("Visa Received", "Visa Granted", …); else the last stage.
 */
export function editableUpToIndex(stages: ApplicationStageDetail[]): number {
  const exact = stages.findIndex(
    (s) => (s.stageName ?? "").trim().toLowerCase() === "visa applied",
  );
  if (exact >= 0) {
    return exact;
  }
  const result = stages.findIndex((s) => isVisaResultStage(s.stageName));
  return result >= 0 ? result - 1 : stages.length - 1;
}

function sortedStages(application: ApplicationDetail): ApplicationStageDetail[] {
  return [...(application.stages ?? [])].sort((a, b) => a.stageOrder - b.stageOrder);
}

function currentStageIndex(application: ApplicationDetail, stages: ApplicationStageDetail[]) {
  return stages.findIndex((s) => s.id === application.currentStageId);
}

/** Open and at or before Visa Applied. */
export function isApplicationEditable(application: ApplicationDetail): boolean {
  if (application.outcome !== "IN_PROGRESS") {
    return false;
  }
  const stages = sortedStages(application);
  if (!application.currentStageId || stages.length === 0) {
    return true;
  }
  const current = currentStageIndex(application, stages);
  return current < 0 || current <= editableUpToIndex(stages);
}

/** The destination country follows the same rule as every other detail. */
export function isCountryEditable(application: ApplicationDetail): boolean {
  return isApplicationEditable(application);
}
