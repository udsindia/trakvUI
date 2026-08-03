import { useState } from "react";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
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

/**
 * Solid tints rather than alpha overlays, so chips read consistently on both
 * the white row and the tinted hover/selected states.
 */
const stageStyles: Record<string, { backgroundColor: string; color: string }> = {
  Draft: { backgroundColor: "#EEF2F6", color: "#55707C" },
  Submitted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Processing: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  "Visa Applied": { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  "Visa Approved": { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  "Visa Rejected": { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Completed: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
};

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "?";
}

export function ApplicationTableContainer({
  applications,
  page,
  pageCount,
  paginationLabel,
}: ApplicationTableContainerProps) {
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  const handleViewDetails = (id: string) => {
    setActiveAppId(id);
  };

  const handleDeleteApplication = (id: string) => {
    setActiveAppId(id);
  };

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Table
            stickyHeader
            sx={{
              minWidth: 920,
              // Sticky header needs an opaque ground; the rest of the head
              // styling (tracked uppercase) comes from the theme.
              "& .MuiTableHead-root .MuiTableCell-root": { bgcolor: "#F7FAFC" },
              "& .MuiTableBody-root .MuiTableCell-root": { fontSize: 12.5, py: 1.15 },
            }}
          >
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
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                      {/* <Avatar sx={{ bgcolor: "#DBEAF6", color: "#2F6F94", fontSize: 11, fontWeight: 700, width: 31, height: 31 }}>
                        {getInitials(app.studentName)}
                      </Avatar> */}
                      <Stack spacing={0.125}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
                          <RouterLink to={`/applications/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {app.studentName}
                          </RouterLink>
                        </Typography>
                        <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
                          {app.email}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{app.targetCountry}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{app.targetUniversity}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{app.course}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Chip
                      label={app.stage}
                      size="small"
                      sx={{ ...(stageStyles[app.stage] || {}) }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end" }}>
                      <IconButton
                        aria-label={`View details for ${app.studentName}`}
                        component={RouterLink}
                        size="small"
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "7px",
                          color: "secondary.main",
                          height: 28,
                          width: 28,
                          "&:hover": { borderColor: "secondary.main", bgcolor: "secondary.50" },
                        }}
                        to={`/applications/${app.id}`}
                        onClick={() => handleViewDetails(app.id)}
                      >
                        <VisibilityRounded fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${app.studentName}`}
                        size="small"
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "7px",
                          color: "error.main",
                          height: 28,
                          width: 28,
                          "&:hover": { borderColor: "error.main", bgcolor: "error.50" },
                        }}
                        onClick={() => handleDeleteApplication(app.id)}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </IconButton>
                    </Stack>
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
    </Box>
  );
}
