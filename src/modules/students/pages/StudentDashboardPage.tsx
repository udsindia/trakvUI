import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import {
  StudentTableContainer,
  type StudentRow,
} from "@/modules/students/components/StudentTableContainer";
import { studentsApi, type BackendStudentSummary } from "@/modules/students/studentsApi";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function mapBackendStudentToRow(student: BackendStudentSummary): StudentRow {
  const name = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
  return {
    id: student.id,
    name: name || student.email || "—",
    email: student.email ?? "",
    phone: student.phone ?? "",
    nationality: student.nationality ?? "",
    highestDegree: student.highestDegree ?? "",
    enrolledAt: student.enrolledAt ?? "",
  };
}

export function StudentDashboardPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    data: studentsPage,
    isLoading,
    isError,
  } = useQuery({
    // Backend paginates; it exposes no search or sort params yet, so the table
    // shows exactly the page the server returns.
    queryKey: ["students", "paginated", page, pageSize],
    queryFn: () => studentsApi.getStudentsPaginated({ page: page - 1, size: pageSize }),
    placeholderData: (previousData) => previousData,
  });

  const rows: StudentRow[] = useMemo(
    () => (studentsPage?.content ?? []).map(mapBackendStudentToRow),
    [studentsPage],
  );

  const totalVisible = studentsPage?.totalElements ?? 0;
  const pageCount = Math.max(1, studentsPage?.totalPages ?? 1);
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pageStart = totalVisible === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd =
    totalVisible === 0
      ? 0
      : Math.min(pageStart + (studentsPage?.numberOfElements ?? 0) - 1, totalVisible);
  const paginationLabel =
    totalVisible === 0
      ? "Showing 0 of 0 students"
      : `Showing ${pageStart}–${pageEnd} of ${totalVisible} students`;

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const normalizedPage = Math.max(1, Math.min(nextPage, pageCount));
      setPage((currentPage) => (currentPage === normalizedPage ? currentPage : normalizedPage));
    },
    [pageCount],
  );

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      if (nextPageSize === pageSize) return;
      setPageSize(nextPageSize);
      setPage(1);
    },
    [pageSize],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          bgcolor: "#fcfdff",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          pb: { xs: 1, md: 2 },
          px: { xs: 2, md: 2 },
          pt: { xs: 2, md: 2 },
        }}
      >
        {isLoading && !studentsPage ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}>
            <Typography color="error" variant="body2">
              Failed to load students.
            </Typography>
          </Box>
        ) : (
          <StudentTableContainer
            students={rows}
            page={clampedPage}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageCount={pageCount}
            paginationLabel={paginationLabel}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Box>
    </Paper>
  );
}
