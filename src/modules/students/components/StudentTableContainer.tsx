import { Chip, Stack, Typography } from "@mui/material";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  highestDegree: string;
  counsellor: string;
  fromLead: boolean;
  enrolledAt: string;
};

type StudentTableContainerProps = {
  students: StudentRow[];
  /** Opens the student's detail page. */
  onRowClick?: (student: StudentRow) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  pageCount: number;
  paginationLabel: string;
};

/** Plain text cell matching the Leads and Applications tables, with an em-dash fallback. */
function TextCell({ value }: { value?: string }) {
  return (
    <Typography noWrap sx={{ fontSize: 12.5 }} variant="body2">
      {value || "—"}
    </Typography>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

/**
 * Green for a student who arrived through the lead pipeline, neutral for one created
 * directly — the same green the Enrolled lead stage uses, so the two views agree.
 */
const originStyles = {
  lead: { backgroundColor: "#E1F5EC", color: "#0B7A57" },
  direct: { backgroundColor: "#EEF2F6", color: "#55707C" },
};

export function StudentTableContainer({
  students,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  paginationLabel,
}: StudentTableContainerProps) {
  const columns: DataTableColumn<StudentRow>[] = [
    {
      id: "student",
      header: "Student",
      minWidth: 250,
      render: (student) => (
        <Stack spacing={0.125}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
            {student.name}
          </Typography>
          <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
            {student.email || "—"}
          </Typography>
        </Stack>
      ),
    },
    { id: "phone", header: "Phone", minWidth: 130, render: (s) => <TextCell value={s.phone} /> },
    { id: "nationality", header: "Nationality", minWidth: 110, render: (s) => <TextCell value={s.nationality} /> },
    { id: "degree", header: "Highest Degree", minWidth: 140, render: (s) => <TextCell value={s.highestDegree} /> },
    { id: "counsellor", header: "Counsellor", minWidth: 150, render: (s) => <TextCell value={s.counsellor} /> },
    {
      id: "origin",
      header: "Origin",
      minWidth: 120,
      render: (s) => (
        <Chip
          label={s.fromLead ? "Enrolled lead" : "Direct"}
          size="small"
          sx={s.fromLead ? originStyles.lead : originStyles.direct}
        />
      ),
    },
    {
      id: "enrolled",
      header: "Enrolled",
      minWidth: 110,
      render: (s) => (
        <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
          {formatDate(s.enrolledAt)}
        </Typography>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="No students yet. Move a lead to the Enrolled stage to create one."
      getRowKey={(student) => student.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      paginationLabel={paginationLabel}
      rows={students}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
    />
  );
}
