import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SA_PERMISSION_GROUPS, SA_PERMISSION_LABELS, SA_PERMISSIONS } from "@/modules/sa-team/SA_PERMISSIONS";
import type { SaPermissionCode } from "@/modules/sa-team/SA_PERMISSIONS";
import type { SaRole } from "@/modules/sa-team/sa.types";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export function SaRolesPage() {
  const queryClient = useQueryClient();
  const canManageRoles = saAuthService.hasPermission(SA_PERMISSIONS.ROLES_MANAGE);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["sa-team", "roles"],
    queryFn: () => saTeamApi.listRoles(),
  });

  const selectedRole = rolesQuery.data?.find((r) => r.id === selectedRoleId) ?? null;

  // Sync local permissions when role selection changes
  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissions);
    }
  }, [selectedRole?.id]);

  const updatePermissionsMutation = useMutation({
    mutationFn: (permissions: string[]) =>
      saTeamApi.updateRolePermissions(selectedRoleId!, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "roles"] });
      setSuccessOpen(true);
    },
  });

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(selectedPermissions);
  };

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Stack spacing={0.5}>
        <Typography color="text.secondary" variant="overline">
          SA Team · Roles
        </Typography>
        <Typography variant="h5">Roles & Permissions</Typography>
      </Stack>

      {/* Loading state */}
      {rolesQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {/* Error state */}
      {rolesQuery.isError ? (
        <Alert severity="error">{getErrorMessage(rolesQuery.error)}</Alert>
      ) : null}

      {/* Two-column layout */}
      {rolesQuery.data ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
          {/* Left panel — role list */}
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              width: { xs: "100%", md: 280 },
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Roles
              </Typography>
            </Box>
            <List disablePadding>
              {rolesQuery.data.map((role: SaRole) => (
                <ListItemButton
                  key={role.id}
                  selected={selectedRoleId === role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  divider
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {role.displayName}
                        </Typography>
                        {role.system ? (
                          <Chip label="System" size="small" variant="outlined" />
                        ) : null}
                      </Stack>
                    }
                    secondary={role.description ?? undefined}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* Right panel — permission editor */}
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              flex: 1,
              width: "100%",
              p: 3,
            }}
          >
            {!selectedRole ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <Typography color="text.secondary" variant="body2">
                  Select a role to edit its permissions
                </Typography>
              </Stack>
            ) : selectedRole.system ? (
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h6">{selectedRole.displayName}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    System role — permissions cannot be edited
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {SA_PERMISSION_GROUPS.map((group) => (
                    <Stack key={group.label} spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {group.label}
                      </Typography>
                      <FormGroup>
                        {group.permissions.map((permission) => (
                          <FormControlLabel
                            key={permission}
                            control={
                              <Checkbox
                                checked
                                disabled
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {SA_PERMISSION_LABELS[permission]}
                              </Typography>
                            }
                          />
                        ))}
                      </FormGroup>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{selectedRole.displayName}</Typography>
                    {selectedRole.description ? (
                      <Typography color="text.secondary" variant="body2">
                        {selectedRole.description}
                      </Typography>
                    ) : null}
                  </Stack>
                  {canManageRoles ? (
                    <Button
                      disabled={updatePermissionsMutation.isPending}
                      onClick={handleSave}
                      startIcon={
                        updatePermissionsMutation.isPending ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : null
                      }
                      sx={{ textTransform: "none" }}
                      variant="contained"
                    >
                      {updatePermissionsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  ) : null}
                </Stack>

                {updatePermissionsMutation.isError ? (
                  <Alert severity="error">
                    {getErrorMessage(updatePermissionsMutation.error)}
                  </Alert>
                ) : null}

                {!canManageRoles ? (
                  <Alert severity="info">
                    You do not have permission to edit role permissions.
                  </Alert>
                ) : null}

                <Stack spacing={3}>
                  {SA_PERMISSION_GROUPS.map((group) => (
                    <Stack key={group.label} spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {group.label}
                      </Typography>
                      <FormGroup>
                        {group.permissions.map((permission: SaPermissionCode) => (
                          <FormControlLabel
                            key={permission}
                            control={
                              <Checkbox
                                checked={selectedPermissions.includes(permission)}
                                disabled={!canManageRoles}
                                onChange={() => handlePermissionToggle(permission)}
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {SA_PERMISSION_LABELS[permission]}
                              </Typography>
                            }
                          />
                        ))}
                      </FormGroup>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>
      ) : null}

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" sx={{ width: "100%" }}>
          Role permissions updated successfully.
        </Alert>
      </Snackbar>
    </Stack>
  );
}
