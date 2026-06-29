import { useState } from "react";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

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
          {success ? (
            <Stack alignItems="center" spacing={2.5}>
              <CheckCircleRounded sx={{ color: SA_TEAL, fontSize: 56 }} />
              <Typography variant="h5">Password Set</Typography>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                Your password has been saved. You can now sign in to the SA portal.
              </Typography>
              <Button
                component={RouterLink}
                to="/sa/login"
                variant="contained"
                sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
              >
                Go to Sign In
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography color={SA_TEAL} variant="overline">
                  Super Admin Portal
                </Typography>
                <Typography variant="h5">Set Your Password</Typography>
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
                <Stack spacing={2.5}>
                  <TextField
                    autoComplete="new-password"
                    label="New Password"
                    required
                    type="password"
                    value={password}
                    inputProps={{ minLength: 8 }}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <TextField
                    autoComplete="new-password"
                    label="Confirm Password"
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    disabled={!password || !confirmPassword || isLoading || !token}
                    type="submit"
                    variant="contained"
                    sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
                  >
                    {isLoading ? "Saving..." : "Set Password"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
