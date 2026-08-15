import { useEffect, useRef, useState } from "react";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SERIF } from "@/shared/ui/vutrakTheme";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

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

export const LEAD_STAGES = ["New", "Contacted", "Qualified", "Prospective", "Enrolled"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

type LeadTableContainerProps = {
  leads: LeadRow[];
  onBulkDelete: (ids: string[], signal?: AbortSignal) => Promise<void>;
  onDeleteLead: (id: string, signal?: AbortSignal) => Promise<void>;
  onUpdateStage: (id: string, stage: string, signal?: AbortSignal) => Promise<void>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  pageCount: number;
  paginationLabel: string;
};

/**
 * Stage chips follow the VUTrak stage semantics: teal for a fresh lead through
 * to orange as it approaches proposal — so colour tracks progression, not decoration.
 */
const stageStyles: Record<string, { backgroundColor: string; color: string }> = {
  New: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
  Contacted: { backgroundColor: "#E4EDFC", color: "#0F5AD4" },
  Qualified: { backgroundColor: "#F3E7F8", color: "#7B1FA2" },
  Prospective: { backgroundColor: "#FDEEDD", color: "#B35A00" },
  Negotiation: { backgroundColor: "#FBF0DA", color: "#8A5B08" },
  Enrolled: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  Lost: { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Archived: { backgroundColor: "#EEF2F6", color: "#55707C" },
};

/**
 * Score is rendered as a bare figure rather than a filled badge — a column of
 * numerals is easier to compare than a column of coloured discs.
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
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  paginationLabel,
}: LeadTableContainerProps) {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
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

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    setActionLoading(true);
    try {
      await onDeleteLead(leadId, signal);
    } finally {
      if (!signal.aborted) setActionLoading(false);
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
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    setActionLoading(true);
    try {
      await onUpdateStage(stageDialogLeadId, stageDialogValue, signal);
    } finally {
      if (!signal.aborted) {
        setActionLoading(false);
        setStageDialogOpen(false);
        setStageDialogLeadId(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedLeadIds.length} selected lead(s)? This cannot be undone.`)) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    setActionLoading(true);
    try {
      await onBulkDelete(selectedLeadIds, signal);
      if (!signal.aborted) setSelectedLeadIds([]);
    } finally {
      if (!signal.aborted) setActionLoading(false);
    }
  };

  const handleBulkStageDialogConfirm = async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    setActionLoading(true);
    try {
      await Promise.all(selectedLeadIds.map((id) => onUpdateStage(id, bulkStageValue, signal)));
      if (!signal.aborted) setSelectedLeadIds([]);
    } finally {
      if (!signal.aborted) {
        setActionLoading(false);
        setBulkStageDialogOpen(false);
      }
    }
  };

  const handleBulkChangeStage = () => {
    setBulkStageValue("Contacted");
    setBulkStageDialogOpen(true);
  };

  const columns: DataTableColumn<LeadRow>[] = [
    {
      id: "name",
      header: "Name",
      minWidth: 200,
      render: (lead) => (
        <Stack spacing={0.125}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
            {lead.name}
          </Typography>
          <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
            {lead.email}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      minWidth: 120,
      render: (lead) => (
        <Typography color="text.secondary" noWrap sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
          {lead.phone || "—"}
        </Typography>
      ),
    },
    {
      id: "country",
      header: "Country",
      minWidth: 92,
      render: (lead) => (
        <Typography sx={{ fontSize: 12.5 }} variant="body2">
          {lead.country || "—"}
        </Typography>
      ),
    },
    {
      id: "stage",
      header: "Stage",
      minWidth: 104,
      render: (lead) => <Chip label={lead.stage} size="small" sx={{ ...(stageStyles[lead.stage] ?? {}) }} />,
    },
    {
      id: "score",
      header: "Score",
      align: "center",
      minWidth: 66,
      render: (lead) =>
        lead.score ? (
          <Typography
            component="span"
            sx={{ color: getScoreColor(lead.score), fontFamily: SERIF, fontSize: 14, fontWeight: 600 }}
          >
            {lead.score}
          </Typography>
        ) : (
          <Typography component="span" color="text.disabled" sx={{ fontSize: 13 }}>
            —
          </Typography>
        ),
    },
    {
      id: "agent",
      header: "Agent",
      minWidth: 120,
      render: (lead) => (
        <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 500 }} variant="body2">
          {lead.agent}
        </Typography>
      ),
    },
    {
      id: "lastActivity",
      header: "Last Activity",
      minWidth: 80,
      render: (lead) => (
        <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
          {lead.lastActivity}
        </Typography>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "right",
      render: (lead) => (
        <Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
          <Tooltip title="Change Stage">
            <IconButton
              aria-label={`Change stage for ${lead.name}`}
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
              <SwapHorizRounded fontSize="small" />
            </IconButton>
          </Tooltip>
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
      ),
    },
  ];

  // Bulk-selection action strip — only present while rows are selected.
  const selectionToolbar = hasSelection ? (
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
      <Button size="small" sx={{ color: "text.secondary", fontSize: 12, textTransform: "none" }} onClick={handleClearSelection}>
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
  ) : null;

  return (
    <>
      <DataTable
        columns={columns}
        rows={leads}
        getRowKey={(lead) => lead.id}
        page={page}
        pageCount={pageCount}
        paginationLabel={paginationLabel}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
        emptyMessage="No leads found."
        minWidth={820}
        toolbar={selectionToolbar}
        onRowClick={(lead) => navigate(leadRoutePaths.details(lead.id))}
        rowSx={() => ({ "&.Mui-selected": { bgcolor: "#F0F9FB" } })}
        selection={{
          isSelected: (lead) => selectedLeadIds.includes(lead.id),
          onToggleRow: (lead) => handleToggleRow(lead.id),
          allSelected: allVisibleRowsSelected,
          indeterminate: hasPartialSelection,
          onToggleAll: handleToggleAllRows,
        }}
      />

      {/* Per-row stage update dialog */}
      <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Lead Stage</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Stage</InputLabel>
            <Select label="Stage" value={stageDialogValue} onChange={(e) => setStageDialogValue(e.target.value)}>
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
            <Select label="New Stage" value={bulkStageValue} onChange={(e) => setBulkStageValue(e.target.value)}>
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
    </>
  );
}
