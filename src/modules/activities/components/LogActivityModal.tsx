import { useEffect, useMemo, type ReactNode } from "react";
import CallRounded from "@mui/icons-material/CallRounded";
import ChatRounded from "@mui/icons-material/ChatRounded";
import EventRounded from "@mui/icons-material/EventRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import {
  activityTemplateOptions,
  applicationReferenceOptions,
  loggableActivityTypes,
  studentReferenceOptions,
} from "@/modules/activities/mock/mockData";
import type { ActivityEntityType } from "@/modules/activities/activityService";
import type { LoggableActivityType } from "@/modules/activities/types/types";
import type { BackendLead } from "@/modules/lead/leadApi";
import { DialogModal } from "@/shared/components/DialogModal";

type LogActivityModalProps = {
  isSubmitting?: boolean;
  isLoadingLeads?: boolean;
  leads: BackendLead[];
  open: boolean;
  onClose: () => void;
  onEntityTypeChange?: (entityType: ActivityEntityType) => void;
  onSubmit: (values: LogActivityFormValues) => Promise<void> | void;
  submitErrorMessage?: string | null;
};

export type LogActivityFormValues = {
  duration: string;
  entityId: string;
  entityType: ActivityEntityType;
  followUpAt: string;
  notes: string;
  template: string;
  type: LoggableActivityType | "";
};

const defaultValues: LogActivityFormValues = {
  duration: "",
  entityId: "",
  entityType: "GENERAL",
  followUpAt: "",
  notes: "",
  template: activityTemplateOptions[0] ?? "",
  type: "",
};

const typeIcons: Record<LoggableActivityType, ReactNode> = {
  CALL: <CallRounded fontSize="small" />,
  MEETING: <EventRounded fontSize="small" />,
  WHATSAPP: <ChatRounded fontSize="small" />,
  EMAIL: <MailOutlineRounded fontSize="small" />,
};

