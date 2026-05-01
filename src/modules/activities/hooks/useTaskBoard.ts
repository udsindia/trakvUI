import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ACTIVITY_ALL_AGENTS_OPTION_ID,
  activityService,
  type CreateTaskRequest,
} from "@/modules/activities/activityService";
import type {
  BoardTask,
  TaskPriority,
} from "@/modules/activities/types/types";

type SaveTaskUpdatesInput = {
  dueDate: string;
  priority: TaskPriority;
  taskId: string;
};

type MarkTaskCompleteInput = {
  completionNote: string;
  taskId: string;
};

type CancelTaskInput = {
  reason: string;
  taskId: string;
};

type RescheduleTaskInput = {
  assignedToId?: string | null;
  newDueDate: string;
  reason: string;
  taskId: string;
};

type UseTaskBoardOptions = {
  selectedAgentId?: string;
  selectedPriority?: TaskPriority;
};

export function useTaskBoard({
  selectedAgentId = ACTIVITY_ALL_AGENTS_OPTION_ID,
  selectedPriority,
}: UseTaskBoardOptions) {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const taskBoardQuery = useQuery({
    queryKey: ["activities", "tasks", selectedAgentId, selectedPriority ?? "all"],
    queryFn: () =>
      activityService.getTaskBoard({
        agentId: selectedAgentId,
        priority: selectedPriority,
      }),
  });

  const tasks = useMemo(
    () => (taskBoardQuery.data?.tasks ?? []).map(activityService.mapTaskDtoToModel),
    [taskBoardQuery.data?.tasks],
  );

  const taskDetailsQuery = useQuery({
    enabled: Boolean(selectedTaskId),
    queryKey: ["activities", "tasks", "details", selectedTaskId],
    queryFn: () => activityService.getTaskDetails(selectedTaskId ?? ""),
  });

  const selectedTask = useMemo(
    () =>
      taskDetailsQuery.data
        ? activityService.mapTaskDtoToModel(taskDetailsQuery.data.task)
        : tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, taskDetailsQuery.data, tasks],
  );

  const closeTask = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const openTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const invalidateTaskQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["activities", "tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["activities", "feed"] }),
    ]);
  }, [queryClient]);

  const createTaskMutation = useMutation({
    mutationFn: (request: CreateTaskRequest) => activityService.createTask(request),
    onSuccess: invalidateTaskQueries,
  });

  const markTaskCompleteMutation = useMutation({
    mutationFn: ({ completionNote, taskId }: MarkTaskCompleteInput) =>
      activityService.completeTask(taskId, {
        completionNote,
      }),
    onSuccess: async (_, variables) => {
      await invalidateTaskQueries();
      await queryClient.invalidateQueries({
        queryKey: ["activities", "tasks", "details", variables.taskId],
      });
      closeTask();
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: (taskId: string) => activityService.updateTaskStatus(taskId, "IN_PROGRESS"),
    onSuccess: async (_, taskId) => {
      await invalidateTaskQueries();
      await queryClient.invalidateQueries({
        queryKey: ["activities", "tasks", "details", taskId],
      });
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: ({ reason, taskId }: CancelTaskInput) =>
      activityService.cancelTask(taskId, {
        reason,
      }),
    onSuccess: async (_, variables) => {
      await invalidateTaskQueries();
      await queryClient.invalidateQueries({
        queryKey: ["activities", "tasks", "details", variables.taskId],
      });
      closeTask();
    },
  });

  const rescheduleTaskMutation = useMutation({
    mutationFn: ({ assignedToId, newDueDate, reason, taskId }: RescheduleTaskInput) =>
      activityService.rescheduleTask(taskId, {
        assignedToId: assignedToId ?? null,
        newDueDate,
        reason,
      }),
    onSuccess: async (_, variables) => {
      await invalidateTaskQueries();
      await queryClient.invalidateQueries({
        queryKey: ["activities", "tasks", "details", variables.taskId],
      });
    },
  });

  const createTask = useCallback(
    async (request: CreateTaskRequest) => {
      await createTaskMutation.mutateAsync(request);
    },
    [createTaskMutation],
  );

  const saveTaskUpdates = useCallback(async (_input: SaveTaskUpdatesInput) => undefined, []);
  const addNote = useCallback(async (_taskId: string, _content: string) => undefined, []);

  const markTaskInProgress = useCallback(
    async (taskId: string) => {
      await startTaskMutation.mutateAsync(taskId);
    },
    [startTaskMutation],
  );

  const markTaskComplete = useCallback(
    async ({ completionNote, taskId }: MarkTaskCompleteInput) => {
      await markTaskCompleteMutation.mutateAsync({
        completionNote,
        taskId,
      });
    },
    [markTaskCompleteMutation],
  );

  const cancelTask = useCallback(
    async ({ reason, taskId }: CancelTaskInput) => {
      await cancelTaskMutation.mutateAsync({
        reason,
        taskId,
      });
    },
    [cancelTaskMutation],
  );

  const rescheduleTask = useCallback(
    async ({ assignedToId, newDueDate, reason, taskId }: RescheduleTaskInput) => {
      await rescheduleTaskMutation.mutateAsync({
        assignedToId,
        newDueDate,
        reason,
        taskId,
      });
    },
    [rescheduleTaskMutation],
  );

  const taskMutationError =
    markTaskCompleteMutation.error ??
    startTaskMutation.error ??
    cancelTaskMutation.error ??
    rescheduleTaskMutation.error;

  return {
    addNote,
    availableAgents:
      taskBoardQuery.data?.availableAgents ?? [
        { id: ACTIVITY_ALL_AGENTS_OPTION_ID, name: "All Agents" },
      ],
    cancelTask,
    closeTask,
    createTask,
    createTaskError: createTaskMutation.error,
    isAddingNote: false,
    isBoardError: taskBoardQuery.isError,
    isBoardLoading: taskBoardQuery.isLoading,
    isCancellingTask: cancelTaskMutation.isPending,
    isCompletingTask: markTaskCompleteMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
    isReschedulingTask: rescheduleTaskMutation.isPending,
    isSavingTask: false,
    isStartingTask: startTaskMutation.isPending,
    isTaskDetailsLoading: taskDetailsQuery.isFetching && !taskDetailsQuery.data,
    taskBoardError: taskBoardQuery.error,
    taskMutationError,
    markTaskComplete,
    markTaskInProgress,
    openTask,
    rescheduleTask,
    saveTaskUpdates,
    selectedTask,
    tasks,
  };
}
