import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Snackbar } from "@mui/material";
import AddTaskRounded from "@mui/icons-material/AddTaskRounded";
import { CreateTaskModal } from "@/modules/activities/components/CreateTaskModal";
import {
  activityService,
  type ActivityEntityType,
  type CreateTaskRequest,
} from "@/modules/activities/activityService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type AddTaskForRecordButtonProps = {
  entityType: Extract<ActivityEntityType, "LEAD" | "STUDENT" | "APPLICATION">;
  entityId: string;
  /** How the record is named back to the user in the dialog. */
  label: string;
  /** An application task carries its student too; ignored for the other two. */
  studentId?: string | null;
  size?: "small" | "medium";
};

/**
 * Raise a task against the record you are already looking at.
 *
 * The task board's own button asks which lead or student it is for, from a list of all of
 * them — reasonable there, absurd here, where the answer is on the screen. So the record
 * is locked and the three pickers never render, which also means this button costs no
 * extra fetches: the lists behind them are not needed.
 */
export function AddTaskForRecordButton({
  entityType,
  entityId,
  label,
  studentId = null,
  size = "small",
}: AddTaskForRecordButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snack, setSnack] = useState("");

  const createTask = useMutation({
    mutationFn: (request: CreateTaskRequest) => activityService.createTask(request),
    onSuccess: async () => {
      setOpen(false);
      setSnack("Task created");
      // The board, and whichever record page is showing its own timeline.
      await queryClient.invalidateQueries({ queryKey: ["activities", "tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      await queryClient.invalidateQueries({ queryKey: ["application"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  return (
    <>
      <Button
        size={size}
        startIcon={<AddTaskRounded />}
        sx={{ textTransform: "none" }}
        variant="outlined"
        onClick={() => setOpen(true)}
      >
        Add task
      </Button>

      <CreateTaskModal
        applications={[]}
        errorMessage={
          createTask.isError
            ? getApiErrorMessage(createTask.error, "Unable to create the task.")
            : null
        }
        isSubmitting={createTask.isPending}
        leads={[]}
        lockedEntity={{ entityType, id: entityId, label, studentId }}
        open={open}
        students={[]}
        onClose={() => setOpen(false)}
        onSubmit={async (request) => {
          await createTask.mutateAsync(request);
        }}
      />

      <Snackbar
        autoHideDuration={3000}
        message={snack}
        open={Boolean(snack)}
        onClose={() => setSnack("")}
      />
    </>
  );
}
