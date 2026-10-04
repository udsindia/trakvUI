import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import { EditEmployeeDialog } from "@/modules/employees/components/EditEmployeeDialog";
import { EmployeeTableContainer } from "@/modules/employees/components/EmployeeTableContainer";
import { employeesService } from "@/modules/employees/employeesService";
import type { EmployeeDeviceRow } from "@/modules/employees/employees.types";
import { GlobalSearchBar } from "@/shared/components/GlobalSearchBar";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const QUERY_KEY = ["employees", "devices"];

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState<EmployeeDeviceRow | null>(null);

  const {
    data: employees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: employeesService.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof employeesService.update>[1] }) =>
      employeesService.update(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditing(null);
    },
  });

  const query = searchQuery.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      employees.filter((employee) => {
        if (!query) return true;
        const haystack = `${employee.name} ${employee.phone} ${employee.email} ${employee.employeeCode}`.toLowerCase();
        return haystack.includes(query);
      }),
    [employees, query],
  );

  const visibleCount = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const clampedPage = Math.max(1, Math.min(page, pageCount));
  const pagedRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  const pageStart = visibleCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const pageEnd = visibleCount === 0 ? 0 : Math.min(clampedPage * pageSize, visibleCount);
  const paginationLabel =
    visibleCount === 0
      ? "Showing 0 of 0 employees"
      : `Showing ${pageStart}-${pageEnd} of ${visibleCount} employees`;

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        eyebrow="Settings · Employees"
        title="Employees"
        actions={
          <Button
            component={RouterLink}
            startIcon={<AddRounded />}
            sx={{ textTransform: "none" }}
            to={settingsRoutePaths.addUser}
            variant="contained"
            size="small"
          >
            Register Employee
          </Button>
        }
      />

      <GlobalSearchBar
        placeholder="Search name, phone, employee code…"
        value={searchQuery}
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        sx={{ width: { xs: "100%", sm: 320 } }}
      />

      {updateMutation.isError ? (
        <Alert severity="error">{getApiErrorMessage(updateMutation.error, "Could not save the change.")}</Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to load employees.</Alert>
      ) : (
        <EmployeeTableContainer
          page={clampedPage}
          pageCount={pageCount}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          paginationLabel={paginationLabel}
          rows={pagedRows}
          onEdit={setEditing}
          onPageChange={(nextPage) => setPage(Math.max(1, Math.min(nextPage, pageCount)))}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          onToggleCallRecordingSync={(employee) =>
            updateMutation.mutate({
              userId: employee.userId,
              payload: { callRecordingSyncEnabled: !employee.callRecordingSyncEnabled },
            })
          }
          onToggleLeadEnabled={(employee) =>
            updateMutation.mutate({
              userId: employee.userId,
              payload: { leadEnabled: !employee.leadEnabled },
            })
          }
        />
      )}

      <EditEmployeeDialog
        employee={editing}
        error={updateMutation.isError ? getApiErrorMessage(updateMutation.error, "Could not save the change.") : undefined}
        saving={updateMutation.isPending}
        onCancel={() => setEditing(null)}
        onSave={(values) =>
          editing &&
          updateMutation.mutate({
            userId: editing.userId,
            payload: values,
          })
        }
      />
    </Stack>
  );
}