function isValidLocalDateTime(value: string) {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

function getLeadName(lead: BackendLead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || lead.id;
}

export function LogActivityModal({
  isSubmitting = false,
  isLoadingLeads = false,
  leads,
  open,
  onClose,
  onEntityTypeChange,
  onSubmit,
  submitErrorMessage,
}: LogActivityModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LogActivityFormValues>({
    defaultValues,
    mode: "onBlur",
  });
  const entityType = watch("entityType");

  const typeLabels = useMemo(
    () =>
      loggableActivityTypes.map((type) => ({
        icon: typeIcons[type],
        label: type,
        value: type,
      })),
    [],
  );

  useEffect(() => {
    setValue("entityId", "");
    onEntityTypeChange?.(entityType);
  }, [entityType, onEntityTypeChange, setValue]);

  const entityReferenceOptions = useMemo(() => {
    if (entityType === "LEAD") {
      return leads.map((lead) => ({
        id: lead.id,
        name: getLeadName(lead),
      }));
    }

    if (entityType === "STUDENT") return studentReferenceOptions;
    if (entityType === "APPLICATION") return applicationReferenceOptions;
    return [];
  }, [entityType, leads]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const handleFormSubmit = async (values: LogActivityFormValues) => {
    await onSubmit(values);
    handleClose();
  };

  return (
    <DialogModal
      actions={
        <>
          <Button disabled={isSubmitting} sx={{ textTransform: "none" }} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            sx={{ px: 2.25, textTransform: "none" }}
            type="submit"
            variant="contained"
          >
            {isSubmitting ? <CircularProgress color="inherit" size={18} /> : "Save Activity"}
          </Button>
        </>
      }
      maxWidth="md"
      open={open}
      title="Log Activity"
      onClose={handleClose}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <Stack spacing={3}>
        {submitErrorMessage ? <Alert severity="error">{submitErrorMessage}</Alert> : null}

        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 600 }} variant="body2">
            Activity Type
          </Typography>

          <Controller
            control={control}
            name="type"
            rules={{
              required: "Select an activity type.",
            }}
            render={({ field }) => (
              <FormControl error={Boolean(errors.type)}>
                <ToggleButtonGroup
                  disabled={isSubmitting}
                  exclusive
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                  value={field.value}
                  onChange={(_, nextValue) => {
                    field.onChange(nextValue ?? "");
                  }}
                >
                  {typeLabels.map((typeOption) => (
                    <ToggleButton
                      key={typeOption.value}
                      sx={{
                        borderRadius: "14px !important",
                        borderWidth: "1px !important",
                        gap: 0.75,
                        justifyContent: "center",
                        minHeight: 48,
                        textTransform: "none",
                      }}
                      value={typeOption.value}
                    >
                      {typeOption.icon}
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {typeOption.label}
                      </Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {errors.type ? (
                  <Typography color="error.main" sx={{ mt: 0.75 }} variant="caption">
                    {errors.type.message}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        </Stack>

        <Stack spacing={2}>
          <Controller
            control={control}
            name="entityType"
            rules={{
              required: "Select an entity type.",
            }}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isSubmitting}
                error={Boolean(errors.entityType)}
                fullWidth
                helperText={errors.entityType?.message}
                label="Entity Type"
                select
              >
                <MenuItem value="GENERAL">General</MenuItem>
                <MenuItem value="LEAD">Lead</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="APPLICATION">Application</MenuItem>
              </TextField>
            )}
          />

          {entityType !== "GENERAL" ? (
            <Controller
              control={control}
              name="entityId"
              rules={{
                validate: (value) => Boolean(value) || `Select a ${entityType.toLowerCase()}.`,
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isSubmitting || (entityType === "LEAD" && isLoadingLeads)}
                  error={Boolean(errors.entityId)}
                  fullWidth
                  helperText={
                    errors.entityId?.message ??
                    (entityType === "LEAD" && isLoadingLeads ? "Loading leads..." : undefined)
                  }
                  label={
                    entityType === "LEAD"
                      ? "Lead"
                      : entityType === "STUDENT"
                        ? "Student"
                        : "Application"
                  }
                  select
                >
                  <MenuItem disabled value="">
                    Select {entityType.toLowerCase()}
                  </MenuItem>
                  {entityReferenceOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          ) : null}
        </Stack>

        <Controller
          control={control}
          name="duration"
          rules={{
            validate: (value) => {
              if (!value) return true;
              const duration = Number(value);
              if (!Number.isInteger(duration)) return "Duration must be a whole number.";
              return duration > 0 || "Duration must be greater than 0 minutes.";
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={Boolean(errors.duration)}
              fullWidth
              helperText={errors.duration?.message}
              label="Duration (minutes)"
              placeholder="Enter duration in minutes"
              type="number"
              InputLabelProps={{ shrink: true }}
            />
          )}
        />

        <Stack spacing={1.25}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography sx={{ fontWeight: 600 }} variant="body2">
              Outcome Notes
            </Typography>

            <Controller
              control={control}
              name="template"
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={isSubmitting}
                  select
                  size="small"
                  sx={{ minWidth: 172 }}
                  aria-label="Use template"
                >
                  {activityTemplateOptions.map((template) => (
                    <MenuItem key={template} value={template}>
                      {template}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          <Controller
            control={control}
            name="notes"
            rules={{
              required: "Outcome notes are required.",
              validate: (value) => value.trim().length > 0 || "Outcome notes are required.",
            }}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isSubmitting}
                error={Boolean(errors.notes)}
                fullWidth
                helperText={errors.notes?.message}
                minRows={4}
                multiline
                placeholder="Enter detailed notes about the activity outcome..."
              />
            )}
          />
        </Stack>

        <Controller
          control={control}
          name="followUpAt"
          rules={{
            validate: (value) => isValidLocalDateTime(value) || "Enter a valid follow-up date.",
          }}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={Boolean(errors.followUpAt)}
              fullWidth
              helperText={errors.followUpAt?.message}
              label="Next Follow-up"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Stack>
    </DialogModal>
  );
}
