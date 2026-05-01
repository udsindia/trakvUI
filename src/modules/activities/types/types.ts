export type ActivityType =
  | "CALL"
  | "MEETING"
  | "WHATSAPP"
  | "EMAIL"
  | "NOTE"
  | "DOCUMENT";

export type ActivityStatus =
  | "Completed"
  | "Scheduled"
  | "Sent"
  | "Internal"
  | "Contract";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  timestamp: string;
  sourceTaskId?: string;
  agent: string;
  duration?: number;
  location?: string;
  contact?: string;
  subject?: string;
  category?: string;
  fileSize?: string;
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED" | "SUPERSEDED";

export interface AssignedAgent {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface LinkedLead {
  name: string;
  details: string;
  email: string;
  phone: string;
  status: string;
  avatarUrl?: string;
}

export interface TaskNote {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assignedAgent: AssignedAgent;
  linkedLead: LinkedLead;
  notes: TaskNote[];
}

export type ActivityFeedRange = "today" | "yesterday" | "thisWeek";

export type LoggableActivityType = Extract<
  ActivityType,
  "CALL" | "MEETING" | "WHATSAPP" | "EMAIL"
>;

export type TaskColumnKey = "todo" | "inProgress" | "done";

export type TaskCardLabel = "PINNED" | "OVERDUE" | "COMPLETED" | "IN PROGRESS";

export interface BoardTask extends Task {
  column: TaskColumnKey;
  label?: TaskCardLabel;
  progress?: number;
  completionNote?: string;
  status?: TaskStatus;
}

export interface ActivitySummaryMetric {
  key: string;
  label: string;
  type: Extract<ActivityType, "CALL" | "MEETING" | "WHATSAPP">;
  value: number;
}

export interface TaskColumnDefinition {
  key: TaskColumnKey;
  title: string;
}
