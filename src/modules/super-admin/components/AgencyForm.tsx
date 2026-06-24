import { Box, Button, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { CreateAgencyRequest } from "@/modules/super-admin/superAdmin.types";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.paper",
    borderRadius: 2.5,
  },
};

const alwaysVisibleLabel = { inputLabel: { shrink: true } } as const;

type AgencyFormProps = {
  control: Control<CreateAgencyRequest>;
  errors: FieldErrors<CreateAgencyRequest>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
};

export function AgencyForm({
  control,
  errors,
  isSubmitting,
  onCancel,
  submitLabel,
}: AgencyFormProps) {
  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Agency Details</Typography>
          <Typography color="text.secondary" variant="body2">
            Basic information about the consultancy tenant.
          </Typography>
        </Stack>
        <Divider />

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="consultancyName"
              rules={{ required: "Agency name is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.consultancyName)}
                  fullWidth
                  helperText={errors.consultancyName?.message}
                  label="Agency Name"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="registrationID"
              rules={{ required: "Registration ID is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.registrationID)}
                  fullWidth
                  helperText={errors.registrationID?.message}
                  label="Registration ID"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              control={control}
              name="consultancyAddress"
              render={({ field }) => (
                <TextField {...field} fullWidth label="Address" slotProps={alwaysVisibleLabel} sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="consultancyCity"
              render={({ field }) => (
                <TextField {...field} fullWidth label="City" slotProps={alwaysVisibleLabel} sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="consultancyState"
              render={({ field }) => (
                <TextField {...field} fullWidth label="State" slotProps={alwaysVisibleLabel} sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="consultancyCountry"
              render={({ field }) => (
                <TextField {...field} fullWidth label="Country" slotProps={alwaysVisibleLabel} sx={fieldSx} />
              )}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Agency Admin</Typography>
          <Typography color="text.secondary" variant="body2">
            The first admin user for this agency.
          </Typography>
        </Stack>
        <Divider />

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="firstName"
              rules={{ required: "First name is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.firstName)}
                  fullWidth
                  helperText={errors.firstName?.message}
                  label="First Name"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="lastName"
              rules={{ required: "Last name is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.lastName)}
                  fullWidth
                  helperText={errors.lastName?.message}
                  label="Last Name"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="phone"
              rules={{ required: "Phone number is required." }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.phone)}
                  fullWidth
                  helperText={errors.phone?.message}
                  label="Phone"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.email)}
                  fullWidth
                  helperText={errors.email?.message}
                  label="Email Address"
                  required
                  slotProps={alwaysVisibleLabel}
                  sx={fieldSx}
                  type="email"
                />
              )}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button disabled={isSubmitting} sx={{ textTransform: "none" }} type="submit" variant="contained">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button disabled={isSubmitting} sx={{ textTransform: "none" }} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

export const defaultCreateAgencyValues: CreateAgencyRequest = {
  consultancyName: "",
  registrationID: "",
  consultancyAddress: "",
  consultancyCity: "",
  consultancyState: "",
  consultancyCountry: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};
