import { useState } from "react";
import LoginRounded from "@mui/icons-material/LoginRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AuthShell } from "@/app/auth/AuthShell";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { SERIF } from "@/shared/ui/vutrakTheme";

export function SaLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await saAuthService.login(email, password);
      navigate("/sa/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Sign in failed. Check your credentials."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      accent="admin"
      eyebrow="Super Admin"
      wordmark="VUTrak SA"
      headline="The control plane behind every consultancy."
      subhead="Onboard tenants, manage platform users and roles, and configure the integrations that power each workspace."
      points={[
        "Provision and configure tenant workspaces",
        "Manage platform-level users and permissions",
        "Restricted to authorised platform administrators",
      ]}
      footnote="Restricted access · platform administrators only"
    >
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
            Sign in to VUTrak SA
          </Typography>
          <Typography color="text.secondary" variant="body2">
            This portal is for platform administrators only.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <TextField
              autoComplete="username"
              fullWidth
              label="Email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              autoComplete="current-password"
              fullWidth
              label="Password"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              disabled={!email || !password || isLoading}
              fullWidth
              size="large"
              startIcon={<LoginRounded />}
              type="submit"
              variant="contained"
              sx={{
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.dark})`,
                border: "none",
                boxShadow: "0 4px 13px rgba(43,123,151,.28)",
                "&:hover": {
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                },
              }}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <Typography align="center" color="text.secondary" variant="body2">
              <RouterLink to="/login" style={{ color: "inherit", fontWeight: 600 }}>
                Back to tenant login
              </RouterLink>
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </AuthShell>
  );
}
