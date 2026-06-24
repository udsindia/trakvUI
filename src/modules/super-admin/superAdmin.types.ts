export type AgencyStatus = "active" | "inactive" | "suspended" | "pending_verification";

export type SubscriptionPlan = "trial" | "starter" | "professional" | "enterprise";

export type VerificationStatus = "verified" | "pending" | "rejected";

export interface AgencyAdmin {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Agency {
  id: string;
  name: string;
  registrationId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: AgencyStatus;
  verificationStatus: VerificationStatus;
  subscriptionPlan: SubscriptionPlan;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  userCount: number;
  studentCount: number;
  leadCount: number;
  applicationCount: number;
  createdAt: string;
  admin: AgencyAdmin;
}

export interface CreateAgencyRequest {
  consultancyName: string;
  registrationID: string;
  consultancyAddress: string;
  consultancyCity: string;
  consultancyState: string;
  consultancyCountry: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface UpdateAgencyProfileRequest {
  name?: string;
  registrationId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateAgencyTrialRequest {
  trialEndsAt: string;
}

export interface UpdateAgencySubscriptionRequest {
  plan: SubscriptionPlan;
  subscriptionEndsAt: string;
}

export type PlatformKpiAccent = "blue" | "green" | "orange" | "purple" | "red";

export interface PlatformKpi {
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "down" | "flat";
  accent: PlatformKpiAccent;
  icon: string;
}

export interface PlatformChartPoint {
  label: string;
  value: number;
}

export interface PlatformDashboardData {
  greeting: string;
  kpis: PlatformKpi[];
  agencyGrowth: PlatformChartPoint[];
  revenueTrend: PlatformChartPoint[];
  visaSuccessRatio: PlatformChartPoint[];
  latestAgencies: Agency[];
  recentTickets: PlatformTicket[];
  systemAlerts: PlatformAlert[];
  expiringSubscriptions: Agency[];
}

export interface PlatformTicket {
  id: string;
  subject: string;
  agencyName: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface PlatformAlert {
  id: string;
  message: string;
  severity: "info" | "warning" | "error";
  createdAt: string;
}

export interface PlatformAnalyticsData {
  kpis: PlatformKpi[];
  leadTrends: PlatformChartPoint[];
  agencyGrowth: PlatformChartPoint[];
  visaSuccessRatio: PlatformChartPoint[];
  countryApplications: PlatformChartPoint[];
}
