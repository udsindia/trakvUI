import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRounded } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { UserTable } from "@/modules/settings/components/UserTable";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import { usersService } from "@/modules/settings/usersService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function TeamPage() {
  const { hasAnyPermission, tenant } = useAuth();
  const queryClient = useQueryClient();
  const canManageUsers = hasAnyPermission([
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.USERS_MANAGE,
  ]);
  const tenantId = tenant?.tenantId ?? "";

  const usersQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ active, userId }: { active: boolean; userId: string }) =>
      usersService.setUserActive(tenantId, userId, active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "users", tenantId] });
    },
  });

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        eyebrow="Settings · Team"
        title="Team Members"
        actions={
          canManageUsers ? (
            <Button
              component={RouterLink}
              startIcon={<AddRounded />}
              sx={{ textTransform: "none" }}
              to={settingsRoutePaths.addUser}
              variant="contained"
            >
              Add User
            </Button>
          ) : null
        }
      />

      {usersQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {usersQuery.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(usersQuery.error, "Unable to load team members.")}
        </Alert>
      ) : null}

      {toggleActiveMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(toggleActiveMutation.error, "Unable to update user status.")}
        </Alert>
      ) : null}

      {usersQuery.data ? (
        <UserTable
          canManageUsers={canManageUsers}
          users={usersQuery.data}
          onToggleActive={(user) => {
            toggleActiveMutation.mutate({
              userId: user.id,
              active: !user.active,
            });
          }}
        />
      ) : null}
    </Stack>
  );
}
