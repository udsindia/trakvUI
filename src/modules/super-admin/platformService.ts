import { isMockAuthEnabled } from "@/app/auth/authService";
import { API_CONFIG } from "@/config/api/config";
import { httpClient } from "@/shared/services/http/client";
import type {
  PlatformAnalyticsData,
  PlatformDashboardData,
} from "@/modules/super-admin/superAdmin.types";

const mockDashboardData: PlatformDashboardData = {
  greeting: "Platform Overview",
  kpis: [
    { label: "Agencies", value: "128", delta: "+12 this month", deltaTone: "up", accent: "blue", icon: "🏢" },
    { label: "Users", value: "2,840", delta: "+186 this month", deltaTone: "up", accent: "green", icon: "👥" },
    { label: "Students", value: "18,420", delta: "+1,240 this month", deltaTone: "up", accent: "purple", icon: "🎓" },
    { label: "Applications", value: "6,280", delta: "+420 this month", deltaTone: "up", accent: "orange", icon: "📋" },
    { label: "Revenue", value: "₹42.8L", delta: "+18% vs last month", deltaTone: "up", accent: "green", icon: "💰" },
    { label: "Support Tickets", value: "34", delta: "8 open", deltaTone: "flat", accent: "red", icon: "🎫" },
  ],
  agencyGrowth: [
    { label: "Jan", value: 82 },
    { label: "Feb", value: 88 },
    { label: "Mar", value: 94 },
    { label: "Apr", value: 102 },
    { label: "May", value: 115 },
    { label: "Jun", value: 128 },
  ],
  revenueTrend: [
    { label: "Jan", value: 28 },
    { label: "Feb", value: 31 },
    { label: "Mar", value: 34 },
    { label: "Apr", value: 36 },
    { label: "May", value: 39 },
    { label: "Jun", value: 43 },
  ],
  visaSuccessRatio: [
    { label: "Approved", value: 72 },
    { label: "Pending", value: 18 },
    { label: "Rejected", value: 10 },
  ],
  latestAgencies: [],
  recentTickets: [
    { id: "t-101", subject: "Payment gateway timeout", agencyName: "Study Abroad Hub", priority: "high", createdAt: "2026-06-20T14:30:00Z" },
    { id: "t-102", subject: "Unable to export leads", agencyName: "Global Pathways", priority: "medium", createdAt: "2026-06-20T11:15:00Z" },
    { id: "t-103", subject: "Trial extension request", agencyName: "Visa Vista", priority: "low", createdAt: "2026-06-19T16:45:00Z" },
  ],
  systemAlerts: [
    { id: "a-1", message: "SMTP relay latency elevated in ap-south-1", severity: "warning", createdAt: "2026-06-21T08:00:00Z" },
    { id: "a-2", message: "3 agencies approaching storage quota", severity: "info", createdAt: "2026-06-20T22:10:00Z" },
    { id: "a-3", message: "WhatsApp API rate limit hit for tenant batch", severity: "error", createdAt: "2026-06-20T18:30:00Z" },
  ],
  expiringSubscriptions: [],
};

const mockAnalyticsData: PlatformAnalyticsData = {
  kpis: [
    { label: "Total Agencies", value: "128", delta: "+12 this month", deltaTone: "up", accent: "blue", icon: "🏢" },
    { label: "Total Users", value: "2,840", delta: "+186 this month", deltaTone: "up", accent: "green", icon: "👥" },
    { label: "Total Students", value: "18,420", delta: "+1,240 this month", deltaTone: "up", accent: "purple", icon: "🎓" },
    { label: "Total Leads", value: "24,680", delta: "+2,100 this month", deltaTone: "up", accent: "orange", icon: "📈" },
    { label: "Visa Applications", value: "6,280", delta: "+420 this month", deltaTone: "up", accent: "blue", icon: "📋" },
    { label: "Approved Visas", value: "4,520", delta: "72% approval", deltaTone: "up", accent: "green", icon: "✅" },
    { label: "Rejected Visas", value: "628", delta: "10% rejection", deltaTone: "down", accent: "red", icon: "❌" },
    { label: "Pending Applications", value: "1,132", delta: "18% pending", deltaTone: "flat", accent: "orange", icon: "⏳" },
  ],
  leadTrends: [
    { label: "Jan", value: 3200 },
    { label: "Feb", value: 3580 },
    { label: "Mar", value: 3900 },
    { label: "Apr", value: 4120 },
    { label: "May", value: 4380 },
    { label: "Jun", value: 4680 },
  ],
  agencyGrowth: mockDashboardData.agencyGrowth,
  visaSuccessRatio: mockDashboardData.visaSuccessRatio,
  countryApplications: [
    { label: "Canada", value: 1820 },
    { label: "UK", value: 1540 },
    { label: "Australia", value: 1280 },
    { label: "USA", value: 980 },
    { label: "Germany", value: 660 },
  ],
};

export const platformService = {
  async getDashboard(): Promise<PlatformDashboardData> {
    if (isMockAuthEnabled) {
      const { agenciesService } = await import("@/modules/super-admin/agenciesService");
      const agencies = await agenciesService.getAgencies();
      const expiring = agencies.filter((a) => {
        const end = a.subscriptionEndsAt ?? a.trialEndsAt;
        if (!end) return false;
        const days = (new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 30;
      });

      return {
        ...mockDashboardData,
        latestAgencies: agencies.slice(0, 5),
        expiringSubscriptions: expiring,
      };
    }

    const { data } = await httpClient.get<PlatformDashboardData>(`${API_CONFIG.platform}/dashboard`);
    return data;
  },

  async getAnalytics(): Promise<PlatformAnalyticsData> {
    if (isMockAuthEnabled) {
      return mockAnalyticsData;
    }

    const { data } = await httpClient.get<PlatformAnalyticsData>(`${API_CONFIG.platform}/analytics`);
    return data;
  },
};
