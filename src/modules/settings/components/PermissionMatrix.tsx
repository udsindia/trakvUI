import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getPermissionLabel } from "@/config/permissions/permissionLabels";
import type { RoleDefinition } from "@/modules/settings/settings.types";

type PermissionMatrixProps = {
  roles: RoleDefinition[];
};

export function PermissionMatrix({ roles }: PermissionMatrixProps) {
  const permissions = Array.from(
    new Set(roles.flatMap((role) => role.permissions)),
  ).sort();

  if (roles.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 4 }}
      >
        <Typography color="text.secondary">No roles available to display.</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Permission</TableCell>
            {roles.map((role) => (
              <TableCell key={role.id} align="center">
                <Box sx={{ display: "grid", gap: 0.5, justifyItems: "center" }}>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    {role.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {role.roleName}
                  </Typography>
                  <Chip
                    label={role.type === "system" ? "System" : "Custom"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission} hover>
              <TableCell>
                <Typography variant="body2">{getPermissionLabel(permission)}</Typography>
                <Typography color="text.secondary" variant="caption">
                  {permission}
                </Typography>
              </TableCell>
              {roles.map((role) => (
                <TableCell key={`${role.id}-${permission}`} align="center">
                  {role.permissions.includes(permission) ? "✓" : "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
