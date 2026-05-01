import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";
import type {
  Activity,
  ActivityStatus,
  ActivityType,
  BoardTask,
  TaskCardLabel,
  TaskColumnKey,
  TaskPriority,
  TaskStatus,
} from "@/modules/activities/types/types";

const ALL_AGENTS_SENTINEL = "all";

export const ACTIVITY_ALL_AGENTS_OPTION_ID = ALL_AGENTS_SENTINEL;

export type ActivityEntityType = "LEAD" | "STUDENT" | "APPLICATION" | "GENERAL";

export interface ActivityAgentOptionDto {
  id: string;
  name: string;
  role?: string;
}

export interface BackendActorDto {
  id?: string;
  name?: string;
  role?: string;
}

export interface BackendActivityDto {
  activityAt?: string;
  activityType?: ActivityType;
  createdAt?: string;
  durationMinutes?: number | null;
  entityId?: string | null;
  entityName?: string | null;
  entityType?: ActivityEntityType;
  id: string;
  nextFollowupAt?: string | null;
  outcomeNotes?: string | null;
  performedBy?: BackendActorDto | null;
  source?: "MANUAL" | "SYSTEM" | string;
}

export interface BackendPageResponse<T> {
  content?: T[];
  first?: boolean;
  last?: boolean;
  number?: number;
  numberOfElements?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface ActivityItemDto {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  occurredAt: string;
  agent: ActivityAgentOptionDto;
  durationMinutes?: number;
  category?: string;
  sourceTaskId?: string;
}

export interface GetActivityFeedParams {
  agentId?: string;
  before?: string | null;
  entityType?: ActivityEntityType;
  limit?: number;
}

export interface GetActivityFeedResponse {
  hasMore: boolean;
  items: ActivityItemDto[];
  nextCursor: string | null;
}

export interface GetTimelineParams {
  page?: number;
  size?: number;
}

export interface CreateActivityRequest {
  activityAt?: string;
  activityType: ActivityType;
  durationMinutes?: number | null;
  entityId?: string | null;
  entityType: ActivityEntityType;
  nextFollowupAt?: string | null;
  outcomeNotes?: string;
  studentId?: string | null;
}

export type CreateActivityResponse = BackendActivityDto;

export interface BackendTaskDto {
  applicationId?: string | null;
  assignedTo?: BackendActorDto | null;
  childTask?: Pick<BackendTaskDto, "dueDate" | "id" | "status"> | null;
  completedAt?: string | null;
  completionNote?: string | null;
  createdAt?: string;
  createdBy?: BackendActorDto | null;
  description?: string | null;
  dueDate: string;
  entityType?: ActivityEntityType;
  id: string;
  leadId?: string | null;
  parentTaskId?: string | null;
  priority: TaskPriority;
  rescheduleCount?: number;
  rescheduleReason?: string | null;
  status: TaskStatus;
  studentId?: string | null;
  title: string;
}

export interface CreateTaskRequest {
  applicationId?: string | null;
  assignedToId?: string | null;
  description?: string;
  dueDate: string;
  entityType: Extract<ActivityEntityType, "LEAD" | "GENERAL">;
  leadId?: string | null;
  priority: TaskPriority;
  studentId?: string | null;
  title: string;
}

export type CreateTaskResponse = BackendTaskDto;

export interface BackendTaskSummaryDto {
  completed?: number;
  dueToday?: number;
  inProgress?: number;
  overdue?: number;
  pending?: number;
  total?: number;
}

export interface TaskNoteDto {
  author: string;
  authorAvatarUrl?: string;
  content: string;
  id: string;
  timeAgo: string;
}

export interface TaskAssignedAgentDto {
  avatarUrl?: string;
  id: string;
  name: string;
  role: string;
}

export interface TaskLinkedLeadDto {
  avatarUrl?: string;
  details: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  status: string;
}

export interface TaskBoardItemDto {
  assignedAgent: TaskAssignedAgentDto;
  column: TaskColumnKey;
  completionNote?: string;
  description: string;
  dueDate: string;
  id: string;
  label?: TaskCardLabel;
  linkedLead: TaskLinkedLeadDto;
  notes: TaskNoteDto[];
  priority: TaskPriority;
  progress?: number;
  status: TaskStatus;
  title: string;
}

export interface BackendTaskBoardResponse {
  dueToday?: BackendTaskDto[];
  inProgress?: BackendTaskDto[];
  overdue?: BackendTaskDto[];
  todo?: BackendTaskDto[];
  upcoming?: BackendTaskDto[];
}

export interface GetTaskBoardParams {
  agentId?: string;
  priority?: TaskPriority;
}

export interface GetTaskBoardResponse {
  availableAgents: ActivityAgentOptionDto[];
  availablePriorities: TaskPriority[];
  filters: {
    agentId: string | null;
    priority: TaskPriority | null;
  };
  tasks: TaskBoardItemDto[];
}

export interface GetTaskDetailsResponse {
  task: TaskBoardItemDto;
}

export interface CompleteTaskRequest {
  completionNote: string;
}

export type CompleteTaskResponse = BackendTaskDto;

export interface CancelTaskRequest {
  reason: string;
}

export interface RescheduleTaskRequest {
  assignedToId?: string | null;
  newDueDate: string;
  reason: string;
}

export interface ReassignTaskRequest {
  assignedToId: string;
}

export type UpdateTaskResponse = BackendTaskDto;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "URGENT";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "DONE" ||
    value === "CANCELLED" ||
    value === "SUPERSEDED"
  );
}

