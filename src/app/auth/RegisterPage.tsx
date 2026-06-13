import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { authService, getAuthErrorMessage } from "@/app/auth/authService";

interface RegisterFormValues {
  consultancyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  regId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const defaultValues: RegisterFormValues = {
  consultancyName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  regId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.paper",
    borderRadius: 2.5,
  },
};

const alwaysVisibleLabel = { inputLabel: { shrink: true } } as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ defaultValues, mode: "onBlur" });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    try {
      await authService.registerOnboarding({
        consultancyName: values.consultancyName,
        registrationID: values.regId,
        consultancyAddress: values.address,
        consultancyCity: values.city,
        consultancyState: values.state,
        consultancyCountry: values.country,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      });

      navigate("/login", { state: { registrationSuccess: true } });
    } catch (err: unknown) {
      setServerError(getAuthErrorMessage(err));
    }
  };

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography variant="overline">Get Started</Typography>
        <Typography variant="h5">Create your consultancy account</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Set up your consultancy and the first admin user in one step.
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          maxWidth: 820,
          width: "100%",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>

              {/* ── Consultancy Details ── */}
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h6">Consultancy Details</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Basic information about your consultancy.
                  </Typography>
                </Stack>
                <Divider />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      control={control}
                      name="consultancyName"
                      rules={{ required: "Consultancy name is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={Boolean(errors.consultancyName)}
                          fullWidth
                          helperText={errors.consultancyName?.message}
                          label="Consultancy Name"
                          placeholder="Test Consultancy Pvt. Ltd."
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
                      name="regId"
                      rules={{ required: "Registration ID is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={Boolean(errors.regId)}
                          helperText={errors.regId?.message}
                          label="Registration ID"
                          placeholder="e.g. CIN / GST number"
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
                      name="address"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Address"
                          placeholder="Street address"
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      control={control}
                      name="city"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                          placeholder="Hyderabad"
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="State"
                          placeholder="Telangana"
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      control={control}
                      name="country"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Country"
                          placeholder="India"
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Stack>

              {/* ── Admin User Details ── */}
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h6">Admin User</Typography>
                  <Typography color="text.secondary" variant="body2">
                    This user will be the first admin for your consultancy.
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
                          placeholder="John"
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
                          placeholder="Doe"
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
                          placeholder="+91 98765 43210"
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
                          placeholder="admin@example.com"
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

              {/* ── Actions ── */}
              <Stack spacing={2}>
                <Button
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : null}
                  sx={{ textTransform: "none", borderRadius: 2.5 }}
                  type="submit"
                  variant="contained"
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
                <Typography align="center" color="text.secondary" variant="body2">
                  Already have an account?{" "}
                  <RouterLink
                    to="/login"
                    style={{ color: "inherit", fontWeight: 600 }}
                  >
                    Sign in
                  </RouterLink>
                </Typography>
              </Stack>

            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
