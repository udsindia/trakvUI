import { Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/shared/components/DataTable";
import { studentRoutePaths } from "@/modules/students/studentRoutePaths";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  highestDegree: string;
  enrolledAt: string;
};

type StudentTableContainerProps = {
  students: StudentRow[];
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  pageCount: number;
  paginationLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function formatEnrolledAt(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

const columns: DataTableColumn<StudentRow>[] = [
  {
    id: "student",
    header: "Student",
    minWidth: 260,
    render: (student) => (
      <Stack spacing={0.125}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} variant="body2">
          {student.name}
        </Typography>
        <Typography color="text.disabled" sx={{ fontSize: 10.5 }} variant="caption">
          {student.email}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    minWidth: 130,
    render: (s) => (
      <Typography noWrap sx={{ fontSize: 12 }} variant="body2">
        {s.phone || "—"}
      </Typography>
    ),
  },
  {
    id: "nationality",
    header: "Nationality",
    minWidth: 120,
    render: (s) => s.nationality || "—",
  },
  {
    id: "degree",
    header: "Highest Degree",
    minWidth: 150,
    render: (s) => s.highestDegree || "—",
  },
  {
    id: "enrolled",
    header: "Enrolled",
    minWidth: 120,
    render: (s) => (
      <Typography color="text.disabled" noWrap sx={{ fontSize: 11.5 }} variant="body2">
        {formatEnrolledAt(s.enrolledAt)}
      </Typography>
    ),
  },
];

export function StudentTableContainer({
  students,
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  paginationLabel,
  onPageChange,
  onPageSizeChange,
}: StudentTableContainerProps) {
  const navigate = useNavigate();

  return (
    <DataTable
      columns={columns}
      rows={students}
      getRowKey={(s) => s.id}
      page={page}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      pageCount={pageCount}
      paginationLabel={paginationLabel}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="No students yet. Convert a lead to create one."
      minWidth={760}
      onRowClick={(student) => navigate(studentRoutePaths.details(student.id))}
    />
  );
}
