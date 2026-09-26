import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
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
import type { SaRole } from "@/modules/sa-team/sa.types";
import { saAuthService } from "@/modules/sa-team/saAuthService";
import { saTeamApi } from "@/modules/sa-team/saTeamApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const SA_TEAL = "#0d7a7a";

export function SaRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  const canEditRoles = saAuthService.hasPermission(SA_PERMISSIONS.ROLES_MANAGE);

  const rolesQuery = useQuery({
    queryKey: ["sa-team", "roles"],
    queryFn: saTeamApi.listRoles,
  });

  const selectedRole: SaRole | null =
    rolesQuery.data?.find((r) => r.id === selectedRoleId) ?? null;

  useEffect(() => {
    if (rolesQuery.data && !selectedRoleId) {
      setSelectedRoleId(rolesQuery.data[0]?.id ?? null);
    }
  }, [rolesQuery.data, selectedRoleId]);

  useEffect(() => {
    if (selectedRole) {
      setDraftPermissions(selectedRole.permissions);
    }
  }, [selectedRole?.id]);

  const updateMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      saTeamApi.updateRolePermissions(roleId, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sa-team", "roles"] });
      setSnackMessage("Permissions saved.");
    },
  });

  function togglePermission(code: string) {
    setDraftPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography color="text.secondary" variant="overline">
          SA Team · Roles
        </Typography>
        <Typography variant="h5">Roles & Permissions</Typography>
      </Box>

      {rolesQuery.isError && (
        <Alert severity="error">
          {getApiErrorMessage(rolesQuery.error, "Unable to load roles.")}
        </Alert>
      )}

      {updateMutation.isError && (
        <Alert severity="error">
          {getApiErrorMessage(updateMutation.error, "Failed to save permissions.")}
        </Alert>
      )}

      {rolesQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Stack direction="row" spacing={3} alignItems="flex-start">
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              width: 260,
              flexShrink: 0,
            }}
          >
            <List disablePadding>
              {(rolesQuery.data ?? []).map((role, idx) => (
                <Box key={role.id}>
                  {idx > 0 && <Divider />}
                  <ListItemButton
                    selected={role.id === selectedRoleId}
                    onClick={() => setSelectedRoleId(role.id)}
                    sx={{
                      "&.Mui-selected": { bgcolor: "#e0f2f2" },
                      "&.Mui-selected:hover": { bgcolor: "#c8ecec" },
                    }}
                  >
                    <ListItemText
                      primary={role.displayName}
                      secondary={role.system ? "System role" : "Custom role"}
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
          </Paper>

          {selectedRole && (
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "12px",
                flex: 1,
                p: 3,
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6">{selectedRole.displayName}</Typography>
                  {selectedRole.system && (
                    <Chip label="System" size="small" color="warning" variant="outlined" />
                  )}
                </Stack>

                {selectedRole.system && (
                  <Alert severity="info">
                    System role permissions are fixed and cannot be modified.
                  </Alert>
                )}

                {SA_PERMISSION_GROUPS.map((group) => (
                  <Box key={group.label}>
                    <Typography
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: 0.8 }}
                      variant="caption"
                    >
                      {group.label}
                    </Typography>
                    <FormGroup>
                      {group.permissions.map((code) => (
                        <FormControlLabel
                          key={code}
                          control={
                            <Checkbox
                              checked={selectedRole.system ? true : draftPermissions.includes(code)}
                              disabled={selectedRole.system || !canEditRoles}
                              size="small"
                              onChange={() => togglePermission(code)}
                              sx={{ "&.Mui-checked": { color: SA_TEAL } }}
                            />
                          }
                          label={SA_PERMISSION_LABELS[code]}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                ))}

                {!selectedRole.system && canEditRoles && (
                  <Box>
                    <Button
                      variant="contained"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          roleId: selectedRole.id,
                          permissions: draftPermissions,
                        })
                      }
                      startIcon={
                        updateMutation.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : null
                      }
                      sx={{ bgcolor: SA_TEAL, "&:hover": { bgcolor: "#0a6060" } }}
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={3000}
        message={snackMessage}
        onClose={() => setSnackMessage(null)}
      />
    </Stack>
  );
}
