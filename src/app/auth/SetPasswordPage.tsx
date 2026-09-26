import { useMemo, useState } from "react";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { httpClient } from "@/shared/services/http/client";
import { SERIF } from "@/shared/ui/vutrakTheme";

/**
 * Public landing page for one-time password links. Handles both:
 *  - onboarding set-password links  (/set-password?token=…)
 *  - forgot-password reset links    (/reset-password?token=…)
 * Both post to POST /api/auth/reset-password { token, newPassword }.
 */
export function SetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit = useMemo(
    () => !!token && password.length >= 8 && password === confirm && !submitting,
    [token, password, confirm, submitting],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await httpClient.post("/auth/reset-password", { token, newPassword: password });
      navigate("/login", { replace: true, state: { registrationSuccess: true } });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as { message?: string }).message
          : undefined;
      setError(
        message ??
          "This link is invalid or has expired. Request a new one from the Forgot Password option.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Education CRM"
      wordmark="VUTrak"
      headline="Set your password to activate your account."
      subhead="Choose a strong password — at least 8 characters — to secure your workspace."
      points={[
        "Your password is never shared over email",
        "This one-time link expires for your security",
        "You'll sign in with your email once it's set",
      ]}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography
            sx={{
              color: "text.disabled",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Account setup
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            Create your password
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Enter a new password below to finish setting up your account.
          </Typography>
        </Stack>

        {!token && (
          <Alert severity="error">
            This link is missing its token. Please use the exact link from your email, or request a
            new one from{" "}
            <RouterLink to="/forgot-password" style={{ color: "inherit", fontWeight: 700 }}>
              Forgot Password
            </RouterLink>
            .
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <TextField
              autoComplete="new-password"
              disabled={!token}
              error={tooShort}
              fullWidth
              helperText={tooShort ? "At least 8 characters." : " "}
              label="New password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <TextField
              autoComplete="new-password"
              disabled={!token}
              error={mismatch}
              fullWidth
              helperText={mismatch ? "Passwords do not match." : " "}
              label="Confirm password"
              required
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />

            <Button
              disabled={!canSubmit}
              fullWidth
              size="large"
              startIcon={<LockResetRounded />}
              type="submit"
              variant="contained"
            >
              {submitting ? "Setting Password..." : "Set Password"}
            </Button>

            <Typography align="center" color="text.secondary" variant="body2">
              Already have a password?{" "}
              <RouterLink to="/login" style={{ color: "inherit", fontWeight: 700 }}>
                Sign in
              </RouterLink>
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </AuthShell>
  );
}
