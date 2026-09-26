import { Chip, Stack, Typography } from "@mui/material";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import { applicationStageStyles } from "@/modules/applications/applicationStage";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  /**
   * The stage the student's newest application has reached, already labelled by
   * applicationStageLabel. Empty when they have none, or when the viewer cannot see
   * applications at all — the two read the same in this column, which is why the
   * count below distinguishes them.
   */
  applicationStage: string;
  /** How many applications the student has; drives the "+N" suffix. */
  applicationCount: number;
  counsellor: string;
  /** Source of the lead this student converted from; empty when there was no lead. */
  leadSource: string;
  /**
   * Whether the student came through the lead pipeline. Not shown as its own column any
   * more — every student is expected to have been a lead first — but still what the
   * quick-filter tabs count, and what makes a sourceless row read as "Direct".
   */
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
    {
      id: "applicationStatus",
      header: "Application Status",
      minWidth: 170,
      render: (s) => {
        if (!s.applicationStage) {
          return (
            <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
              No application
            </Typography>
          );
        }
        return (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Chip
              label={s.applicationStage}
              size="small"
              sx={{ ...(applicationStageStyles[s.applicationStage] || {}) }}
            />
            {s.applicationCount > 1 ? (
              <Typography color="text.disabled" noWrap sx={{ fontSize: 11 }} variant="caption">
                +{s.applicationCount - 1}
              </Typography>
            ) : null}
          </Stack>
        );
      },
    },
    { id: "counsellor", header: "Counsellor", minWidth: 150, render: (s) => <TextCell value={s.counsellor} /> },
    {
      id: "leadSource",
      header: "Lead Source",
      minWidth: 140,
      // "Direct" only for a student with no lead at all. That should not happen — a
      // student is meant to arrive by converting a lead — so it reads as the exception
      // it is rather than being folded in with a lead whose source was left unset.
      render: (s) =>
        s.leadSource ? (
          <TextCell value={s.leadSource} />
        ) : (
          <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
            {s.fromLead ? "—" : "Direct"}
          </Typography>
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
