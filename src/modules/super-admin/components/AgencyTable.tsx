import {
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import { Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import {
  AgencyStatusChip,
  formatAgencyLocation,
  SubscriptionChip,
  VerificationChip,
} from "@/modules/super-admin/components/AgencyStatusChip";
import { superAdminRoutePaths } from "@/modules/super-admin/superAdminRoutePaths";
import type { Agency } from "@/modules/super-admin/superAdmin.types";

type AgencyTableProps = {
  agencies: Agency[];
  onSuspend: (agency: Agency) => void;
  onActivate: (agency: Agency) => void;
  onDeactivate: (agency: Agency) => void;
};

export function AgencyTable({ agencies, onActivate, onDeactivate, onSuspend }: AgencyTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLElement>, agency: Agency) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAgency(agency);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setSelectedAgency(null);
  };

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agency</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell align="right">Students</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id} hover>
                <TableCell>
                  <Typography
                    component={RouterLink}
                    sx={{ color: "text.primary", fontWeight: 600, textDecoration: "none", "&:hover": { color: "primary.main" } }}
                    to={superAdminRoutePaths.agencyDetail(agency.id)}
                  >
                    {agency.name}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {agency.admin.email}
                  </Typography>
                </TableCell>
                <TableCell>{formatAgencyLocation(agency)}</TableCell>
                <TableCell>
                  <SubscriptionChip plan={agency.subscriptionPlan} />
                </TableCell>
                <TableCell>
                  <AgencyStatusChip status={agency.status} />
                </TableCell>
                <TableCell>
                  <VerificationChip status={agency.verificationStatus} />
                </TableCell>
                <TableCell align="right">{agency.userCount}</TableCell>
                <TableCell align="right">{agency.studentCount}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={(event) => openMenu(event, agency)}>
                    <MoreVertRounded fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {selectedAgency?.status === "suspended" ? (
          <MenuItem
            onClick={() => {
              if (selectedAgency) onActivate(selectedAgency);
              closeMenu();
            }}
          >
            Activate Agency
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              if (selectedAgency) onSuspend(selectedAgency);
              closeMenu();
            }}
          >
            Suspend Agency
          </MenuItem>
        )}
        {selectedAgency?.status === "active" ? (
          <MenuItem
            onClick={() => {
              if (selectedAgency) onDeactivate(selectedAgency);
              closeMenu();
            }}
          >
            Deactivate Agency
          </MenuItem>
        ) : selectedAgency?.status === "inactive" ? (
          <MenuItem
            onClick={() => {
              if (selectedAgency) onActivate(selectedAgency);
              closeMenu();
            }}
          >
            Activate Agency
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
