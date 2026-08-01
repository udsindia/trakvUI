import { dashboardApi } from "@/modules/dashboard/dashboardApi";
import { mapDashboardResponse, type DashboardViewModel } from "@/modules/dashboard/dashboardMappers";
import type { DashboardServiceResponse } from "@/modules/dashboard/dashboard.types";
import {
  getDashboardDateRange,
  type DashboardPeriod,
} from "@/modules/dashboard/dashboardDateRange";

export const dashboardService = {
  async getDashboard(
    period: DashboardPeriod,
  ): Promise<DashboardServiceResponse<DashboardViewModel>> {
    const dateRange = getDashboardDateRange(period);
    const response = await dashboardApi.getDashboard(dateRange);

    return {
      data: mapDashboardResponse(response, period),
      generatedAt: response.generatedAt,
      source: "live",
    };
  },
};
