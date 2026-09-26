import { useState } from "react";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { SERIF } from "@/shared/ui/vutrakTheme";

const saButtonSx = {
  background: (theme: import("@mui/material/styles").Theme) =>
    `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.dark})`,
  border: "none",
  boxShadow: "0 4px 13px rgba(43,123,151,.28)",
  "&:hover": {
    background: (theme: import("@mui/material/styles").Theme) =>
      `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
  },
} as const;

export function SaSetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await saAuthService.setPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to set password. The link may have expired."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      accent="admin"
      eyebrow="Super Admin"
      wordmark="VUTrak SA"
      headline="Set your password, and you're in."
      subhead="Create a secure password for your platform-administration account to finish activating access."
      points={[
        "Minimum 8 characters",
        "Grants access to the super-admin portal",
        "One-time link from your invitation email",
      ]}
      footnote="Restricted access · platform administrators only"
    >
      {success ? (
        <Stack alignItems="center" spacing={2.5} sx={{ textAlign: "center" }}>
          <CheckCircleRounded sx={{ color: "secondary.main", fontSize: 52 }} />
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            Password set
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Your password has been saved. You can now sign in to the SA portal.
          </Typography>
          <Button component={RouterLink} fullWidth size="large" to="/sa/login" variant="contained" sx={saButtonSx}>
            Go to Sign In
          </Button>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Stack spacing={0.75}>
            <Typography
              sx={{
                color: "secondary.main",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Platform Administration
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
              Set your password
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Choose a password for your SA portal account. Minimum 8 characters.
            </Typography>
          </Stack>

          {!token && (
            <Alert severity="error">
              Invalid invitation link. Please use the link from your invitation email.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              <TextField
                autoComplete="new-password"
                fullWidth
                label="New Password"
                required
                type="password"
                value={password}
                inputProps={{ minLength: 8 }}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                autoComplete="new-password"
                fullWidth
                label="Confirm Password"
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                disabled={!password || !confirmPassword || isLoading || !token}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                sx={saButtonSx}
              >
                {isLoading ? "Saving..." : "Set Password"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </AuthShell>
  );
}