function isActivityType(value: unknown): value is ActivityType {
  return (
    value === "CALL" ||
    value === "MEETING" ||
    value === "WHATSAPP" ||
    value === "EMAIL" ||
    value === "NOTE" ||
    value === "DOCUMENT"
  );
}

function toActivityItemsResponse(data: unknown): GetActivityFeedResponse {
  if (Array.isArray(data)) {
    return {
      hasMore: false,
      items: data.map(normalizeBackendActivity).map(mapBackendActivityToItem),
      nextCursor: null,
    };
  }

  if (!isRecord(data)) {
    return { hasMore: false, items: [], nextCursor: null };
  }

  const wrappedItems = Array.isArray(data.items) ? data.items : undefined;
  const pageItems = Array.isArray(data.content) ? data.content : undefined;
  const items = wrappedItems ?? pageItems ?? [];
  const hasMore =
    typeof data.hasMore === "boolean"
      ? data.hasMore
      : typeof data.last === "boolean"
        ? !data.last
        : false;

  return {
    hasMore,
    items: items.map(normalizeBackendActivity).map(mapBackendActivityToItem),
    nextCursor: asNullableString(data.nextCursor),
  };
}

function normalizeBackendActor(value: unknown): BackendActorDto | null {
  if (!isRecord(value)) return null;

  return {
    id: asString(value.id),
    name: asString(value.name),
    role: asString(value.role),
  };
}

function normalizeBackendActivity(value: unknown): BackendActivityDto {
  const source = isRecord(value) ? value : {};

  return {
    activityAt: asString(source.activityAt) || undefined,
    activityType: isActivityType(source.activityType) ? source.activityType : "NOTE",
    createdAt: asString(source.createdAt) || undefined,
    durationMinutes: asNumber(source.durationMinutes) ?? null,
    entityId: asNullableString(source.entityId),
    entityName: asNullableString(source.entityName),
    entityType: asString(source.entityType) as ActivityEntityType,
    id: asString(source.id),
    nextFollowupAt: asNullableString(source.nextFollowupAt),
    outcomeNotes: asNullableString(source.outcomeNotes),
    performedBy: normalizeBackendActor(source.performedBy),
    source: asString(source.source),
  };
}

