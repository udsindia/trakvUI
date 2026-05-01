import { useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { CreateTaskRequest } from "@/modules/activities/activityService";
import type { BackendLead } from "@/modules/lead/leadApi";
import type { TaskPriority } from "@/modules/activities/types/types";

export type CreateTaskFormValues = {
  description: string;
  dueDate: string;
  entityType: "GENERAL" | "LEAD";
  leadId: string;
  priority: TaskPriority;
  title: string;
};

type CreateTaskModalProps = {
  errorMessage?: string | null;
  isLoadingLeads?: boolean;
  isSubmitting?: boolean;
  leads: BackendLead[];
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateTaskRequest) => Promise<void> | void;
};

const defaultValues: CreateTaskFormValues = {
  description: "",
  dueDate: "",
  entityType: "GENERAL",
  leadId: "",
  priority: "MEDIUM",
  title: "",
};

function isValidDate(value: string) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function getLeadName(lead: BackendLead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || lead.id;
}

export function CreateTaskModal({
  errorMessage,
  isLoadingLeads = false,
  isSubmitting = false,
  leads,
  open,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    defaultValues,
    mode: "onBlur",
  });
  const entityType = watch("entityType");

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const handleValidSubmit = async (values: CreateTaskFormValues) => {
    const trimmedTitle = values.title.trim();
    const trimmedDescription = values.description.trim();

    await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      dueDate: values.dueDate,
      entityType: values.entityType,
      leadId: values.entityType === "LEAD" ? values.leadId : null,
      priority: values.priority,
    });
    handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <DialogTitle>Create Task</DialogTitle>
      <Stack component="form" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
        <DialogContent>
          <Stack spacing={2.25}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <Controller
              control={control}
              name="title"
              rules={{
                required: "Task title is required.",
                maxLength: {
                  value: 500,
                  message: "Task title must be 500 characters or fewer.",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isSubmitting}
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                  label="Title"
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              rules={{
                maxLength: {
                  value: 2000,
                  message: "Description must be 2000 characters or fewer.",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isSubmitting}
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                  label="Description"
                  minRows={3}
                  multiline
                  fullWidth
                />
              )}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                control={control}
                name="entityType"
                render={({ field }) => (
                  <TextField {...field} disabled={isSubmitting} fullWidth label="Link To" select>
                    <MenuItem value="GENERAL">General</MenuItem>
                    <MenuItem value="LEAD">Lead</MenuItem>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <TextField {...field} disabled={isSubmitting} fullWidth label="Priority" select>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </TextField>
                )}
              />
            </Stack>

            {entityType === "LEAD" ? (
              <Controller
                control={control}
                name="leadId"
                rules={{
                  required: "Select a lead.",
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    disabled={isSubmitting || isLoadingLeads}
                    error={Boolean(errors.leadId)}
                    fullWidth
                    helperText={errors.leadId?.message}
                    label="Lead"
                    select
                  >
                    {leads.map((lead) => (
                      <MenuItem key={lead.id} value={lead.id}>
                        {getLeadName(lead)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : null}

            <Controller
              control={control}
              name="dueDate"
              rules={{
                required: "Due date is required.",
                validate: (value) => isValidDate(value) || "Enter a valid due date.",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isSubmitting}
                  error={Boolean(errors.dueDate)}
                  fullWidth
                  helperText={errors.dueDate?.message}
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={isSubmitting} sx={{ textTransform: "none" }} onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} sx={{ textTransform: "none" }} type="submit" variant="contained">
            {isSubmitting ? <CircularProgress color="inherit" size={18} /> : "Create Task"}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
