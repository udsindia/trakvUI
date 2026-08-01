import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type { RoleDefinition, TenantUser } from "@/modules/settings/settings.types";

type EditUserDialogProps = {
  open: boolean;
  user: TenantUser | null;
  roles: RoleDefinition[];
  supervisors: TenantUser[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: { roleId?: string; supervisorId?: string }) => void;
};

export function EditUserDialog({
  open,
  user,
  roles,
  supervisors,
  saving,
  onClose,
  onSave,
}: EditUserDialogProps) {
  const [roleId, setRoleId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  useEffect(() => {
    setRoleId(user?.roleId ?? "");
    setSupervisorId(user?.supervisorId ?? "");
  }, [user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit {user?.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name} ({role.roleName})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Supervisor"
            value={supervisorId}
            helperText="Manager or admin who supervises this user (drives team visibility)."
            onChange={(e) => setSupervisorId(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {supervisors
              .filter((candidate) => candidate.id !== user?.id)
              .map((candidate) => (
                <MenuItem key={candidate.id} value={candidate.id}>
                  {candidate.name} — {candidate.roleLabel}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          sx={{ textTransform: "none" }}
          onClick={() =>
            onSave({
              roleId: roleId || undefined,
              supervisorId: supervisorId || undefined,
            })
          }
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
