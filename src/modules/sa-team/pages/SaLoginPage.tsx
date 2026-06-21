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
import { Navigate, Link as RouterLink, useNavigate } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Login failed. Please check your credentials and try again.";
}

export function SaLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already has SA session, redirect to team page
  const existingSession = saAuthService.restore();
  if (existingSession) {
    return <Navigate replace to="/sa/team" />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      await saAuthService.login(email, password);
      navigate("/sa/team");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoggingIn(false);
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
              <Typography variant="h5">VUTrak Super Admin</Typography>
              <Typography color="text.secondary" variant="body2">
                Sign in with your SA credentials to access the super admin portal.
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  autoComplete="username"
                  label="Email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  disabled={!email || !password || isLoggingIn}
                  startIcon={<LoginRounded />}
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: "#0d7a7a", "&:hover": { bgcolor: "#0a6565" } }}
                >
                  {isLoggingIn ? "Signing In..." : "Sign In"}
                </Button>

                <Typography align="center" color="text.secondary" variant="body2">
                  <RouterLink to="/login" style={{ color: "inherit", fontWeight: 600 }}>
                    Back to tenant login
                  </RouterLink>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
