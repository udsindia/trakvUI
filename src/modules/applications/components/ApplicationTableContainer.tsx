import { useState, type MouseEvent } from "react";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
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
import { Link as RouterLink } from "react-router-dom";

export type ApplicationRow = {
  id: string;
  studentName: string;
  email: string;
  targetCountry: string;
  targetUniversity: string;
  course: string;
  stage: string;
  createdAt: string;
};

type ApplicationTableContainerProps = {
  applications: ApplicationRow[];
  page: number;
  pageCount: number;
  paginationLabel: string;
};

const stageStyles: Record<string, { backgroundColor: string; color: string }> = {
  Draft: { backgroundColor: "rgba(15, 90, 212, 0.12)", color: "#0f5ad4" },
  Submitted: { backgroundColor: "rgba(15, 90, 212, 0.12)", color: "#0f5ad4" },
  Processing: { backgroundColor: "rgba(237, 108, 2, 0.14)", color: "#b35a00" },
  "Visa Applied": { backgroundColor: "rgba(123, 31, 162, 0.14)", color: "#7b1fa2" },
  "Visa Approved": { backgroundColor: "rgba(0, 137, 123, 0.14)", color: "#00796b" },
  "Visa Rejected": { backgroundColor: "rgba(211, 47, 47, 0.14)", color: "#d32f2f" },
  Completed: { backgroundColor: "rgba(0, 137, 123, 0.14)", color: "#00796b" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function ApplicationTableContainer({
  applications,
  page,
  pageCount,
  paginationLabel,
}: ApplicationTableContainerProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  const handleOpenRowMenu = (event: MouseEvent<HTMLElement>, id: string) => {
    setActiveAppId(id);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseRowMenu = () => {
    setActiveAppId(null);
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "#edf2f7",
          borderRadius: 1,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Table stickyHeader sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>University</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow hover key={app.id}>
                  <TableCell sx={{ minWidth: 270 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Avatar sx={{ bgcolor: "#dbeaf6", color: "#2f6f94", fontSize: 13, fontWeight: 700, width: 38, height: 38 }}>
                        {getInitials(app.studentName)}
                      </Avatar>
                      <Stack spacing={0.2}>
                        <Typography fontWeight={700} sx={{ fontSize: 14 }} variant="body2">
                          <RouterLink to={`/applications/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {app.studentName}
                          </RouterLink>
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="caption">
                          {app.email}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{app.targetCountry}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{app.targetUniversity}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{app.course}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Chip
                      label={app.stage}
                      size="small"
                      sx={{
                        ...(stageStyles[app.stage] || {}),
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      sx={{ border: "1px solid #e4edf5", borderRadius: 2.5 }}
                      onClick={(event) => handleOpenRowMenu(event, app.id)}
                    >
                      <MoreVertRounded fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ p: 2.25, justifyContent: "space-between" }}>
          <Typography color="text.secondary" sx={{ fontSize: 12 }}>{paginationLabel}</Typography>
          <Pagination count={pageCount} page={page} shape="rounded" />
        </Stack>
      </Paper>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseRowMenu}>
        <MenuItem component={RouterLink} to={`/applications/${activeAppId}`} onClick={handleCloseRowMenu}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleCloseRowMenu}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
