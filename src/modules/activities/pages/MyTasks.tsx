import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ACTIVITY_ALL_AGENTS_OPTION_ID, activityService } from "@/modules/activities/activityService";
import { TeamTaskSummary } from "@/modules/activities/components/TeamTaskSummary";
import { CreateTaskModal } from "@/modules/activities/components/CreateTaskModal";
import { TaskBoardColumn } from "@/modules/activities/components/TaskBoardColumn";
import { TaskTable } from "@/modules/activities/components/TaskTable";
import { TaskDetailsSidebar } from "@/modules/activities/components/TaskDetailsSidebar";
import { useTaskBoard } from "@/modules/activities/hooks/useTaskBoard";
import { taskColumnDefinitions } from "@/modules/activities/mock/mockData";
import { PageHeader } from "@/modules/lead/components/PageHeader";
import { leadApi } from "@/modules/lead/leadApi";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { studentsApi } from "@/modules/applications/studentsApi";
import { usersService } from "@/modules/settings/usersService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import type { TaskPriority } from "@/modules/activities/types/types";

const allPriorityValue = "all";

export function MyTasks() {
  const { hasPermission, tenant } = useAuth();
  const canCreateTask = hasPermission(PERMISSIONS.TASK_CREATE);
  // Without TASK_ASSIGN the task is the creator's own, so there is no team to fetch —
  // and a counsellor cannot read the team endpoint anyway, the same reason AddLeadPage
  // guards its own user query.
  const canAssignTask = hasPermission(PERMISSIONS.TASK_ASSIGN);
  const tenantId = tenant?.tenantId ?? "";
  const [selectedAgentId, setSelectedAgentId] = useState(ACTIVITY_ALL_AGENTS_OPTION_ID);
  const [selectedPriorityValue, setSelectedPriorityValue] = useState<string>(allPriorityValue);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  /**
   * Mine or the team's. Defaults to mine for everybody: an admin's own list is still the
   * one they act on, and the team view is a step out of it rather than the resting state.
   */
  const [scope, setScope] = useState<"mine" | "team">("mine");
  /** List by default: a board reads well at five tasks and not at fifty. */
  const [taskView, setTaskView] = useState<"table" | "board">("table");
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
    scope,
    selectedAgentId,
    selectedPriority:
      selectedPriorityValue === allPriorityValue
        ? undefined
        : (selectedPriorityValue as TaskPriority),
  });
  // All three only load once the dialog opens, and share the keys their own list pages
  // use, so a module already visited costs no extra request.
  const leadsQuery = useQuery({
    enabled: createTaskOpen,
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  const studentsQuery = useQuery({
    enabled: createTaskOpen,
    queryKey: ["students", "options"],
    queryFn: studentsApi.getStudents,
  });

  const applicationsQuery = useQuery({
    enabled: createTaskOpen,
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  // Shares the key AddLeadPage uses, so opening the task modal after the lead form costs
  // no second request.
  const assigneesQuery = useQuery({
    enabled: createTaskOpen && canAssignTask && Boolean(tenantId),
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  // Who is carrying what, across everyone this user is allowed to see. The server does the
  // scoping, so this is fetched for everybody and the panel hides itself when it comes back
  // with only the viewer in it.
  const summaryQuery = useQuery({
    queryKey: ["tasks", "summary"],
    queryFn: () => activityService.getTaskSummary(),
  });

  // More than one agent in the (server-scoped) summary means this user can see a team.
  const canSeeTeam = (summaryQuery.data?.agents ?? []).length > 1;

  const assigneeOptions = useMemo(
    () =>
      (assigneesQuery.data ?? [])
        .filter((user) => user.active)
        .map((user) => ({ id: user.id, name: user.name })),
    [assigneesQuery.data],
  );

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
          }}
        >
          <PageHeader
            actions={
              <Stack
                direction={{ xs: "column", sm: "row", lg: "row" }}
                spacing={1.25}
                sx={{
                  alignItems: { xs: "stretch", sm: "center" },
                  width: { xs: "100%", lg: "auto" },
                }}
              >
                {/*
                  Only offered to somebody who can actually see other people. The summary
                  is scoped by the server, so more than one agent in it means there is a
                  team to look at; for a lone counsellor the toggle would be two names for
                  the same list.
                */}
                {canSeeTeam ? (
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={scope}
                    onChange={(_event, next) => {
                      if (next) setScope(next);
                    }}
                  >
                    <ToggleButton sx={{ textTransform: "none", px: 1.5 }} value="mine">
                      My tasks
                    </ToggleButton>
                    <ToggleButton sx={{ textTransform: "none", px: 1.5 }} value="team">
                      Team tasks
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : null}

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

                {canCreateTask ? (
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
                ) : null}
              </Stack>
            }
            subtitle=""
            title="My Tasks"
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
          {/*
            Above the board, because it is the question you ask first: who is carrying what.

            Deliberately not clickable. The board below is findBoardForUser — strictly your
            own tasks — so filtering it to another agent would always empty it. Drilling
            into someone else's tasks needs /api/tasks/team, which nothing calls yet.
          */}
          <TeamTaskSummary
            agents={summaryQuery.data?.agents ?? []}
            isError={summaryQuery.isError}
            isLoading={summaryQuery.isLoading}
          />

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
            <Box>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
              >
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={taskView}
                  onChange={(_event, next) => next && setTaskView(next)}
                >
                  <ToggleButton sx={{ px: 1.5, textTransform: "none" }} value="table">
                    List
                  </ToggleButton>
                  <ToggleButton sx={{ px: 1.5, textTransform: "none" }} value="board">
                    Board
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {taskView === "table" ? (
                <TaskTable showAssignee={scope !== "mine"} tasks={tasks} onTaskClick={openTask} />
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
                      onAddTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
                      onTaskClick={openTask}
                    />
                  ))}
                </Box>
              )}
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
        applications={applicationsQuery.data ?? []}
        assignees={assigneeOptions}
        canAssign={canAssignTask}
        isLoadingAssignees={assigneesQuery.isLoading}
        isLoadingLinks={
          leadsQuery.isLoading || studentsQuery.isLoading || applicationsQuery.isLoading
        }
        isSubmitting={isCreatingTask}
        leads={leadsQuery.data ?? []}
        open={createTaskOpen}
        students={studentsQuery.data ?? []}
        onClose={() => setCreateTaskOpen(false)}
        onSubmit={createTask}
      />
    </>
  );
}