function normalizeTask(value: unknown): BackendTaskDto {
  const source = isRecord(value) ? value : {};
  const dueDate = asString(source.dueDate) || new Date().toISOString().slice(0, 10);

  return {
    applicationId: asNullableString(source.applicationId),
    assignedTo: normalizeBackendActor(source.assignedTo),
    completedAt: asNullableString(source.completedAt),
    completionNote: asNullableString(source.completionNote),
    createdAt: asString(source.createdAt) || undefined,
    createdBy: normalizeBackendActor(source.createdBy),
    description: asNullableString(source.description),
    dueDate,
    entityType: asString(source.entityType) as ActivityEntityType,
    id: asString(source.id),
    leadId: asNullableString(source.leadId),
    parentTaskId: asNullableString(source.parentTaskId),
    priority: isTaskPriority(source.priority) ? source.priority : "MEDIUM",
    rescheduleCount: asNumber(source.rescheduleCount),
    rescheduleReason: asNullableString(source.rescheduleReason),
    status: isTaskStatus(source.status) ? source.status : "PENDING",
    studentId: asNullableString(source.studentId),
    title: asString(source.title, "Untitled task"),
  };
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getActivityStatus(activity: BackendActivityDto): ActivityStatus {
  if (activity.source === "SYSTEM") return "Internal";
  if (activity.activityType === "MEETING") return "Scheduled";
  if (activity.activityType === "CALL") return "Completed";
  if (activity.activityType === "EMAIL" || activity.activityType === "WHATSAPP") return "Sent";
  return "Internal";
}

function mapBackendActivityToItem(activity: BackendActivityDto): ActivityItemDto {
  const type = activity.activityType ?? "NOTE";
  const actor = activity.performedBy;

  return {
    id: activity.id,
    type,
    title: activity.entityName ? `${titleCase(type)} - ${activity.entityName}` : titleCase(type),
    description: activity.outcomeNotes?.trim() || "No activity notes recorded.",
    status: getActivityStatus(activity),
    occurredAt: activity.activityAt ?? activity.createdAt ?? new Date().toISOString(),
    agent: {
      id: actor?.id ?? "",
      name: actor?.name ?? "Unassigned",
      role: actor?.role,
    },
    durationMinutes: activity.durationMinutes ?? undefined,
    category: activity.entityType,
  };
}

function getTaskColumn(task: BackendTaskDto, bucket?: keyof BackendTaskBoardResponse): TaskColumnKey {
  if (task.status === "DONE") return "done";
  if (task.status === "IN_PROGRESS") return "inProgress";
  if (bucket === "inProgress") return "inProgress";
  if (
    bucket === "todo" ||
    bucket === "upcoming" ||
    bucket === "overdue" ||
    bucket === "dueToday"
  ) {
    return "todo";
  }
  return "todo";
}

function getTaskLabel(task: BackendTaskDto, bucket?: keyof BackendTaskBoardResponse): TaskCardLabel | undefined {
  if (task.status === "DONE") return "COMPLETED";
  if (task.status === "IN_PROGRESS") return "IN PROGRESS";
  if (bucket === "overdue") return "OVERDUE";
  return undefined;
}

function getTaskProgress(task: BackendTaskDto) {
  if (task.status === "DONE") return 100;
  if (task.status === "IN_PROGRESS") return 50;
  return undefined;
}

function mapBackendTaskToBoardItem(
  task: BackendTaskDto,
  bucket?: keyof BackendTaskBoardResponse,
): TaskBoardItemDto {
  const assignedTo = task.assignedTo;
  const leadId = task.leadId ?? "";

  return {
    id: task.id,
    column: getTaskColumn(task, bucket),
    completionNote: task.completionNote ?? undefined,
    description: task.description?.trim() || "No task description provided.",
    dueDate: task.dueDate,
    label: getTaskLabel(task, bucket),
    priority: task.priority,
    progress: getTaskProgress(task),
    status: task.status,
    title: task.title,
    assignedAgent: {
      id: assignedTo?.id ?? "",
      name: assignedTo?.name ?? "Unassigned",
      role: assignedTo?.role ?? "Agent",
    },
    linkedLead: {
      id: leadId,
      name: leadId ? `Lead ${leadId}` : "No linked lead",
      details: task.entityType ? titleCase(task.entityType) : "General task",
      email: "",
      phone: "",
      status: task.status,
    },
    notes: task.completionNote
      ? [
          {
            id: `${task.id}-completion`,
            author: assignedTo?.name ?? "Agent",
            content: task.completionNote,
            timeAgo: task.completedAt ? new Date(task.completedAt).toLocaleString() : "Completed",
          },
        ]
      : [],
  };
}

function mapTaskDtoToModel(task: TaskBoardItemDto): BoardTask {
  return {
    id: task.id,
    column: task.column,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    label: task.label,
    progress: task.progress,
    completionNote: task.completionNote,
    status: task.status,
    assignedAgent: {
      name: task.assignedAgent.name,
      role: task.assignedAgent.role,
      avatarUrl: task.assignedAgent.avatarUrl,
    },
    linkedLead: {
      name: task.linkedLead.name,
      details: task.linkedLead.details,
      email: task.linkedLead.email,
      phone: task.linkedLead.phone,
      status: task.linkedLead.status,
      avatarUrl: task.linkedLead.avatarUrl,
    },
    notes: task.notes.map((note) => ({
      id: note.id,
      author: note.author,
      timeAgo: note.timeAgo,
      content: note.content,
      avatarUrl: note.authorAvatarUrl,
    })),
  };
}

function mapActivityDtoToModel(activity: ActivityItemDto): Activity {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    status: activity.status,
    timestamp: activity.occurredAt,
    sourceTaskId: activity.sourceTaskId,
    agent: activity.agent.name,
    duration: activity.durationMinutes,
    category: activity.category,
  };
}

