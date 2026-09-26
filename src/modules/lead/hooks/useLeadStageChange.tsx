import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LeadChangeCommentDialog } from "@/modules/lead/components/LeadChangeCommentDialog";
import { ENROLLED_STAGE, toBackendLeadStage } from "@/modules/lead/leadStageMappers";
import { leadApi } from "@/modules/lead/leadApi";
import { EnrolStudentDialog } from "@/modules/students/components/EnrolStudentDialog";
import { studentsApi, type UpdateStudentPayload } from "@/modules/students/studentsApi";
import { activityService } from "@/modules/activities/activityService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type RequestStageChange = (input: {
  leadId: string;
  leadName: string;
  stage: string;
}) => Promise<void>;

type UseLeadStageChangeResult = {
  /** Opens the right dialog and resolves once it closes, either way. */
  requestStageChange: RequestStageChange;
  /**
   * The same comment prompt, for any other change worth explaining — reassignment uses it.
   * The caller supplies the action; this only collects the remark and runs it.
   */
  requestComment: (input: {
    title: string;
    summary: string;
    /** Offer to raise a task alongside — reassignment does. */
    offerTask?: boolean;
    /** Where a task raised here should land, when offerTask is on. */
    taskTarget?: { leadId: string; assignedToId?: string | null } | null;
    run: (comment: string) => Promise<void>;
  }) => Promise<void>;
  /** Render this once, anywhere in the tree. */
  dialogs: React.ReactNode;
  /** The last thing that happened, for the caller's own snackbar. */
  lastMessage: string;
  clearLastMessage: () => void;
};

/**
 * Changing a lead's stage, wherever that is asked for.
 *
 * It lived on the leads list, which meant a counsellor reading a lead had to go back to
 * the list to move it — and it carries two dialogs and a two-step enrolment, so a second
 * copy on the detail page would have drifted from this one within a release. The hook owns
 * the decision; callers own the control that triggers it.
 */
export function useLeadStageChange(): UseLeadStageChangeResult {
  const queryClient = useQueryClient();
  const [lastMessage, setLastMessage] = useState("");

  const [pendingChange, setPendingChange] = useState<{
    title: string;
    summary: string;
    offerTask?: boolean;
    taskTarget?: { leadId: string; assignedToId?: string | null } | null;
    run: (comment: string) => Promise<void>;
    done: () => void;
  } | null>(null);
  const [committing, setCommitting] = useState(false);

  const [pendingEnrolment, setPendingEnrolment] = useState<{
    id: string;
    name: string;
    done: () => void;
  } | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolError, setEnrolError] = useState<string | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await queryClient.invalidateQueries({ queryKey: ["lead"] });
  };

  const applyStage = async (leadId: string, stage: string, comment: string) => {
    try {
      await leadApi.updateLead(leadId, { leadStage: toBackendLeadStage(stage), comment });
      await refresh();
      setLastMessage(`Stage updated to ${stage}`);
    } catch (error) {
      setLastMessage(getApiErrorMessage(error, "Failed to update stage"));
    }
  };

  /**
   * Enrols, then fills in what a lead never carried.
   *
   * Two calls in that order and not one: the stage change is what creates the student, so
   * the profile has nowhere to go until it has happened. A profile that fails to save
   * leaves an enrolled student with blank fields — recoverable on their own page — rather
   * than a lead stuck outside the pipeline.
   */
  const applyEnrolment = async (
    leadId: string,
    comment: string,
    profile: UpdateStudentPayload,
  ) => {
    setEnrolError(null);
    try {
      const lead = await leadApi.updateLead(leadId, {
        leadStage: toBackendLeadStage(ENROLLED_STAGE),
        comment,
      });

      const hasProfile = Object.values(profile).some(
        (field) => field !== null && field !== undefined && field !== "",
      );
      if (hasProfile && lead?.studentId) {
        await studentsApi.updateStudent(lead.studentId, profile);
      }

      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setPendingEnrolment(null);
      setLastMessage("Lead enrolled — student record created");
    } catch (error) {
      setEnrolError(getApiErrorMessage(error, "Could not enrol this lead."));
      throw error;
    }
  };

  const requestComment: UseLeadStageChangeResult["requestComment"] = (input) =>
    new Promise<void>((resolve) => {
      setPendingChange({ ...input, done: resolve });
    });

  const requestStageChange: RequestStageChange = ({ leadId, leadName, stage }) => {
    // Enrolling is not a stage change like the others — it creates a student, and this is
    // the moment somebody has the passport and the transcript in front of them.
    if (stage === ENROLLED_STAGE) {
      return new Promise<void>((resolve) => {
        setPendingEnrolment({ id: leadId, name: leadName, done: resolve });
      });
    }

    return new Promise<void>((resolve) => {
      setPendingChange({
        title: `Move to ${stage}`,
        summary: leadName,
        run: (comment) => applyStage(leadId, stage, comment),
        done: resolve,
      });
    });
  };

  const dialogs = (
    <>
      <EnrolStudentDialog
        errorMessage={enrolError}
        leadName={pendingEnrolment?.name ?? ""}
        open={Boolean(pendingEnrolment)}
        saving={enrolling}
        onCancel={() => {
          pendingEnrolment?.done();
          setPendingEnrolment(null);
          setEnrolError(null);
        }}
        onConfirm={async ({ comment, profile }) => {
          if (!pendingEnrolment) return;
          setEnrolling(true);
          try {
            await applyEnrolment(pendingEnrolment.id, comment, profile);
            pendingEnrolment.done();
          } catch {
            // Stays open with the error showing, so the entered profile is not lost.
          } finally {
            setEnrolling(false);
          }
        }}
      />

      <LeadChangeCommentDialog
        offerTask={pendingChange?.offerTask}
        open={Boolean(pendingChange)}
        saving={committing}
        summary={pendingChange?.summary ?? ""}
        title={pendingChange?.title ?? ""}
        onCancel={() => {
          pendingChange?.done();
          setPendingChange(null);
        }}
        onConfirm={async ({ comment, task }) => {
          if (!pendingChange) return;
          setCommitting(true);
          try {
            await pendingChange.run(comment);

            // After the change, and separately: a task that fails to save is worth an
            // error, not a reassignment that silently did not happen.
            const target = pendingChange.taskTarget;
            if (task && target) {
              await activityService.createTask({
                title: task.title,
                description: "Raised when the lead was reassigned.",
                dueDate: task.dueDate,
                entityType: "LEAD",
                leadId: target.leadId,
                priority: "MEDIUM",
                assignedToId: target.assignedToId ?? null,
              });
              await queryClient.invalidateQueries({ queryKey: ["activities", "tasks"] });
            }
          } finally {
            setCommitting(false);
            pendingChange.done();
            setPendingChange(null);
          }
        }}
      />
    </>
  );

  return {
    requestStageChange,
    requestComment,
    dialogs,
    lastMessage,
    clearLastMessage: () => setLastMessage(""),
  };
}
