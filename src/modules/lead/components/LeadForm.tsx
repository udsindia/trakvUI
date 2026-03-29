import type { FormEventHandler } from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import type {
  LeadFormOptions,
  LeadFormValues,
} from "@/modules/lead/leadForm.types";
import { MultiSelectAutocomplete } from "@/shared/components/MultiSelectAutocomplete";

const MAX_NOTES_LENGTH = 500;

type LeadFormProps = {
  form: UseFormReturn<LeadFormValues>;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLDivElement>;
  options: LeadFormOptions;
};

export function LeadForm({
  form,
  onCancel,
  onSubmit,
  options,
}: LeadFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

  const notesValue = useWatch({
    control,
    name: "notes",
  });

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: 2.5,
    },
  };

  const alwaysVisibleLabelSlotProps = {
    inputLabel: {
      shrink: true,
    },
  } as const;

  const phoneValidation = {
    basicFormat: (value: string) =>
      /^\+?[0-9\s-]+$/.test(value) || "Phone number can only include digits, spaces, +, and -.",
    digitsLength: (value: string) =>
      value.replace(/\D/g, "").length >= 7 || "Enter a valid phone number.",
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: 3,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <CardContent component="form" noValidate sx={{ p: { xs: 2.5, md: 4 } }} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography variant="h6">Lead Information</Typography>
            <Typography color="text.secondary" variant="body2">
              Capture the primary contact and intake details for a new prospect.
            </Typography>
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    minLength: {
                      message: "Full name must be at least 3 characters.",
                      value: 3,
                    },
                    required: "Full name is required.",
                  }}
                  render={({ field }) => (
                    <TextField
                      autoComplete="name"
                      error={Boolean(errors.name)}
                      fullWidth
                      helperText={errors.name?.message}
                      id={field.name}
                      label="Full Name"
                      placeholder="Enter full name"
                      required
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    required: "Phone number is required.",
                    validate: phoneValidation,
                  }}
                  render={({ field }) => (
                    <TextField
                      autoComplete="tel"
                      error={Boolean(errors.phone)}
                      fullWidth
                      helperText={errors.phone?.message}
                      id={field.name}
                      label="Phone Number"
                      placeholder="+91 98765 43210"
                      required
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  rules={{
                    pattern: {
                      message: "Enter a valid email address.",
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    },
                    required: "Email address is required.",
                  }}
                  render={({ field }) => (
                    <TextField
                      autoComplete="email"
                      error={Boolean(errors.email)}
                      fullWidth
                      helperText={errors.email?.message}
                      id={field.name}
                      label="Email Address"
                      placeholder="name@example.com"
                      required
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      type="email"
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="countries"
                  rules={{
                    validate: (value) =>
                      value.length > 0 || "Select at least one country.",
                  }}
                  render={({ field }) => (
                    <MultiSelectAutocomplete
                      error={Boolean(errors.countries)}
                      helperText={errors.countries?.message}
                      id={field.name}
                      label="Country"
                      options={options.countryOptions}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder="Select countries"
                      required
                      sx={fieldSx}
                      value={field.value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="intakeDate"
                  rules={{
                    required: "Intake date is required.",
                  }}
                  render={({ field }) => (
                    <TextField
                      error={Boolean(errors.intakeDate)}
                      fullWidth
                      helperText={errors.intakeDate?.message}
                      id={field.name}
                      label="Intake Date"
                      placeholder="Select intake date"
                      required
                      slotProps={{
                        htmlInput: {
                          "aria-label": "Intake Date",
                        },
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                      sx={fieldSx}
                      type="date"
                      {...field}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="courses"
                  rules={{
                    validate: (value) =>
                      value.length > 0 || "Select at least one desired course.",
                  }}
                  render={({ field }) => (
                    <MultiSelectAutocomplete
                      error={Boolean(errors.courses)}
                      helperText={errors.courses?.message}
                      id={field.name}
                      label="Desired Course"
                      options={options.courseOptions}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder="Select courses"
                      required
                      sx={fieldSx}
                      value={field.value}
                    />
                  )}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Controller
                  control={control}
                  name="source"
                  rules={{
                    required: "Lead source is required.",
                  }}
                  render={({ field }) => (
                    <TextField
                      error={Boolean(errors.source)}
                      fullWidth
                      helperText={errors.source?.message}
                      id={field.name}
                      label="Lead Source"
                      required
                      select
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    >
                      <MenuItem disabled value="">
                        Select source
                      </MenuItem>
                      {options.sourceOptions.map((sourceOption) => (
                        <MenuItem key={sourceOption} value={sourceOption}>
                          {sourceOption}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  control={control}
                  name="agent"
                  rules={{
                    required: "Assigned agent is required.",
                  }}
                  render={({ field }) => (
                    <TextField
                      error={Boolean(errors.agent)}
                      fullWidth
                      helperText={errors.agent?.message}
                      id={field.name}
                      label="Assigned Agent"
                      required
                      select
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    >
                      <MenuItem disabled value="">
                        Select agent
                      </MenuItem>
                      {options.agentOptions.map((agentOption) => (
                        <MenuItem key={agentOption} value={agentOption}>
                          {agentOption}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <MultiSelectAutocomplete
                      allowCustomValues
                      id={field.name}
                      label="Tags"
                      options={options.tagOptions}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder="Select or type tags"
                      sx={fieldSx}
                      value={field.value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      helperText={`${(notesValue ?? "").length}/${MAX_NOTES_LENGTH}`}
                      id={field.name}
                      inputProps={{ maxLength: MAX_NOTES_LENGTH }}
                      label="Notes"
                      minRows={11}
                      multiline
                      placeholder="Add any additional notes about this lead..."
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                    />
                  )}
                />
              </Stack>
            </Grid>
          </Grid>

          <Divider />

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button
              disabled={isSubmitting}
              sx={{ minWidth: 120, textTransform: "none" }}
              type="button"
              variant="outlined"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress color="inherit" size={16} /> : null
              }
              sx={{ minWidth: 140, textTransform: "none" }}
              type="submit"
              variant="contained"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
