import {
  Chip,
  Paper,
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
};

export function UserTable({ canManageUsers, onToggleActive, users }: UserTableProps) {
  return (
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
            {canManageUsers ? <TableCell align="right">Active</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.roleLabel}</TableCell>
              <TableCell>
                <Chip
                  color={user.active ? "success" : "default"}
                  label={user.active ? "Active" : "Inactive"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              {canManageUsers ? (
                <TableCell align="right">
                  <Switch checked={user.active} onChange={() => onToggleActive(user)} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
