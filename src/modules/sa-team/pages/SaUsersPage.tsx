import { useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
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
import { InviteUserDialog } from "@/modules/sa-team/components/InviteUserDialog";
import { SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import type { SaUser } from "@/modules/sa-team/sa.types";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export function SaUsersPage() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const canManageUsers = saAuthService.hasPermission(SA_PERMISSIONS.USERS_MANAGE);

  const usersQuery = useQuery({
    queryKey: ["sa-team", "users"],
    queryFn: () => saTeamApi.listUsers(),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      active ? saTeamApi.deactivateUser(userId) : saTeamApi.reactivateUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "users"] });
    },
  });

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Stack spacing={0.5}>
          <Typography color="text.secondary" variant="overline">
            SA Team · Users
          </Typography>
          <Typography variant="h5">SA Users</Typography>
        </Stack>
        {canManageUsers ? (
          <Button
            onClick={() => setInviteOpen(true)}
            startIcon={<AddRounded />}
            sx={{ textTransform: "none" }}
            variant="contained"
          >
            Invite User
          </Button>
        ) : null}
      </Stack>

      {/* Loading state */}
      {usersQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {/* Error states */}
      {usersQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(usersQuery.error)}
        </Alert>
      ) : null}

      {toggleActiveMutation.isError ? (
        <Alert severity="error">
          {getErrorMessage(toggleActiveMutation.error)}
        </Alert>
      ) : null}

      {/* Users table */}
      {usersQuery.data ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography color="text.secondary" variant="body2">
                        No SA users found. Invite the first team member.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
              {usersQuery.data.map((user: SaUser) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {user.firstName} {user.lastName ?? ""}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.roleDisplayName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.active ? "success" : "default"}
                      label={user.active ? "Active" : "Inactive"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell align="right">
                    {canManageUsers ? (
                      <Button
                        color={user.active ? "error" : "primary"}
                        disabled={toggleActiveMutation.isPending}
                        onClick={() =>
                          toggleActiveMutation.mutate({ userId: user.id, active: user.active })
                        }
                        size="small"
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Stack>
  );
}
