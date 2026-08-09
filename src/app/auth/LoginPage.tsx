import { useState } from "react";
import EventBusyRounded from "@mui/icons-material/EventBusyRounded";
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
import { Navigate, Link as RouterLink, useLocation } from "react-router-dom";
import { isMockAuthEnabled } from "@/app/auth/authService";
import { AuthShell } from "@/app/auth/AuthShell";
import { useAuth } from "@/app/auth/useAuth";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import QRCode from "@/shared/components/QRCodeGenerator";
import { SERIF } from "@/shared/ui/vutrakTheme";

export function LoginPage() {
  const { error, isActive, isAuthenticated, isInitializing, isLoggingIn, login, isTrialExpired } = useAuth();
  const location = useLocation();
  const registrationSuccess = (location.state as { registrationSuccess?: boolean } | null)?.registrationSuccess;
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

  if (isTrialExpired) {
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
            <Stack alignItems="center" spacing={3}>
              <Stack alignItems="center" spacing={1.5}>
                <EventBusyRounded color="warning" sx={{ fontSize: 48 }} />
                <Typography variant="overline">Trial Expired</Typography>
                <Typography textAlign="center" variant="h5">
                  Your trial period has ended
                </Typography>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  Scan the QR code below to renew your subscription, or contact support to
                  continue using EduTrack.
                </Typography>
              </Stack>

              <Box
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "10px",
                  p: 2,
                }}
              >
                <QRCode value="upi://pay?pa=9177333808@ibl&am=10&cu=INR" />
              </Box>

              <Typography color="text.secondary" textAlign="center" variant="caption">
                UPI payment QR for subscription renewal
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isAuthenticated && !isActive) {
    return <Navigate replace to="/account-inactive" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return (
    <AuthShell
      eyebrow="Education CRM"
      wordmark="VUTrak"
      headline="Guide every student from first enquiry to enrolment."
      subhead="One workspace for leads, applications, universities and the people who move them forward."
      points={[
        "Track applications across every university and intake",
        "Never miss a follow-up or a document deadline",
        "See your whole pipeline convert, stage by stage",
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
            Welcome back
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, letterSpacing: "-0.4px" }}>
            Sign in to your workspace
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {isMockAuthEnabled
              ? "Mock auth is active for demos. Use any non-empty password, and set the identifier to admin, counsellor, application, activity, or analyst to switch personas."
              : "Enter your credentials to continue."}
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

        {registrationSuccess && (
          <Alert severity="success">
            Account created successfully. Sign in to continue.
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
          <Stack spacing={2.25}>
            <TextField
              autoComplete="username"
              fullWidth
              label="Email or Username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />

            <TextField
              autoComplete="current-password"
              fullWidth
              label="Password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              disabled={!identifier || !password || isLoggingIn}
              fullWidth
              size="large"
              startIcon={<LoginRounded />}
              type="submit"
              variant="contained"
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>

            <Typography align="center" variant="body2">
              <RouterLink to="/forgot-password" style={{ color: "inherit", fontWeight: 700 }}>
                Forgot password?
              </RouterLink>
            </Typography>

            <Typography align="center" color="text.secondary" variant="body2">
              New consultancy?{" "}
              <RouterLink to="/register" style={{ color: "inherit", fontWeight: 700 }}>
                Sign up
              </RouterLink>
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </AuthShell>
  );
}
