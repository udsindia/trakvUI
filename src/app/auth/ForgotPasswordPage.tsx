import { useState } from "react";
import MarkEmailReadRounded from "@mui/icons-material/MarkEmailReadRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { passwordApi } from "@/app/auth/passwordApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { SERIF } from "@/shared/ui/vutrakTheme";

/**
 * "Forgot password" entry point. Posts the email to the backend, which sends a reset link
 * (to /reset-password?token=…). We always show the same neutral confirmation so we never
 * reveal whether an address is registered.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await passwordApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account Security"
      wordmark="VUTrak"
      headline="Locked out? We'll email you a reset link."
      subhead="Enter the email tied to your account and we'll send a secure link to set a new password."
      points={[
        "Link is valid for a limited time",
        "One-time use for your security",
        "Check spam if it doesn't arrive",
      ]}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            Reset your password
          </Typography>
          {!submitted && (
            <Typography color="text.secondary" variant="body2">
              We'll send a reset link to your email.
            </Typography>
          )}
        </Stack>

        {submitted ? (
          <Stack spacing={2}>
            <Alert icon={<MarkEmailReadRounded fontSize="inherit" />} severity="success">
              If that email is registered, a reset link has been sent. Please check your inbox.
            </Alert>
            <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained">
              Back to sign in
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                autoComplete="email"
                fullWidth
                label="Email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button
                disabled={!email || isLoading}
                fullWidth
                size="large"
                startIcon={<SendRounded />}
                type="submit"
                variant="contained"
              >
                {isLoading ? "Sending..." : "Send reset link"}
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
