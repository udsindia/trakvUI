import {
  getMockDashboardActivities,
  getMockDashboardApplications,
  getMockDashboardLeads,
  getMockDashboardTaskSummary,
  getMockDashboardTasks,
} from "@/modules/dashboard/dashboardMockData";
import type {
  DashboardActivityDto,
  DashboardApplicationDto,
  DashboardLeadDto,
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

