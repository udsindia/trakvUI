import type { RoleKey } from "@/config/roles/roles";
import {
  getMockActivityChart,
  getMockApplicationPipeline,
  getMockDashboardActivities,
  getMockDashboardApplications,
  getMockDashboardLeads,
  getMockDashboardTaskSummary,
  getMockDashboardTasks,
  getMockLeadPipeline,
  getMockPerformanceMetrics,
  getMockRecentActivities,
} from "@/modules/dashboard/dashboardMockData";
import { getRoleDashboardConfig } from "@/modules/dashboard/dashboardRoleConfig";
import type {
  DashboardActivityChartPointDto,
  DashboardActivityDto,
  DashboardApplicationDto,
  DashboardApplicationPipelineDto,
  DashboardKpiDto,
  DashboardLeadDto,
  DashboardLeadPipelineDto,
  DashboardPerformanceMetricDto,
  DashboardServiceResponse,
  DashboardTaskDto,
  DashboardTaskSummaryDto,
} from "@/modules/dashboard/dashboard.types";

function mockResponse<TData>(data: TData): DashboardServiceResponse<TData> {
  return {
    data,
    generatedAt: new Date().toISOString(),
    source: "mock",
  };
}

export const dashboardService = {
  /** GET /api/dashboard/kpi */
  async getKpis(role: RoleKey): Promise<DashboardServiceResponse<DashboardKpiDto[]>> {
    return mockResponse(getRoleDashboardConfig(role).kpis);
  },

  /** GET /api/dashboard/pipeline/leads */
  async getLeadPipeline(role: RoleKey): Promise<DashboardServiceResponse<DashboardLeadPipelineDto>> {
    return mockResponse(getMockLeadPipeline(role));
  },

  /** GET /api/dashboard/pipeline/applications */
  async getApplicationPipeline(
    role: RoleKey,
  ): Promise<DashboardServiceResponse<DashboardApplicationPipelineDto>> {
    return mockResponse(getMockApplicationPipeline(role));
  },

  /** GET /api/dashboard/activity-chart */
  async getActivityChart(
    role: RoleKey,
  ): Promise<DashboardServiceResponse<DashboardActivityChartPointDto[]>> {
    return mockResponse(getMockActivityChart(role));
  },

  /** GET /api/dashboard/performance */
  async getPerformanceMetrics(
    role: RoleKey,
  ): Promise<DashboardServiceResponse<DashboardPerformanceMetricDto[]>> {
    return mockResponse(getMockPerformanceMetrics(role));
  },

  /** GET /api/dashboard/recent-activities */
  async getRecentActivities(role: RoleKey): Promise<DashboardServiceResponse<DashboardActivityDto[]>> {
    return mockResponse(getMockRecentActivities(role));
  },

  async getLeads(): Promise<DashboardServiceResponse<DashboardLeadDto[]>> {
    return mockResponse(getMockDashboardLeads());
  },

  async getApplications(): Promise<DashboardServiceResponse<DashboardApplicationDto[]>> {
    return mockResponse(getMockDashboardApplications());
  },

  async getTasks(): Promise<DashboardServiceResponse<DashboardTaskDto[]>> {
    return mockResponse(getMockDashboardTasks());
  },

  async getTaskSummary(): Promise<DashboardServiceResponse<DashboardTaskSummaryDto>> {
    const tasks = getMockDashboardTasks();
    return mockResponse(getMockDashboardTaskSummary(tasks));
  },

  async getActivityFeed(): Promise<DashboardServiceResponse<DashboardActivityDto[]>> {
    return mockResponse(getMockDashboardActivities());
  },
};
