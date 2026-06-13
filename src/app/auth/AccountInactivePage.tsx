import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PersonOffRounded from "@mui/icons-material/PersonOffRounded";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

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
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          maxWidth: 520,
          mx: "auto",
          width: "100%",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Stack alignItems="center" spacing={1.5}>
              <PersonOffRounded color="warning" sx={{ fontSize: 48 }} />
              <Typography variant="overline">Account Status</Typography>
              <Typography textAlign="center" variant="h5">
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
