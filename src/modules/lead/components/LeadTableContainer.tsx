import { useEffect, useState } from "react";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
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

  const handleRowDelete = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!window.confirm(`Delete lead "${lead?.name ?? leadId}"? This cannot be undone.`)) return;
    setActiveLeadId(leadId);
    setActionLoading(true);
    try {
      await onDeleteLead(leadId);
    } finally {
      setActionLoading(false);
      setActiveLeadId(null);
    }
  };

  const handleRowUpdateStage = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    setStageDialogLeadId(leadId);
    setStageDialogValue(lead?.stage ?? "New");
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

  const handleBulkChangeStage = () => {
    setBulkStageValue("Contacted");
    setBulkStageDialogOpen(true);
  };

  const handlePaginationChange = (_: React.ChangeEvent<unknown>, value: number) => {
    const normalizedPage = Math.max(1, Math.min(value, pageCount));
    onPageChange(normalizedPage);
  };

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
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
        {/* Selection strip — only takes space while rows are selected, so the
            table sits flush to the toolbar the rest of the time. */}
        {hasSelection ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              bgcolor: "#F0F9FB",
              borderBottom: "1px solid",
              borderColor: "#dcecf0",
              flexShrink: 0,
              px: 2,
              py: 0.75,
            }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600 }}>
              {selectedLeadIds.length} selected
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              sx={{ color: "text.secondary", fontSize: 12, textTransform: "none" }}
              onClick={handleClearSelection}
            >
              Clear
            </Button>
            <Button
              disabled={actionLoading}
              size="small"
              sx={{
                bgcolor: "#5f9fc6",
                borderRadius: "8px",
                color: "common.white",
                fontSize: 12,
                fontWeight: 700,
                px: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "#4f8fb6" },
              }}
              onClick={handleBulkChangeStage}
            >
              Change Stage
            </Button>
            <Button
              disabled={actionLoading}
              size="small"
              sx={{
                bgcolor: "#ef6b7b",
                borderRadius: "8px",
                color: "common.white",
                fontSize: 12,
                fontWeight: 700,
                px: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "#df5b6b" },
              }}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
          </Stack>
        ) : null}

        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Table
            stickyHeader
            sx={{
              minWidth: 820,
              // Header styling now comes from the theme (tracked uppercase on a
              // tinted ground); only the sticky background needs restating so
              // rows don't show through while scrolling.
              "& .MuiTableHead-root .MuiTableCell-root": {
                bgcolor: "#F7FAFC",
                lineHeight: 1.3,
                py: 0.5,
              },
              // Match the prototype's tight 8px vertical rhythm so more rows fit.
              "& .MuiTableBody-root .MuiTableCell-root": {
                py: 1,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allVisibleRowsSelected}
                    disabled={leads.length === 0}
                    indeterminate={hasPartialSelection}
                    size="small"
                    sx={{
                      color: "#CBDFE6",
                      "&.Mui-checked": { color: "primary.main" },
                      "&.MuiCheckbox-indeterminate": { color: "primary.main" },
                    }}
                    onChange={(event) => handleToggleAllRows(event.target.checked)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Country</TableCell>
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
                    <TableCell sx={{ padding: "checkbox", minWidth: 30, maxWidth: 40 }}>
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

                    <TableCell sx={{ minWidth: 200 }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        {/* <Avatar
                          sx={{
                            ...leadAvatarTone,
                            fontSize: 11,
                            fontWeight: 700,
                            height: 31,
                            width: 31,
                          }}
                        >
                          {getOwnerInitials(lead.name)}
                        </Avatar> */}
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

                    <TableCell sx={{ minWidth: 120 }}>
                      <Typography color="text.secondary" noWrap sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
                        {lead.phone || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 92 }}>
                      <Typography sx={{ fontSize: 12.5 }} variant="body2">
                        {lead.country || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ minWidth: 104 }}>
                      <Chip
                        label={lead.stage}
                        size="small"
                        sx={{ ...(stageStyles[lead.stage] ?? {}) }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 66 }}>
                      {lead.score ? (
                        <Typography
                          component="span"
                          sx={{
                            color: getScoreColor(lead.score),
                            fontFamily: SERIF,
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {lead.score}
                        </Typography>
                      ) : (
                        <Typography component="span" color="text.disabled" sx={{ fontSize: 13 }}>
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        {/* <Avatar
                          sx={{
                            ...agentAvatarTone,
                            fontSize: 9.5,
                            fontWeight: 700,
                            height: 24,
                            width: 24,
                          }}
                        >
                          {getOwnerInitials(lead.agent)}
                        </Avatar> */}
                        <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
                          {lead.agent}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 80 }}>
                      <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
                        {lead.lastActivity}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
                        <IconButton
                          aria-label={`Update stage for ${lead.name}`}
                          disabled={actionLoading}
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
                          onClick={() => handleRowUpdateStage(lead.id)}
                        >
                          <EditRounded fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${lead.name}`}
                          disabled={actionLoading}
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
                          onClick={() => handleRowDelete(lead.id)}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: "center" }}>
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
          spacing={1.5}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between", px: 2, py: 1 }}
        >
          <Typography color="text.secondary" sx={{ fontSize: 12 }} variant="body2">
            {paginationLabel}
          </Typography>

          <Box sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
            <Pagination
              count={pageCount}
              page={Math.max(1, Math.min(page, pageCount))}
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
              onChange={handlePaginationChange}
            />
          </Box>
        </Stack>
      </Paper>

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
