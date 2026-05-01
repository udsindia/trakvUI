import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { ACTIVITY_ALL_AGENTS_OPTION_ID } from "@/modules/activities/activityService";
import { CreateTaskModal } from "@/modules/activities/components/CreateTaskModal";
import { TaskBoardColumn } from "@/modules/activities/components/TaskBoardColumn";
import { TaskDetailsSidebar } from "@/modules/activities/components/TaskDetailsSidebar";
import { useTaskBoard } from "@/modules/activities/hooks/useTaskBoard";
import { taskColumnDefinitions } from "@/modules/activities/mock/mockData";
import { leadApi } from "@/modules/lead/leadApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import type { TaskPriority } from "@/modules/activities/types/types";

const allPriorityValue = "all";

export function MyTasks() {
  const [selectedAgentId, setSelectedAgentId] = useState(ACTIVITY_ALL_AGENTS_OPTION_ID);
  const [selectedPriorityValue, setSelectedPriorityValue] = useState<string>(allPriorityValue);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const {
    availableAgents,
    cancelTask,
    closeTask,
    createTask,
    createTaskError,
    isBoardError,
    isBoardLoading,
    isCancellingTask,
    isCompletingTask,
    isCreatingTask,
    isReschedulingTask,
    isStartingTask,
    isTaskDetailsLoading,
    markTaskComplete,
    markTaskInProgress,
    openTask,
    rescheduleTask,
    selectedTask,
    taskBoardError,
    taskMutationError,
    tasks,
  } = useTaskBoard({
    selectedAgentId,
    selectedPriority:
      selectedPriorityValue === allPriorityValue
        ? undefined
        : (selectedPriorityValue as TaskPriority),
  });
  const leadsQuery = useQuery({
    enabled: createTaskOpen,
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  const columns = useMemo(
    () =>
      taskColumnDefinitions.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.column === column.key),
      })),
    [tasks],
  );

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
            py: { xs: 2.5, sm: 3 },
          }}
        >
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 700 }} variant="h4">
              My Tasks
            </Typography>
            <Typography color="text.secondary" variant="body1">
              Manage and track your task progress
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row", lg: "row" }}
            spacing={1.25}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              width: { xs: "100%", lg: "auto" },
            }}
          >
            <TextField
              select
              size="small"
              sx={{ minWidth: { sm: 180 } }}
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.target.value)}
            >
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              sx={{ minWidth: { sm: 160 } }}
              value={selectedPriorityValue}
              onChange={(event) => setSelectedPriorityValue(event.target.value)}
            >
              {[
                { label: "All Priority", value: allPriorityValue },
                { label: "Urgent", value: "URGENT" },
                { label: "High", value: "HIGH" },
                { label: "Medium", value: "MEDIUM" },
                { label: "Low", value: "LOW" },
              ].map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                height: 40,
                minWidth: 128,
                px: 2.25,
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
              variant="contained"
              onClick={() => setCreateTaskOpen(true)}
            >
              Create Task
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
          {isBoardLoading ? (
            <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <CircularProgress size={32} />
            </Stack>
          ) : isBoardError ? (
            <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <Typography color="error" variant="body2">
                {getApiErrorMessage(taskBoardError, "Failed to load tasks. Please try again.")}
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              {columns.map((column) => (
                <TaskBoardColumn
                  key={column.key}
                  count={column.tasks.length}
                  tasks={column.tasks}
                  title={column.title}
                  onAddTask={() => setCreateTaskOpen(true)}
                  onTaskClick={openTask}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <TaskDetailsSidebar
        isCancellingTask={isCancellingTask}
        isCompletingTask={isCompletingTask}
        isLoading={isTaskDetailsLoading}
        isReschedulingTask={isReschedulingTask}
        isStartingTask={isStartingTask}
        open={Boolean(selectedTask)}
        submitErrorMessage={
          taskMutationError
            ? getApiErrorMessage(taskMutationError, "Unable to complete the task.")
            : null
        }
        task={selectedTask}
        onCancelTask={cancelTask}
        onClose={closeTask}
        onMarkComplete={markTaskComplete}
        onMarkInProgress={markTaskInProgress}
        onRescheduleTask={rescheduleTask}
      />

      <CreateTaskModal
        errorMessage={
          createTaskError ? getApiErrorMessage(createTaskError, "Unable to create task.") : null
        }
        isLoadingLeads={leadsQuery.isLoading}
        isSubmitting={isCreatingTask}
        leads={leadsQuery.data ?? []}
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSubmit={createTask}
      />
    </>
  );
}
