import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import { InviteUserDialog } from "@/modules/sa-team/components/InviteUserDialog";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

export function SaUsersPage() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  const canManage = saAuthService.hasPermission(SA_PERMISSIONS.USERS_MANAGE);

  const usersQuery = useQuery({
    queryKey: ["sa-team", "users"],
    queryFn: saTeamApi.listUsers,
  });

  const deactivateMutation = useMutation({
    mutationFn: saTeamApi.deactivateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "users"] });
      setSnackMessage("User deactivated.");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: saTeamApi.reactivateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "users"] });
      setSnackMessage("User reactivated.");
    },
  });

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" variant="overline">
            SA Team · Users
          </Typography>
          <Typography variant="h5">SA Users</Typography>
        </Box>
        {canManage && (
          <Button
            startIcon={<AddRounded />}
            variant="contained"
            onClick={() => setInviteOpen(true)}
            sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
          >
            Invite User
          </Button>
        )}
      </Stack>

      {usersQuery.isLoading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      )}

      {usersQuery.isError && (
        <Alert severity="error">
          {getApiErrorMessage(usersQuery.error, "Unable to load SA users.")}
        </Alert>
      )}

      {(deactivateMutation.isError || reactivateMutation.isError) && (
        <Alert severity="error">
          {getApiErrorMessage(
            deactivateMutation.error ?? reactivateMutation.error,
            "Unable to update user status.",
          )}
        </Alert>
      )}

      {usersQuery.data && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                {canManage && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {usersQuery.data.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {user.firstName} {user.lastName ?? ""}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.roleDisplayName}
                      size="small"
                      sx={{ bgcolor: "#e0f2f2", color: SA_TEAL, fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.active ? "success" : "default"}
                      label={user.active ? "Active" : "Inactive"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      {user.active ? (
                        <Button
                          color="error"
                          size="small"
                          disabled={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(user.id)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          disabled={reactivateMutation.isPending}
                          onClick={() => reactivateMutation.mutate(user.id)}
                          sx={{ color: SA_TEAL }}
                        >
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={3000}
        message={snackMessage}
        onClose={() => setSnackMessage(null)}
      />
    </Stack>
  );
}
