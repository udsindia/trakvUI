import { useEffect, useState, type MouseEvent } from "react";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
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
import { SERIF } from "@/shared/ui/vutrakTheme";

export type LeadRow = {
  country: string;
  createdAt: string;
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

export const LEAD_STAGES = ["New", "Contacted", "Qualified", "Proposal"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

type LeadTableContainerProps = {
  leads: LeadRow[];
  onBulkDelete: (ids: string[]) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onUpdateStage: (id: string, stage: string) => Promise<void>;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  paginationLabel: string;
};

/**
 * Stage chips follow the VUTrak stage semantics: teal for a fresh lead through
 * to orange as it approaches proposal — so colour tracks progression, not decoration.
 */
const stageStyles: Record<string, { backgroundColor: string; color: string }> = {
  New: {
    backgroundColor: "#DEF1F0",
    color: "#0B6B6B",
  },
  Contacted: {
    backgroundColor: "#E4EDFC",
    color: "#0F5AD4",
  },
  Qualified: {
    backgroundColor: "#F3E7F8",
    color: "#7B1FA2",
  },
  Proposal: {
    backgroundColor: "#FDEEDD",
    color: "#B35A00",
  },
  // Terminal / late stages the backend also emits (see leadStageMappers) —
  // without these they fall through to an unstyled grey chip.
  Negotiation: {
    backgroundColor: "#FBF0DA",
    color: "#8A5B08",
  },
  Converted: {
    backgroundColor: "#E1F5EC",
    color: "#0B7A57",
  },
  Lost: {
    backgroundColor: "#FBE5E5",
    color: "#C0392F",
  },
  Archived: {
    backgroundColor: "#EEF2F6",
    color: "#55707C",
  },
};

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
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarPalette[index % avatarPalette.length];
}

/**
 * Score is rendered as a bare figure rather than a filled badge — a column of
 * numerals is easier to compare than a column of coloured discs, and it keeps
 * the row quiet. Colour marks the strong scores only.
 */
function getScoreColor(score: number) {
  if (score >= 80) return "secondary.dark";
  if (score >= 70) return "text.primary";
  return "text.disabled";
}

export function LeadTableContainer({
  leads,
  onBulkDelete,
  onDeleteLead,
  onUpdateStage,
  onPageChange,
  page,
  pageCount,
  paginationLabel,
}: LeadTableContainerProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [stageDialogLeadId, setStageDialogLeadId] = useState<string | null>(null);
  const [stageDialogValue, setStageDialogValue] = useState<string>("New");
  const [bulkStageDialogOpen, setBulkStageDialogOpen] = useState(false);
  const [bulkStageValue, setBulkStageValue] = useState<string>("New");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setSelectedLeadIds((current) =>
      current.filter((id) => leads.some((lead) => lead.id === id)),
    );
  }, [leads]);

  const allVisibleRowsSelected = leads.length > 0 && selectedLeadIds.length === leads.length;
  const hasPartialSelection = selectedLeadIds.length > 0 && selectedLeadIds.length < leads.length;
  const hasSelection = selectedLeadIds.length > 0;

  const handleClearSelection = () => setSelectedLeadIds([]);
  const handleToggleAllRows = (checked: boolean) =>
    setSelectedLeadIds(checked ? leads.map((l) => l.id) : []);
  const handleToggleRow = (leadId: string) =>
    setSelectedLeadIds((current) =>
      current.includes(leadId)
        ? current.filter((id) => id !== leadId)
        : [...current, leadId],
    );

  const handleOpenRowMenu = (event: MouseEvent<HTMLElement>, leadId: string) => {
    setActiveLeadId(leadId);
    setMenuAnchorEl(event.currentTarget);
  };
  const handleCloseRowMenu = () => {
    setActiveLeadId(null);
    setMenuAnchorEl(null);
  };

  const handleRowDelete = async () => {
    if (!activeLeadId) return;
    const lead = leads.find((l) => l.id === activeLeadId);
    if (!window.confirm(`Delete lead "${lead?.name ?? activeLeadId}"? This cannot be undone.`)) return;
    handleCloseRowMenu();
    setActionLoading(true);
    try {
      await onDeleteLead(activeLeadId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRowUpdateStage = () => {
    if (!activeLeadId) return;
    const lead = leads.find((l) => l.id === activeLeadId);
    setStageDialogLeadId(activeLeadId);
    setStageDialogValue(lead?.stage ?? "New");
    handleCloseRowMenu();
    setStageDialogOpen(true);
  };

  const handleStageDialogConfirm = async () => {
    if (!stageDialogLeadId) return;
    setActionLoading(true);
    try {
      await onUpdateStage(stageDialogLeadId, stageDialogValue);
    } finally {
      setActionLoading(false);
      setStageDialogOpen(false);
      setStageDialogLeadId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedLeadIds.length} selected lead(s)? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await onBulkDelete(selectedLeadIds);
      setSelectedLeadIds([]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStageDialogConfirm = async () => {
    setActionLoading(true);
    try {
      await Promise.all(selectedLeadIds.map((id) => onUpdateStage(id, bulkStageValue)));
      setSelectedLeadIds([]);
    } finally {
      setActionLoading(false);
      setBulkStageDialogOpen(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: "change-stage",
      label: "Change Stage",
      disabled: !hasSelection || actionLoading,
      variant: "contained",
      sx: {
        "&.Mui-disabled": { bgcolor: "#edf5fa", color: "#9fb5c6" },
        "&:not(.Mui-disabled)": { bgcolor: "#5f9fc6", color: "common.white" },
      },
      onClick: () => {
        setBulkStageValue("Contacted");
        setBulkStageDialogOpen(true);
      },
    },
    {
      key: "delete",
      label: "Delete",
      disabled: !hasSelection || actionLoading,
      variant: "contained",
      sx: {
        "&.Mui-disabled": { bgcolor: "#fdecef", color: "#d6a2ac" },
        "&:not(.Mui-disabled)": { bgcolor: "#ef6b7b", color: "common.white" },
      },
      onClick: handleBulkDelete,
    },
  ];

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "#edf2f7", borderRadius: "12px" }}
      >
        <BulkActionsBar
          actions={bulkActions}
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
              // Header styling now comes from the theme (tracked uppercase on a
              // tinted ground); only the sticky background needs restating so
              // rows don't show through while scrolling.
              "& .MuiTableHead-root .MuiTableCell-root": {
                bgcolor: "#F7FAFC",
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                py: 1.15,
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

                return (
                  <TableRow
                    hover
                    key={lead.id}
                    selected={selectedLeadIds.includes(lead.id)}
                    sx={{ "&.Mui-selected": { bgcolor: "#F0F9FB" } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedLeadIds.includes(lead.id)}
                        size="small"
                        sx={{
                          color: "#CBDFE6",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                        onChange={() => handleToggleRow(lead.id)}
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 270 }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            ...leadAvatarTone,
                            fontSize: 11,
                            fontWeight: 700,
                            height: 31,
                            width: 31,
                          }}
                        >
                          {getOwnerInitials(lead.name)}
                        </Avatar>
                        <Stack spacing={0.125}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
                            {lead.name}
                          </Typography>
                          <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
                            {lead.email}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
                        {lead.phone}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <Chip
                        label={lead.stage}
                        size="small"
                        sx={{ ...(stageStyles[lead.stage] ?? {}) }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 84 }}>
                      <Typography
                        component="span"
                        sx={{
                          color: getScoreColor(lead.score),
                          fontFamily: SERIF,
                          fontSize: 14.5,
                          fontWeight: 600,
                        }}
                      >
                        {lead.score}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 190 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            ...agentAvatarTone,
                            fontSize: 9.5,
                            fontWeight: 700,
                            height: 24,
                            width: 24,
                          }}
                        >
                          {getOwnerInitials(lead.agent)}
                        </Avatar>
                        <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
                          {lead.agent}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 110 }}>
                      <Typography color="text.disabled" sx={{ fontSize: 11.5 }} variant="body2">
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
                          borderColor: "divider",
                          borderRadius: "7px",
                          color: "text.disabled",
                          height: 28,
                          width: 28,
                          "&:hover": { borderColor: "secondary.main", color: "secondary.main" },
                        }}
                        onClick={(event) => handleOpenRowMenu(event, lead.id)}
                      >
                        <MoreVertRounded fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}

              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body2">
                      No leads found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between", p: 2.25 }}
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
                  borderRadius: "9px",
                  fontSize: 12,
                  height: 28,
                  minWidth: 28,
                },
                "& .Mui-selected": {
                  bgcolor: "#2f87b7 !important",
                  color: "common.white",
                },
              }}
              onChange={(_, value) => onPageChange(value)}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Row action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        id="lead-row-actions-menu"
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseRowMenu}
      >
        <MenuItem onClick={handleRowUpdateStage}>Update Stage</MenuItem>
        <MenuItem sx={{ color: "error.main" }} onClick={handleRowDelete}>
          Delete
        </MenuItem>
      </Menu>

      {/* Per-row stage update dialog */}
      <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Lead Stage</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={stageDialogValue}
              onChange={(e) => setStageDialogValue(e.target.value)}
            >
              {LEAD_STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialogOpen(false)}>Cancel</Button>
          <Button disabled={actionLoading} variant="contained" onClick={handleStageDialogConfirm}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk stage change dialog */}
      <Dialog open={bulkStageDialogOpen} onClose={() => setBulkStageDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Stage for {selectedLeadIds.length} Lead(s)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>New Stage</InputLabel>
            <Select
              label="New Stage"
              value={bulkStageValue}
              onChange={(e) => setBulkStageValue(e.target.value)}
            >
              {LEAD_STAGES.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkStageDialogOpen(false)}>Cancel</Button>
          <Button disabled={actionLoading} variant="contained" onClick={handleBulkStageDialogConfirm}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
