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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

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
              <Typography color={SA_TEAL} variant="overline">
                Super Admin Portal
              </Typography>
              <Typography variant="h5">Sign in to VUTrak SA</Typography>
              <Typography color="text.secondary" variant="body2">
                This portal is for platform administrators only.
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  autoComplete="username"
                  label="Email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <TextField
                  autoComplete="current-password"
                  label="Password"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  disabled={!email || !password || isLoading}
                  startIcon={<LoginRounded />}
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>

                <Typography align="center" color="text.secondary" variant="body2">
                  <RouterLink to="/login" style={{ color: "inherit" }}>
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
