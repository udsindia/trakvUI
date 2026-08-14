import { useState } from "react";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { Chip, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";

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
  onDeleteApplication?: (id: string) => Promise<void>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  pageCount: number;
  paginationLabel: string;
};

/** Plain text cell matching the Leads table styling, with an em-dash fallback. */
function TextCell({ value }: { value?: string }) {
  return (
    <Typography noWrap sx={{ fontSize: 12.5 }} variant="body2">
      {value || "—"}
    </Typography>
  );
}

function formatCreatedDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

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
  "Documents Verified": { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  "Visa Rejected": { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Completed: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
};

export function ApplicationTableContainer({
  applications,
  onDeleteApplication,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  paginationLabel,
}: ApplicationTableContainerProps) {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  const handleRowDelete = async (app: ApplicationRow) => {
    if (!onDeleteApplication) return;
    if (!window.confirm(`Delete the application for "${app.studentName}"? It will be archived and hidden from the list.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await onDeleteApplication(app.id);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: DataTableColumn<ApplicationRow>[] = [
    {
      id: "student",
      header: "Student",
      minWidth: 270,
      render: (app) => (
        <Stack spacing={0.125}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
            {app.studentName}
          </Typography>
          <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
            {app.email}
          </Typography>
        </Stack>
      ),
    },
    { id: "country", header: "Country", minWidth: 100, render: (a) => <TextCell value={a.targetCountry} /> },
    { id: "university", header: "University", minWidth: 120, render: (a) => <TextCell value={a.targetUniversity} /> },
    { id: "course", header: "Course", minWidth: 120, render: (a) => <TextCell value={a.course} /> },
    {
      id: "stage",
      header: "Stage",
      minWidth: 120,
      render: (a) => <Chip label={a.stage} size="small" sx={{ ...(stageStyles[a.stage] || {}) }} />,
    },
    {
      id: "created",
      header: "Created Date",
      minWidth: 120,
      render: (a) => (
        <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
          {formatCreatedDate(a.createdAt)}
        </Typography>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "right",
      render: (app) => (
        <Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end" }}>
          <IconButton
            aria-label={`Delete ${app.studentName}`}
            disabled={actionLoading || !onDeleteApplication}
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
            onClick={() => handleRowDelete(app)}
          >
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={applications}
      getRowKey={(a) => a.id}
      page={page}
      pageCount={pageCount}
      paginationLabel={paginationLabel}
      onPageChange={onPageChange}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="No applications found."
      minWidth={820}
      onRowClick={(app) => navigate(`/applications/${app.id}`)}
    />
  );
}
