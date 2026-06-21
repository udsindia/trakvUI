import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";

export type DashboardKpiCardKey =
  | "REVENUE_RECEIVED"
  | "NEW_LEADS"
  | "OVERDUE_TASKS"
  | "CONVERSION_RATE"
  | "ACTIVE_APPLICATIONS"
  | "DOC_CHECK"
  | "OFFERS_RECEIVED"
  | "VISA_APPLIED"
  | "TASKS_DUE_TODAY"
  | "QUALIFIED_THIS_WEEK"
  | "ACTIVE_STUDENTS"
  | "COMMISSION_PENDING"
  | string;

export type DashboardQuickActionKey =
  | "ADD_LEAD"
  | "VIEW_COMMISSION"
  | "VIEW_REPORTS"
  | "INVITE_TEAM"
  | "NEW_APPLICATION"
  | "DOC_CHECK_QUEUE"
  | "VISA_TRACKER"
  | "ASSIGN_LEAD"
  | "LOG_ACTIVITY"
  | "IMPORT_LEADS"
  | "VIEW_TEAM"
  | "ADD_APPLICATION"
  | "SCHEDULE_CALL"
  | string;

export type DashboardSectionKey =
  | "kpi"
  | "leadPipeline"
  | "applicationPipeline"
  | "activityChart"
  | "recentActivities"
  | "performance"
  | "quickActions";

export interface BackendDashboardActivityWeekDto {
  label: string;
  activities: number;
  tasks: number;
}

export interface BackendDashboardActivityChartDto {
  label: string;
  weeks: BackendDashboardActivityWeekDto[];
}

export interface BackendDashboardPipelineStageDto {
  stage: string;
  count: number;
}

export interface BackendDashboardLeadPipelineDto {
  stages: BackendDashboardPipelineStageDto[];
}

export interface BackendDashboardApplicationPipelineDto {
  stages: BackendDashboardPipelineStageDto[];
  totalActive: number;
}

export interface BackendDashboardKpiDto {
  conversionRate?: number;
  newLeads?: number;
  overdueTasks?: number;
  revenueReceived?: number;
}

export interface BackendDashboardPerformanceMetricDto {
  label: string;
  value: number;
  unit: string;
}

export interface BackendDashboardPerformanceDto {
  metrics: BackendDashboardPerformanceMetricDto[];
}

export interface BackendDashboardCapabilitiesDto {
  greeting: string;
  kpiCards: DashboardKpiCardKey[];
  navigation: Record<string, boolean>;
  pipeline: {
    leads: boolean;
    applications: boolean;
  };
  quickActions: DashboardQuickActionKey[];
  sectionOrder: DashboardSectionKey[];
  tabs: Record<string, boolean>;
  teamSummary: {
    available: boolean;
  };
  templateName: string;
  userName: string;
}

export interface BackendDashboardResponse {
  activityChart: BackendDashboardActivityChartDto;
  applicationPipeline: BackendDashboardApplicationPipelineDto;
  capabilities: BackendDashboardCapabilitiesDto;
  generatedAt: string;
  kpi: BackendDashboardKpiDto;
  leadPipeline: BackendDashboardLeadPipelineDto;
  performance: BackendDashboardPerformanceDto;
  quickActions: DashboardQuickActionKey[];
  sectionOrder: DashboardSectionKey[];
}

export interface DashboardDateRangeParams {
  fromDate: string;
  toDate: string;
}

export const dashboardApi = {
  getDashboard: async (params: DashboardDateRangeParams): Promise<BackendDashboardResponse> => {
    const response = await httpClient.get<BackendDashboardResponse>(API_CONFIG.dashboard, {
      params,
    });
    return response.data;
  },
};
