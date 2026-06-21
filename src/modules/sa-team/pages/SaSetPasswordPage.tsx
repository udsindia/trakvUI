import { useState } from "react";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";

interface SetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to set password. The link may have expired.";
}

export function SaSetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordValue = watch("password");

  if (!token) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          display: "grid",
          minHeight: "100vh",
          px: 2,
          py: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            maxWidth: 460,
            mx: "auto",
            width: "100%",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="overline">Super Admin Portal</Typography>
                <Typography variant="h5">Set Password</Typography>
              </Stack>
              <Alert severity="error">
                Invalid or missing invitation token. Please use the link from your invitation
                email.
              </Alert>
              <Typography align="center" color="text.secondary" variant="body2">
                <RouterLink to="/sa/login" style={{ color: "inherit", fontWeight: 600 }}>
                  Go to SA Login
                </RouterLink>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const onSubmit = async (values: SetPasswordFormValues) => {
    setSubmitError(null);
    try {
      await saAuthService.setPassword(token, values.password);
      setSuccess(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "grid",
        minHeight: "100vh",
        px: 2,
        py: 4,
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          maxWidth: 460,
          mx: "auto",
          width: "100%",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="overline">Super Admin Portal</Typography>
              <Typography variant="h5">Set Your Password</Typography>
              <Typography color="text.secondary" variant="body2">
                Choose a strong password for your SA account.
              </Typography>
            </Stack>

            {success ? (
              <Stack spacing={2}>
                <Alert severity="success">
                  Password set successfully. You can now sign in with your new credentials.
                </Alert>
                <Typography align="center" color="text.secondary" variant="body2">
                  <RouterLink to="/sa/login" style={{ color: "inherit", fontWeight: 600 }}>
                    Go to SA Login
                  </RouterLink>
                </Typography>
              </Stack>
            ) : (
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2.5}>
                  {submitError ? <Alert severity="error">{submitError}</Alert> : null}

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
                        autoComplete="new-password"
                        error={Boolean(errors.password)}
                        fullWidth
                        helperText={errors.password?.message}
                        label="Password"
                        required
                        type="password"
                      />
                    )}
                  />

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
                        autoComplete="new-password"
                        error={Boolean(errors.confirmPassword)}
                        fullWidth
                        helperText={errors.confirmPassword?.message}
                        label="Confirm Password"
                        required
                        type="password"
                      />
                    )}
                  />

                  <Button
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <LockResetRounded />
                      )
                    }
                    type="submit"
                    variant="contained"
                    sx={{ bgcolor: "#0d7a7a", "&:hover": { bgcolor: "#0a6565" } }}
                  >
                    {isSubmitting ? "Setting Password..." : "Set Password"}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
