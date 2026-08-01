import {
  Button,
  Chip,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { TenantUser } from "@/modules/settings/settings.types";

type UserTableProps = {
  canManageUsers: boolean;
  users: TenantUser[];
  onToggleActive: (user: TenantUser) => void;
  onEdit: (user: TenantUser) => void;
};

export function UserTable({ canManageUsers, onToggleActive, onEdit, users }: UserTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
    >
      <Table sx={{ "& .MuiTableBody-root .MuiTableCell-root": { fontSize: 12.5, py: 1.15 } }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            {canManageUsers ? <TableCell align="right">Actions</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{user.name}</Typography>
              </TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{user.email}</TableCell>
              <TableCell>
                <Chip label={user.roleLabel} size="small" sx={{ bgcolor: "#EEF2F6", color: "text.secondary" }} />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.active ? "Active" : "Inactive"}
                  size="small"
                  sx={
                    user.active
                      ? { bgcolor: "#E1F5EC", color: "#0B7A57" }
                      : { bgcolor: "#EEF2F6", color: "text.disabled" }
                  }
                />
              </TableCell>
              {canManageUsers ? (
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                    <Button size="small" sx={{ textTransform: "none" }} onClick={() => onEdit(user)}>
                      Edit
                    </Button>
                    <Switch checked={user.active} onChange={() => onToggleActive(user)} />
                  </Stack>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
