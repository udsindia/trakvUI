import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRounded, EditRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { getPermissionLabel } from "@/config/permissions/permissionLabels";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { PermissionMatrix } from "@/modules/settings/components/PermissionMatrix";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { rolesService } from "@/modules/settings/rolesService";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function RolesPage() {
  const { hasPermissions, tenant } = useAuth();
  const queryClient = useQueryClient();
  const canManageRoles = hasPermissions([PERMISSIONS.ROLES_MANAGE]);
  const tenantId = tenant?.tenantId ?? "";

  const rolesQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ["settings", "roles", tenantId],
    queryFn: () => rolesService.getRoles(tenantId),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => rolesService.deleteCustomRole(tenantId, roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles", tenantId] });
    },
  });

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        eyebrow="Settings · Roles"
        title="Roles & Permissions"
        actions={
          canManageRoles ? (
            <Button
              component={RouterLink}
              startIcon={<AddRounded />}
              sx={{ textTransform: "none" }}
              to={settingsRoutePaths.createRole}
              variant="contained"
            >
              Create Role
            </Button>
          ) : null
        }
      />

      {rolesQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {rolesQuery.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(rolesQuery.error, "Unable to load roles.")}
        </Alert>
      ) : null}

      {deleteRoleMutation.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(deleteRoleMutation.error, "Unable to delete role.")}
        </Alert>
      ) : null}

      {rolesQuery.data ? (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rolesQuery.data.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 600 }}>{role.name}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {role.roleName}
                        </Typography>
                        {role.description ? (
                          <Typography color="text.secondary" variant="body2">
                            {role.description}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={role.type === "system" ? "default" : "primary"}
                        label={role.type === "system" ? "System" : "Custom"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, maxWidth: 420 }}>
                        {role.permissions.map((permission) => (
                          <Chip
                            key={`${role.id}-${permission}`}
                            label={getPermissionLabel(permission)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View or edit role">
                        <IconButton
                          aria-label={`Edit ${role.name}`}
                          component={RouterLink}
                          to={settingsRoutePaths.editRole(role.id)}
                        >
                          <EditRounded />
                        </IconButton>
                      </Tooltip>
                      {canManageRoles && role.type === "custom" ? (
                        <Button
                          color="error"
                          disabled={deleteRoleMutation.isPending}
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                          size="small"
                          sx={{ ml: 1, textTransform: "none" }}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 600 }} variant="h6">
              Permission Matrix
            </Typography>
            <PermissionMatrix roles={rolesQuery.data} />
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
