import { useEffect, useState, type MouseEvent } from "react";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import {
  Avatar,
  Box,
  Checkbox,
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
import {
  BulkActionsBar,
  type BulkAction,
} from "@/shared/components/BulkActionsBar";

export type LeadRow = {
  email: string;
  id: string;
  lastActivity: string;
  name: string;
  nextAction: string;
  agent: string;
  phone: string;
  score: number;
  source: string;
  stage: string;
};

type LeadTableContainerProps = {
  leads: LeadRow[];
  page: number;
  pageCount: number;
  paginationLabel: string;
};

const stageStyles: Record<string, { backgroundColor: string; color: string }> = {
  Contacted: {
    backgroundColor: "rgba(15, 90, 212, 0.12)",
    color: "#0f5ad4",
  },
  New: {
    backgroundColor: "rgba(0, 137, 123, 0.14)",
    color: "#00796b",
  },
  Proposal: {
    backgroundColor: "rgba(237, 108, 2, 0.14)",
    color: "#b35a00",
  },
  Qualified: {
    backgroundColor: "rgba(123, 31, 162, 0.14)",
    color: "#7b1fa2",
  },
};

const bulkActions: BulkAction[] = [
  {
    key: "assign-agent",
    label: "Assign Agent",
    sx: {
      "&.Mui-disabled": {
        bgcolor: "#eef6fc",
        color: "#9ab4c8",
      },
      "&:not(.Mui-disabled)": {
        bgcolor: "#2f87b7",
        color: "common.white",
      },
    },
    variant: "contained",
  },
  {
    key: "change-stage",
    label: "Change Stage",
    sx: {
      "&.Mui-disabled": {
        bgcolor: "#edf5fa",
        color: "#9fb5c6",
      },
      "&:not(.Mui-disabled)": {
        bgcolor: "#5f9fc6",
        color: "common.white",
      },
    },
    variant: "contained",
  },
  {
    key: "delete",
    label: "Delete",
    sx: {
      "&.Mui-disabled": {
        bgcolor: "#fdecef",
        color: "#d6a2ac",
      },
      "&:not(.Mui-disabled)": {
        bgcolor: "#ef6b7b",
        color: "common.white",
      },
    },
    variant: "contained",
  },
];

const rowActionItems = [
  {
    key: "assign-agent",
    label: "Assign to another agent",
  },
  {
    key: "update-stage",
    label: "Update Stage",
  },
  {
    key: "delete",
    label: "Delete",
  },
];

function getOwnerInitials(owner: string) {
  return owner
    .split(" ")
    .map((token) => token[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const avatarPalette = [
  { backgroundColor: "#f7d6cf", color: "#8f4a39" },
  { backgroundColor: "#dbeaf6", color: "#2f6f94" },
  { backgroundColor: "#dff2e4", color: "#367a4d" },
  { backgroundColor: "#f8e6c9", color: "#a86b1f" },
];

function getAvatarTone(seed: string) {
  const index = seed.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  return avatarPalette[index % avatarPalette.length];
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      backgroundColor: "#daf5e3",
      color: "#3ea96c",
    };
  }

  if (score >= 70) {
    return {
      backgroundColor: "#feedd5",
      color: "#d98c1f",
    };
  }

  return {
    backgroundColor: "#fff2d8",
    color: "#b98b28",
  };
}

export function LeadTableContainer({
  leads,
  page,
  pageCount,
  paginationLabel,
}: LeadTableContainerProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLeadIds((currentSelection) =>
      currentSelection.filter((leadId) => leads.some((lead) => lead.id === leadId)),
    );
  }, [leads]);

  const allVisibleRowsSelected = leads.length > 0 && selectedLeadIds.length === leads.length;
  const hasPartialSelection =
    selectedLeadIds.length > 0 && selectedLeadIds.length < leads.length;
  const bulkActionsEnabled = allVisibleRowsSelected;

  const resolvedBulkActions = bulkActions.map((action) => ({
    ...action,
    disabled: Boolean(action.disabled) || !bulkActionsEnabled,
  }));

  const handleClearSelection = () => {
    setSelectedLeadIds([]);
  };

  const handleToggleAllRows = (checked: boolean) => {
    setSelectedLeadIds(checked ? leads.map((lead) => lead.id) : []);
  };

  const handleToggleRow = (leadId: string) => {
    setSelectedLeadIds((currentSelection) =>
      currentSelection.includes(leadId)
        ? currentSelection.filter((selectedLeadId) => selectedLeadId !== leadId)
        : [...currentSelection, leadId],
    );
  };

  const handleOpenRowMenu = (
    event: MouseEvent<HTMLElement>,
    leadId: string,
  ) => {
    setActiveLeadId(leadId);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseRowMenu = () => {
    setActiveLeadId(null);
    setMenuAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: 2,
        minHeight: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "#edf2f7",
          borderRadius: 1,
        }}
      >
        <BulkActionsBar
          actions={resolvedBulkActions}
          allSelected={allVisibleRowsSelected}
          indeterminate={hasPartialSelection}
          itemLabel="lead"
          onClearSelection={handleClearSelection}
          onSelectAllChange={handleToggleAllRows}
          selectedCount={selectedLeadIds.length}
          totalCount={leads.length}
        />
      </Paper>

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
          <Table
            stickyHeader
            sx={{
              minWidth: 920,
              "& .MuiTableHead-root .MuiTableCell-root": {
                bgcolor: "background.paper",
                borderBottomColor: "#edf2f7",
                color: "text.secondary",
                fontSize: 12,
                fontWeight: 700,
                py: 1.75,
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                borderBottomColor: "#edf2f7",
                py: 1.6,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {leads.map((lead) => {
                const leadAvatarTone = getAvatarTone(lead.name);
                const agentAvatarTone = getAvatarTone(lead.agent);
                const scoreTone = getScoreTone(lead.score);

                return (
                  <TableRow
                    hover
                    key={lead.id}
                    selected={selectedLeadIds.includes(lead.id)}
                    sx={{
                      "&.Mui-selected": {
                        bgcolor: "#f9fcff",
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedLeadIds.includes(lead.id)}
                        size="small"
                        sx={{
                          color: "#c8d5e1",
                          "&.Mui-checked": {
                            color: "#2f87b7",
                          },
                        }}
                        onChange={() => handleToggleRow(lead.id)}
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 270 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            ...leadAvatarTone,
                            fontSize: 13,
                            fontWeight: 700,
                            height: 38,
                            width: 38,
                          }}
                        >
                          {getOwnerInitials(lead.name)}
                        </Avatar>
                        <Stack spacing={0.2}>
                          <Typography fontWeight={700} sx={{ fontSize: 14 }} variant="body2">
                            {lead.name}
                          </Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="caption">
                            {lead.email}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }} variant="body2">
                        {lead.phone}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <Chip
                        label={lead.stage}
                        size="small"
                        sx={{
                          ...stageStyles[lead.stage],
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          px: 0.25,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 84 }}>
                      <Box
                        sx={{
                          ...scoreTone,
                          alignItems: "center",
                          borderRadius: "50%",
                          display: "inline-flex",
                          fontSize: 12,
                          fontWeight: 700,
                          height: 30,
                          justifyContent: "center",
                          width: 30,
                        }}
                      >
                        {lead.score}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ minWidth: 190 }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            ...agentAvatarTone,
                            fontSize: 12,
                            fontWeight: 700,
                            height: 32,
                            width: 32,
                          }}
                        >
                          {getOwnerInitials(lead.agent)}
                        </Avatar>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }} variant="body2">
                          {lead.agent}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 110 }}>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }} variant="body2">
                        {lead.lastActivity}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        aria-controls={activeLeadId === lead.id ? "lead-row-actions-menu" : undefined}
                        aria-expanded={activeLeadId === lead.id ? "true" : undefined}
                        aria-haspopup="true"
                        aria-label={`Open actions for ${lead.name}`}
                        size="small"
                        sx={{
                          border: "1px solid",
                          borderColor: "#e4edf5",
                          borderRadius: 2.5,
                          color: "#6b8395",
                          height: 34,
                          width: 34,
                        }}
                        onClick={(event) => handleOpenRowMenu(event, lead.id)}
                      >
                        <MoreVertRounded fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            alignItems: { md: "center" },
            justifyContent: "space-between",
            p: 2.25,
          }}
        >
          <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="body2">
            {paginationLabel}
          </Typography>

          <Box sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
            <Pagination
              count={pageCount}
              page={page}
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: 1.75,
                  fontSize: 12,
                  height: 28,
                  minWidth: 28,
                },
                "& .Mui-selected": {
                  bgcolor: "#2f87b7 !important",
                  color: "common.white",
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      <Menu
        anchorEl={menuAnchorEl}
        id="lead-row-actions-menu"
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseRowMenu}
      >
        {rowActionItems.map((action) => (
          <MenuItem key={action.key} onClick={handleCloseRowMenu}>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
