import { useEffect } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { ActivityEntityType, CreateTaskRequest } from "@/modules/activities/activityService";
import type { BackendApplication } from "@/modules/applications/applicationsApi";
import type { StudentOption } from "@/modules/applications/studentsApi";
import type { BackendLead } from "@/modules/lead/leadApi";
import type { TaskPriority } from "@/modules/activities/types/types";

export type CreateTaskFormValues = {
  applicationId: string;
  description: string;
  dueDate: string;
  entityType: ActivityEntityType;
  leadId: string;
  priority: TaskPriority;
  studentId: string;
  title: string;
};

type CreateTaskModalProps = {
  applications: BackendApplication[];
  errorMessage?: string | null;
  isLoadingLinks?: boolean;
  isSubmitting?: boolean;
  leads: BackendLead[];
  open: boolean;
  students: StudentOption[];
  onClose: () => void;
  onSubmit: (request: CreateTaskRequest) => Promise<void> | void;
};

const defaultValues: CreateTaskFormValues = {
  applicationId: "",
  description: "",
  dueDate: "",
  entityType: "GENERAL",
  leadId: "",
  priority: "MEDIUM",
  studentId: "",
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

function getApplicationLabel(application: BackendApplication) {
  return (
    [application.studentName, application.universityName].filter(Boolean).join(" — ") ||
    application.id
  );
}

export function CreateTaskModal({
  applications,
  errorMessage,
  isLoadingLinks = false,
  isSubmitting = false,
  leads,
  open,
  students,
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

    // An APPLICATION task carries its student too -- CreateTaskRequest on the server
    // requires both, and the application already knows which student it belongs to.
    const application =
      values.entityType === "APPLICATION"
        ? applications.find((item) => item.id === values.applicationId)
        : undefined;

    await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      dueDate: values.dueDate,
      entityType: values.entityType,
      leadId: values.entityType === "LEAD" ? values.leadId : null,
      studentId:
        values.entityType === "STUDENT"
          ? values.studentId
          : values.entityType === "APPLICATION"
            ? (application?.studentId ?? null)
            : null,
      applicationId: values.entityType === "APPLICATION" ? values.applicationId : null,
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
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="APPLICATION">Application</MenuItem>
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

            {/*
              Autocompletes rather than plain selects: these lists are as long as the
              tenant's data. Scrolling 154 leads to find one is the same problem the
              application form had.
            */}
            {entityType === "LEAD" ? (
              <Controller
                control={control}
                name="leadId"
                rules={{ required: "Select a lead." }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={isSubmitting || isLoadingLinks}
                    options={leads}
                    getOptionLabel={getLeadName}
                    isOptionEqualToValue={(option, selected) => option.id === selected.id}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Stack spacing={0} sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5 }}>{getLeadName(option)}</Typography>
                          {option.email ? (
                            <Typography sx={{ color: "text.disabled", fontSize: 11 }}>
                              {option.email}
                            </Typography>
                          ) : null}
                        </Stack>
                      </li>
                    )}
                    value={leads.find((lead) => lead.id === field.value) ?? null}
                    onChange={(_event, option) => field.onChange(option ? option.id : "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={Boolean(errors.leadId)}
                        fullWidth
                        helperText={errors.leadId?.message}
                        label="Lead"
                        placeholder="Search leads"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                )}
              />
            ) : null}

            {entityType === "STUDENT" ? (
              <Controller
                control={control}
                name="studentId"
                rules={{ required: "Select a student." }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={isSubmitting || isLoadingLinks}
                    options={students}
                    getOptionLabel={(option) => option.name || option.email}
                    isOptionEqualToValue={(option, selected) => option.id === selected.id}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Stack spacing={0} sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5 }}>
                            {option.name || "Unnamed student"}
                          </Typography>
                          <Typography sx={{ color: "text.disabled", fontSize: 11 }}>
                            {option.email}
                          </Typography>
                        </Stack>
                      </li>
                    )}
                    value={students.find((student) => student.id === field.value) ?? null}
                    onChange={(_event, option) => field.onChange(option ? option.id : "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={Boolean(errors.studentId)}
                        fullWidth
                        helperText={errors.studentId?.message}
                        label="Student"
                        placeholder="Search students"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                )}
              />
            ) : null}

            {entityType === "APPLICATION" ? (
              <Controller
                control={control}
                name="applicationId"
                rules={{ required: "Select an application." }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={isSubmitting || isLoadingLinks}
                    options={applications}
                    getOptionLabel={getApplicationLabel}
                    isOptionEqualToValue={(option, selected) => option.id === selected.id}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Stack spacing={0} sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5 }}>
                            {option.studentName || "Unnamed student"}
                          </Typography>
                          <Typography sx={{ color: "text.disabled", fontSize: 11 }}>
                            {[option.universityName, option.courseName].filter(Boolean).join(" · ")}
                          </Typography>
                        </Stack>
                      </li>
                    )}
                    value={applications.find((item) => item.id === field.value) ?? null}
                    onChange={(_event, option) => field.onChange(option ? option.id : "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={Boolean(errors.applicationId)}
                        fullWidth
                        helperText={errors.applicationId?.message}
                        label="Application"
                        placeholder="Search applications"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
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
