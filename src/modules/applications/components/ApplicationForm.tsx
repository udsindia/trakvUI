import type { FormEventHandler } from "react";
import {
  Alert,
  Box,
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
import { Controller, type UseFormReturn } from "react-hook-form";
import type { ApplicationFormValues } from "@/modules/applications/applicationForm.types";
import type { BackendLead } from "@/modules/lead/leadApi";

type ApplicationFormProps = {
  form: UseFormReturn<ApplicationFormValues>;
  leads: BackendLead[];
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ApplicationForm({
  form,
  leads,
  onCancel,
  onSubmit,
}: ApplicationFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = form;

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
      <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={3}>
            {errors.root?.message && (
              <Alert severity={errors.root.message.includes("warming up") ? "warning" : "error"}>
                {errors.root.message}
              </Alert>
            )}
            <Stack spacing={0.75}>
              <Typography variant="h6">Application Information</Typography>
              <Typography color="text.secondary" variant="body2">
                Provide details for the student's university application.
              </Typography>
            </Stack>

            <Divider />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="leadId"
                  render={({ field }) => (
                    <TextField
                      error={Boolean(errors.leadId)}
                      fullWidth
                      helperText={errors.leadId?.message || "Optional: Select an existing lead to auto-fill details"}
                      id={field.name}
                      label="Select Lead (Optional)"
                      select
                      slotProps={alwaysVisibleLabelSlotProps}
                      sx={fieldSx}
                      {...field}
                      value={field.value || ""}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {leads.map((lead) => (
                        <MenuItem key={lead.id} value={lead.id}>
                          {lead.firstName} {lead.lastName} ({lead.email})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="studentName"
                    rules={{ required: "Student name is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.studentName)}
                        fullWidth
                        helperText={errors.studentName?.message}
                        id={field.name}
                        label="Student Name"
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
                    name="phone"
                    rules={{ required: "Phone number is required." }}
                    render={({ field }) => (
                      <TextField
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
                    name="targetCountry"
                    rules={{ required: "Target country is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.targetCountry)}
                        fullWidth
                        helperText={errors.targetCountry?.message}
                        id={field.name}
                        label="Target Country"
                        placeholder="e.g. Canada"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Controller
                    control={control}
                    name="targetUniversity"
                    rules={{ required: "Target university is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.targetUniversity)}
                        fullWidth
                        helperText={errors.targetUniversity?.message}
                        id={field.name}
                        label="Target University"
                        placeholder="e.g. University of Toronto"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="course"
                    rules={{ required: "Course is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.course)}
                        fullWidth
                        helperText={errors.course?.message}
                        id={field.name}
                        label="Course"
                        placeholder="e.g. MS Computer Science"
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="intakeMonth"
                    rules={{ required: "Intake month is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.intakeMonth)}
                        fullWidth
                        helperText={errors.intakeMonth?.message}
                        id={field.name}
                        label="Intake Month"
                        select
                        required
                        slotProps={alwaysVisibleLabelSlotProps}
                        sx={fieldSx}
                        {...field}
                      >
                        <MenuItem disabled value="">Select Month</MenuItem>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                          <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    control={control}
                    name="intakeYear"
                    rules={{ required: "Intake year is required." }}
                    render={({ field }) => (
                      <TextField
                        error={Boolean(errors.intakeYear)}
                        fullWidth
                        helperText={errors.intakeYear?.message}
                        id={field.name}
                        label="Intake Year"
                        type="number"
                        required
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
                {isSubmitting ? "Saving..." : "Save Application"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
