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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { authService, getAuthErrorMessage } from "@/app/auth/authService";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RegisterFormValues {
  // Consultancy
  consultancyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  regId: string;
  // Admin user
  userName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const defaultValues: RegisterFormValues = {
  consultancyName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  regId: "",
  userName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "ADMIN",
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "COUNSELLOR", label: "Counsellor" },
  { value: "APPLICATION_MANAGER", label: "Application Manager" },
  { value: "ACTIVITY_MANAGER", label: "Activity Manager" },
  { value: "ANALYST", label: "Analyst" },
];

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ defaultValues, mode: "onBlur" });

  const passwordValue = watch("password");

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    try {
      // Step 1: create consultancy
      const consultancyData = await authService.createConsultancy({
        name: values.consultancyName,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        country: values.country || undefined,
        regId: values.regId || undefined,
      });

      const tenantId = consultancyData?.id;
      console.debug("[register] consultancy created, id:", tenantId);

      // Step 2: register admin user
      await authService.registerAdminUser({
        name: values.userName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: values.role,
        tenantId,
      });

      console.debug("[register] user registered, redirecting to login");
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
                          placeholder="Arpan Consultancy Pvt. Ltd."
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
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Registration ID"
                          placeholder="e.g. CIN / GST number"
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
                          placeholder="Mumbai"
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
                          placeholder="Maharashtra"
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
                      name="userName"
                      rules={{ required: "Name is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={Boolean(errors.userName)}
                          fullWidth
                          helperText={errors.userName?.message}
                          label="Full Name"
                          placeholder="Rahul Sharma"
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
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone"
                          placeholder="+91 98765 43210"
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

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      control={control}
                      name="role"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Role"
                          select
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      control={control}
                      name="password"
                      rules={{
                        required: "Password is required.",
                        minLength: { value: 8, message: "Password must be at least 8 characters." },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={Boolean(errors.password)}
                          fullWidth
                          helperText={errors.password?.message}
                          label="Password"
                          required
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                          type="password"
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      control={control}
                      name="confirmPassword"
                      rules={{
                        required: "Please confirm your password.",
                        validate: (value) =>
                          value === passwordValue || "Passwords do not match.",
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={Boolean(errors.confirmPassword)}
                          fullWidth
                          helperText={errors.confirmPassword?.message}
                          label="Confirm Password"
                          required
                          slotProps={alwaysVisibleLabel}
                          sx={fieldSx}
                          type="password"
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
