import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PersonOffRounded from "@mui/icons-material/PersonOffRounded";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { AuthBrandLockup } from "@/app/auth/AuthShell";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { SERIF } from "@/shared/ui/vutrakTheme";

export function AccountInactivePage() {
  const { isActive, isAuthenticated, isInitializing, logout, user } = useAuth();

  if (isInitializing) {
    return <LoadingScreen fullHeight title="Checking account status" />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (isActive) {
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
        sx={{
          maxWidth: 480,
          mx: "auto",
          width: "100%",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <AuthBrandLockup eyebrow="Education CRM" wordmark="VUTrak" />
            <Stack alignItems="center" spacing={1.5}>
              <PersonOffRounded color="warning" sx={{ fontSize: 44 }} />
              <Typography variant="overline">Account Status</Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, textAlign: "center" }}>
                Your account is not active
              </Typography>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                {user?.email
                  ? `The account for ${user.email} has been deactivated. Contact your workspace administrator to restore access.`
                  : "This account has been deactivated. Contact your workspace administrator to restore access."}
              </Typography>
            </Stack>

            <Button
              fullWidth
              startIcon={<LogoutRounded />}
              variant="outlined"
              onClick={() => {
                void logout();
              }}
            >
              Sign out
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
