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
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
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
  "Documents Verified": { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  "Visa Rejected": { backgroundColor: "#FBE5E5", color: "#C0392F" },
  Completed: { backgroundColor: "#DEF1F0", color: "#0B6B6B" },
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
  { id: "country", header: "Country", minWidth: 100, render: (a) => a.targetCountry },
  { id: "university", header: "University", minWidth: 120, render: (a) => a.targetUniversity },
  { id: "course", header: "Course", minWidth: 120, render: (a) => a.course },
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
    render: (a) => new Date(a.createdAt).toLocaleDateString(),
  },
  {
    id: "action",
    header: "Action",
    align: "right",
    render: (app) => (
      <Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end" }}>
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
        >
          <DeleteOutlineRounded fontSize="small" />
        </IconButton>
      </Stack>
    ),
  },
];

export function ApplicationTableContainer({
  applications,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  paginationLabel,
}: ApplicationTableContainerProps) {
  const navigate = useNavigate();
  return (
    <DataTable
      columns={columns}
      rows={applications}
      getRowKey={(a) => a.id}
      page={page}
      pageCount={pageCount}
      paginationLabel={paginationLabel}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="No applications found."
      onRowClick={(app) => navigate(`/applications/${app.id}`)}
    />
  );
}
