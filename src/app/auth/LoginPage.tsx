import { useState } from "react";
import LoginRounded from "@mui/icons-material/LoginRounded";
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
import { Navigate } from "react-router-dom";
import { isMockAuthEnabled } from "@/app/auth/authService";
import { useAuth } from "@/app/auth/useAuth";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

export function LoginPage() {
  const { error, isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  if (isInitializing) {
    return (
      <LoadingScreen
        description="Checking for an existing JWT session and restoring workspace access."
        fullHeight
        title="Preparing sign in"
      />
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
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
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="overline">Authentication</Typography>
              <Typography variant="h5">Sign in to EduTrack</Typography>
              <Typography color="text.secondary" variant="body2">
                {isMockAuthEnabled
                  ? "Mock auth is active for demos. Use any non-empty password, and set the identifier to admin, counsellor, application, activity, or analyst to switch personas."
                  : "Credentials login is wired through the auth service, and SSO can be added later without changing the application shell."}
              </Typography>
            </Stack>

            {isMockAuthEnabled && (
              <Alert severity="info">
                Demo examples: <strong>admin@demo.local</strong>,{" "}
                <strong>counsellor@demo.local</strong>,{" "}
                <strong>application@demo.local</strong>,{" "}
                <strong>activity@demo.local</strong>, or{" "}
                <strong>analyst@demo.local</strong>. Any password will sign in.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Box
              component="form"
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  await login({
                    identifier,
                    password,
                    strategy: "credentials",
                  });
                } catch {
                  return;
                }
              }}
            >
              <Stack spacing={2.5}>
                <TextField
                  autoComplete="username"
                  label="Email or Username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />

                <TextField
                  autoComplete="current-password"
                  label="Password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <Button
                  disabled={!identifier || !password || isLoggingIn}
                  startIcon={<LoginRounded />}
                  type="submit"
                  variant="contained"
                >
                  {isLoggingIn ? "Signing In..." : "Sign In"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
