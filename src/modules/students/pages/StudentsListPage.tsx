import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import {
  ApplicationQuickFilters as QuickFilters,
  type ApplicationQuickFilterTab as QuickFilterTab,
} from "@/modules/applications/components/ApplicationQuickFilters";
import {
  StudentTableContainer,
  type StudentRow,
} from "@/modules/students/components/StudentTableContainer";
import { studentsApi, type BackendStudent } from "@/modules/students/studentsApi";
import { usersService } from "@/modules/settings/usersService";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const quickFilterDefinitions = [
  { key: "all", label: "All" },
  { key: "lead", label: "Enrolled leads" },
  { key: "direct", label: "Direct" },
];

function mapBackendStudentToRow(
  student: BackendStudent,
  counsellorNames: Map<string, string>,
): StudentRow {
  const name = [student.firstName, student.lastName].filter(Boolean).join(" ").trim();

  return {
    id: student.id,
    name: name || student.email || "—",
    email: student.email ?? "",
    phone: student.phone ?? "",
    nationality: student.nationality ?? "",
    highestDegree: student.highestDegree ?? "",
    // Falls back to an em-dash when the viewer cannot list users (no USER_VIEW).
    counsellor: (student.assignedTo && counsellorNames.get(student.assignedTo)) || "",
    fromLead: Boolean(student.leadId),
    enrolledAt: student.enrolledAt ?? "",
  };
}

export function StudentsListPage() {
  const { hasPermissions, tenant } = useAuth();
  const tenantId = tenant?.tenantId ?? "";
  const canViewUsers = hasPermissions([PERMISSIONS.USERS_VIEW]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    data: backendStudents = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getStudents,
  });

  // Only for turning assignedTo ids into names; the page still works without it.
  const { data: users = [] } = useQuery({
    enabled: Boolean(tenantId) && canViewUsers,
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const counsellorNames = useMemo(
    () => new Map(users.map((user) => [user.id, user.name])),
    [users],
  );

  const studentRows: StudentRow[] = useMemo(
    () => backendStudents.map((student) => mapBackendStudentToRow(student, counsellorNames)),
    [backendStudents, counsellorNames],
  );

  const quickFilterTabs: QuickFilterTab[] = useMemo(
    () =>
      quickFilterDefinitions.map((tab) => ({
        ...tab,
        count:
          tab.key === "all"
            ? studentRows.length
            : studentRows.filter((student) => (student.fromLead ? "lead" : "direct") === tab.key)
                .length,
      })),
    [studentRows],
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredRows = useMemo(
    () =>
      studentRows.filter((student) => {
        if (
          activeQuickFilter !== "all" &&
          (student.fromLead ? "lead" : "direct") !== activeQuickFilter
        ) {
          return false;
        }
        if (query) {
          const haystack =
            `${student.name} ${student.email} ${student.phone} ${student.counsellor}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      }),
    [studentRows, activeQuickFilter, query],
  );

  const visibleCount = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  const pageStart = visibleCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = visibleCount === 0 ? 0 : Math.min(clampedPage * pageSize, visibleCount);
  const paginationLabel =
    visibleCount === 0
      ? "Showing 0 of 0 students"
      : `Showing ${pageStart}-${pageEnd} of ${visibleCount} students`;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleQuickFilterChange = (key: string) => {
    setActiveQuickFilter(key);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, pageCount)));
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (nextPageSize === pageSize) return;
    setPageSize(nextPageSize);
    setPage(1);
  };

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
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexShrink: 0,
          px: { xs: 1.5, md: 2 },
          py: { xs: 1, md: 1 },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <QuickFilters
              activeKey={activeQuickFilter}
              tabs={quickFilterTabs}
              onChange={handleQuickFilterChange}
            />
          </Box>

          <GlobalSearchBar
            placeholder="Search name, email, phone…"
            value={searchQuery}
            onSearch={handleSearchChange}
            sx={{
              flexShrink: 0,
              width: { xs: 150, sm: 200, md: 240 },
              "& .MuiOutlinedInput-root": { boxShadow: "none", height: 38 },
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          bgcolor: "#fcfdff",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: 2.25,
          minHeight: 0,
          pb: { xs: 1, md: 2 },
          pt: { xs: 2, md: 2 },
          px: { xs: 2, md: 2 },
        }}
      >
        {isLoading ? (
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
            page={clampedPage}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            paginationLabel={paginationLabel}
            students={pagedRows}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Box>
    </Paper>
  );
}