function buildAgentOptions(tasks: TaskBoardItemDto[]): ActivityAgentOptionDto[] {
  const agents = new Map<string, ActivityAgentOptionDto>();

  tasks.forEach((task) => {
    if (!task.assignedAgent.id) return;
    agents.set(task.assignedAgent.id, {
      id: task.assignedAgent.id,
      name: task.assignedAgent.name,
      role: task.assignedAgent.role,
    });
  });

  return [
    { id: ACTIVITY_ALL_AGENTS_OPTION_ID, name: "All Agents" },
    ...Array.from(agents.values()).sort((left, right) => left.name.localeCompare(right.name)),
  ];
}

export const activityService = {
  apiConfig: {
    activityFeed: API_CONFIG.activities,
    logActivity: API_CONFIG.activities,
    taskBoard: `${API_CONFIG.tasks}/board`,
    createTask: API_CONFIG.tasks,
    taskDetails: (taskId: string) => `${API_CONFIG.tasks}/${taskId}`,
    taskSummary: `${API_CONFIG.tasks}/summary`,
    overdueCount: `${API_CONFIG.tasks}/overdue-count`,
    updateTaskStatus: (taskId: string) => `${API_CONFIG.tasks}/${taskId}/status`,
    completeTask: (taskId: string) => `${API_CONFIG.tasks}/${taskId}/complete`,
    cancelTask: (taskId: string) => `${API_CONFIG.tasks}/${taskId}/cancel`,
    rescheduleTask: (taskId: string) => `${API_CONFIG.tasks}/${taskId}/reschedule`,
    reassignTask: (taskId: string) => `${API_CONFIG.tasks}/${taskId}/assign`,
    leadTimeline: (leadId: string) => `${API_CONFIG.activities}/lead/${leadId}`,
    studentTimeline: (studentId: string) => `${API_CONFIG.activities}/student/${studentId}`,
    applicationTimeline: (applicationId: string) => `${API_CONFIG.activities}/application/${applicationId}`,
  },

  async getActivityFeed(params: GetActivityFeedParams = {}): Promise<GetActivityFeedResponse> {
    const queryParams = {
      agentId:
        params.agentId && params.agentId !== ACTIVITY_ALL_AGENTS_OPTION_ID
          ? params.agentId
          : undefined,
      before: params.before ?? undefined,
      entityType: params.entityType,
      limit: params.limit ?? 25,
    };
    const { data } = await httpClient.get<unknown>(API_CONFIG.activities, { params: queryParams });

    return toActivityItemsResponse(data);
  },

  async getLeadTimeline(
    leadId: string,
    params: GetTimelineParams = {},
  ): Promise<GetActivityFeedResponse> {
    const { data } = await httpClient.get<unknown>(`${API_CONFIG.activities}/lead/${leadId}`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    });
    return toActivityItemsResponse(data);
  },

  async getStudentTimeline(
    studentId: string,
    params: GetTimelineParams = {},
  ): Promise<GetActivityFeedResponse> {
    const { data } = await httpClient.get<unknown>(`${API_CONFIG.activities}/student/${studentId}`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    });
    return toActivityItemsResponse(data);
  },

  async getApplicationTimeline(
    applicationId: string,
    params: GetTimelineParams = {},
  ): Promise<GetActivityFeedResponse> {
    const { data } = await httpClient.get<unknown>(`${API_CONFIG.activities}/application/${applicationId}`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    });
    return toActivityItemsResponse(data);
  },

  async createActivity(request: CreateActivityRequest): Promise<CreateActivityResponse> {
    const { data } = await httpClient.post<unknown>(API_CONFIG.activities, request);
    return normalizeBackendActivity(data);
  },

  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const { data } = await httpClient.post<unknown>(API_CONFIG.tasks, request);
    return normalizeTask(data);
  },

  async getTaskBoard(params: GetTaskBoardParams = {}): Promise<GetTaskBoardResponse> {
    const { data } = await httpClient.get<BackendTaskBoardResponse>(`${API_CONFIG.tasks}/board`);
    const tasks = [
      ...(data.overdue ?? []).map((task) => mapBackendTaskToBoardItem(normalizeTask(task), "overdue")),
      ...(data.todo ?? []).map((task) => mapBackendTaskToBoardItem(normalizeTask(task), "todo")),
      ...(data.inProgress ?? []).map((task) =>
        mapBackendTaskToBoardItem(normalizeTask(task), "inProgress"),
      ),
      ...(data.dueToday ?? []).map((task) => mapBackendTaskToBoardItem(normalizeTask(task), "dueToday")),
      ...(data.upcoming ?? []).map((task) => mapBackendTaskToBoardItem(normalizeTask(task), "upcoming")),
    ].filter((task) => {
      const agentMatches =
        !params.agentId ||
        params.agentId === ACTIVITY_ALL_AGENTS_OPTION_ID ||
        task.assignedAgent.id === params.agentId;
      const priorityMatches = !params.priority || task.priority === params.priority;
      return agentMatches && priorityMatches;
    });

    return {
      availableAgents: buildAgentOptions(tasks),
      availablePriorities: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      filters: {
        agentId:
          params.agentId && params.agentId !== ACTIVITY_ALL_AGENTS_OPTION_ID ? params.agentId : null,
        priority: params.priority ?? null,
      },
      tasks,
    };
  },

  async getTaskDetails(taskId: string): Promise<GetTaskDetailsResponse> {
    const { data } = await httpClient.get<unknown>(`${API_CONFIG.tasks}/${taskId}`);
    return {
      task: mapBackendTaskToBoardItem(normalizeTask(data)),
    };
  },

  async getTeamTasks(params: GetTimelineParams = {}): Promise<BackendPageResponse<BackendTaskDto>> {
    const { data } = await httpClient.get<BackendPageResponse<unknown>>(`${API_CONFIG.tasks}/team`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });

    return {
      ...data,
      content: (data.content ?? []).map(normalizeTask),
    };
  },

  async getTaskSummary(): Promise<BackendTaskSummaryDto> {
    const { data } = await httpClient.get<BackendTaskSummaryDto>(`${API_CONFIG.tasks}/summary`);
    return data;
  },

  async getOverdueCount(): Promise<number> {
    const { data } = await httpClient.get<unknown>(`${API_CONFIG.tasks}/overdue-count`);
    if (typeof data === "number" && Number.isFinite(data)) return data;
    if (isRecord(data)) {
      const count = data.count ?? data.overdueCount ?? data.value;
      if (typeof count === "number" && Number.isFinite(count)) return count;
    }
    return 0;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<UpdateTaskResponse> {
    const { data } = await httpClient.patch<unknown>(`${API_CONFIG.tasks}/${taskId}/status`, null, {
      params: { status },
    });
    return normalizeTask(data);
  },

  async completeTask(taskId: string, request: CompleteTaskRequest): Promise<CompleteTaskResponse> {
    const { data } = await httpClient.patch<unknown>(
      `${API_CONFIG.tasks}/${taskId}/complete`,
      request,
    );
    return normalizeTask(data);
  },

  async cancelTask(taskId: string, request: CancelTaskRequest): Promise<UpdateTaskResponse> {
    const { data } = await httpClient.patch<unknown>(`${API_CONFIG.tasks}/${taskId}/cancel`, request);
    return normalizeTask(data);
  },

  async rescheduleTask(taskId: string, request: RescheduleTaskRequest): Promise<UpdateTaskResponse> {
    const { data } = await httpClient.patch<unknown>(
      `${API_CONFIG.tasks}/${taskId}/reschedule`,
      request,
    );
    return normalizeTask(data);
  },

  async reassignTask(taskId: string, request: ReassignTaskRequest): Promise<UpdateTaskResponse> {
    const { data } = await httpClient.patch<unknown>(`${API_CONFIG.tasks}/${taskId}/assign`, request);
    return normalizeTask(data);
  },

  mapActivityDtoToModel,
  mapTaskDtoToModel,
};

export type TaskDetailsDto = GetTaskDetailsResponse;
