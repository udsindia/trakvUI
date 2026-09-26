import { useState } from "react";
import SendRounded from "@mui/icons-material/SendRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { httpClient } from "@/shared/services/http/client";
import { SERIF } from "@/shared/ui/vutrakTheme";

/**
 * Public page to request a password-reset link.
 * Posts to POST /api/auth/forgot-password { email }, which emails a
 * /reset-password?token=… link handled by SetPasswordPage.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await httpClient.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
    } catch {
      // The endpoint always 200s to avoid leaking which emails exist; ignore errors.
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Education CRM"
      wordmark="VUTrak"
      headline="Reset your password."
      subhead="Enter your email and we'll send you a secure link to set a new password."
      points={[
        "Reset links are one-time and time-limited",
        "We never send your password over email",
        "Check your spam folder if it doesn't arrive",
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
            Forgot password
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            Request a reset link
          </Typography>
          <Typography color="text.secondary" variant="body2">
            We'll email a link to reset your password if the account exists.
          </Typography>
        </Stack>

        {sent ? (
          <Alert severity="success">
            If <strong>{email}</strong> is registered, a password reset link is on its way. The link
            expires shortly, so use it soon.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              <TextField
                autoComplete="username"
                fullWidth
                label="Email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <Button
                disabled={!email || submitting}
                fullWidth
                size="large"
                startIcon={<SendRounded />}
                type="submit"
                variant="contained"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </Stack>
          </Box>
        )}

        <Typography align="center" color="text.secondary" variant="body2">
          Remembered it?{" "}
          <RouterLink to="/login" style={{ color: "inherit", fontWeight: 700 }}>
            Back to sign in
          </RouterLink>
        </Typography>
      </Stack>
    </AuthShell>
  );
}
