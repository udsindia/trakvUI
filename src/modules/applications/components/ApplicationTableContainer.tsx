import { useState, type MouseEvent } from "react";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import { applicationStageStyles } from "@/modules/applications/applicationStage";
import { applicationEditPath } from "@/modules/applications/applicationsRoutePaths";

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

  // Row actions sit inside a row that navigates on click, so each one has to stop the
  // event itself. Without this, cancelling the delete confirm still opened the
  // application, and confirming it deleted the row and then navigated to it.
  const stopRowClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handleRowEdit = (event: MouseEvent, app: ApplicationRow) => {
    stopRowClick(event);
    navigate(applicationEditPath(app.id));
  };

  const handleRowDelete = async (event: MouseEvent, app: ApplicationRow) => {
    stopRowClick(event);
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
      render: (a) => <Chip label={a.stage} size="small" sx={{ ...(applicationStageStyles[a.stage] || {}) }} />,
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
          <Tooltip title="Edit application">
            <IconButton
              aria-label={`Edit the application for ${app.studentName}`}
              disabled={actionLoading}
              size="small"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "7px",
                color: "text.secondary",
                height: 28,
                width: 28,
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
              onClick={(event) => handleRowEdit(event, app)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete application">
            <IconButton
              aria-label={`Delete the application for ${app.studentName}`}
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
              onClick={(event) => handleRowDelete(event, app)}
            >
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Tooltip>
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
