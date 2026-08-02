import { useState } from "react";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { passwordApi } from "@/app/auth/passwordApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { SERIF } from "@/shared/ui/vutrakTheme";

const MIN_LENGTH = 8;

/**
 * Serves BOTH the onboarding "set up your password" link and the "forgot password" reset link
 * (the emails send /reset-password?token=…). Consumes the one-time token and sets a new password.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const missingToken = token.trim().length === 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await passwordApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not set your password. The link may have expired."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account Security"
      wordmark="VUTrak"
      headline="Set your password, and you're in."
      subhead="Choose a secure password to finish setting up — or recovering — your account."
      points={[
        `Minimum ${MIN_LENGTH} characters`,
        "One-time link from your email",
        "Sign in immediately after",
      ]}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            {success ? "Password set" : "Create your password"}
          </Typography>
          {!success && (
            <Typography color="text.secondary" variant="body2">
              Enter a new password for your account below.
            </Typography>
          )}
        </Stack>

        {success ? (
          <Stack spacing={2}>
            <Alert icon={<CheckCircleRounded fontSize="inherit" />} severity="success">
              Your password has been set. You can now sign in.
            </Alert>
            <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained">
              Go to sign in
            </Button>
          </Stack>
        ) : missingToken ? (
          <Stack spacing={2}>
            <Alert severity="error">
              This link is missing or invalid. Request a new one from the sign-in page.
            </Alert>
            <Button component={RouterLink} to="/forgot-password" fullWidth size="large" variant="outlined">
              Request a new link
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                autoComplete="new-password"
                fullWidth
                label="New password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <TextField
                autoComplete="new-password"
                fullWidth
                label="Confirm password"
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button
                disabled={!password || !confirmPassword || isLoading}
                fullWidth
                size="large"
                startIcon={<LockResetRounded />}
                type="submit"
                variant="contained"
              >
                {isLoading ? "Setting password..." : "Set password"}
              </Button>
              <Typography align="center" color="text.secondary" variant="body2">
                <RouterLink to="/login" style={{ color: "inherit", fontWeight: 700 }}>
                  Back to sign in
                </RouterLink>
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </AuthShell>
  );
}
