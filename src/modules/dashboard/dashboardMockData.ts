import type { RoleKey } from "@/config/roles/roles";
import { ROLES } from "@/config/roles/roles";
import type {
  DashboardActivityChartPointDto,
  DashboardActivityDto,
  DashboardApplicationDto,
  DashboardApplicationPipelineDto,
  DashboardLeadDto,
  DashboardLeadPipelineDto,
  DashboardPerformanceMetricDto,
  DashboardTaskDto,
  DashboardTaskSummaryDto,
} from "@/modules/dashboard/dashboard.types";

function isoNow() {
  return new Date().toISOString();
}

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoDateWithOffset(dayOffset: number) {
  const value = new Date();
  value.setDate(value.getDate() + dayOffset);
  value.setHours(9, 0, 0, 0);
  return value.toISOString().slice(0, 10);
}

export function getMockDashboardLeads(): DashboardLeadDto[] {
  const now = isoNow();

  return [
    {
      id: "mock-lead-1",
      tenantId: "mock-tenant",
      firstName: "Ananya",
      lastName: "Sharma",
      phone: "+91 98765 43210",
      email: "ananya.sharma@example.com",
      isArchived: false,
      leadStage: "New",
      assignedTo: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      sourceName: "Website",
      score: 92,
      destinationCountries: ["Canada"],
      lastActivityAt: now,
      createdAt: isoHoursAgo(4),
      updatedAt: now,
    },
    {
      id: "mock-lead-2",
      tenantId: "mock-tenant",
      firstName: "Kabir",
      lastName: "Mehta",
      phone: "+91 99887 77665",
      email: "kabir.mehta@example.com",
      isArchived: false,
      leadStage: "Qualified",
      assignedTo: {
        id: "mock-counsellor",
        name: "Demo Counsellor",
        role: "Counsellor",
      },
      sourceName: "Referral",
      score: 78,
      destinationCountries: ["Australia"],
      lastActivityAt: null,
      createdAt: isoHoursAgo(28),
      updatedAt: isoHoursAgo(28),
    },
    {
      id: "mock-lead-3",
      tenantId: "mock-tenant",
      firstName: "Meera",
      lastName: "Iyer",
      phone: "+91 91234 56789",
      email: "meera.iyer@example.com",
      isArchived: false,
      leadStage: "Contacted",
      assignedTo: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      sourceName: "Social Media",
      score: 64,
      destinationCountries: ["Germany"],
      lastActivityAt: isoHoursAgo(26),
      createdAt: isoHoursAgo(54),
      updatedAt: isoHoursAgo(26),
    },
  ];
}

export function getMockDashboardApplications(): DashboardApplicationDto[] {
  const now = isoNow();

  return [
    {
      id: "mock-app-1",
      leadId: "mock-lead-1",
      studentName: "Ananya Sharma",
      email: "ananya.sharma@example.com",
      phone: "+91 98765 43210",
      targetCountry: "Canada",
      targetUniversity: "University of Toronto",
      course: "MBA",
      intakeMonth: "September",
      intakeYear: 2026,
      stage: "Processing",
      owner: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      createdAt: isoHoursAgo(18),
      updatedAt: now,
    },
    {
      id: "mock-app-2",
      leadId: "mock-lead-2",
      studentName: "Kabir Mehta",
      email: "kabir.mehta@example.com",
      phone: "+91 99887 77665",
      targetCountry: "Australia",
      targetUniversity: "Monash University",
      course: "Data Science",
      intakeMonth: "February",
      intakeYear: 2027,
      stage: "Visa Applied",
      owner: {
        id: "mock-counsellor",
        name: "Demo Counsellor",
        role: "Counsellor",
      },
      createdAt: isoHoursAgo(72),
      updatedAt: isoHoursAgo(6),
    },
    {
      id: "mock-app-3",
      studentName: "Meera Iyer",
      email: "meera.iyer@example.com",
      phone: "+91 91234 56789",
      targetCountry: "Germany",
      targetUniversity: "Technical University of Munich",
      course: "Engineering Management",
      intakeMonth: "October",
      intakeYear: 2026,
      stage: "Visa Approved",
      owner: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      createdAt: isoHoursAgo(120),
      updatedAt: isoHoursAgo(2),
    },
  ];
}

export function getMockDashboardTasks(): DashboardTaskDto[] {
  const now = isoNow();

  return [
    {
      id: "mock-task-1",
      title: "Follow up with premium lead",
      description: "Contact a high-value prospect about the Canada intake plan.",
      priority: "HIGH",
      status: "PENDING",
      dueDate: isoDateWithOffset(0),
      assignedTo: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      linkedEntity: {
        id: "mock-lead-1",
        name: "Ananya Sharma",
        type: "LEAD",
      },
      createdAt: isoHoursAgo(7),
    },
    {
      id: "mock-task-2",
      title: "Collect revised financial documents",
      description: "Request the updated bank statements before visa submission.",
      priority: "URGENT",
      status: "PENDING",
      dueDate: isoDateWithOffset(-1),
      assignedTo: {
        id: "mock-counsellor",
        name: "Demo Counsellor",
        role: "Counsellor",
      },
      linkedEntity: {
        id: "mock-app-2",
        name: "Kabir Mehta - Monash University",
        type: "APPLICATION",
      },
      createdAt: isoHoursAgo(34),
    },
    {
      id: "mock-task-3",
      title: "Review visa approval checklist",
      description: "Confirm post-approval counselling and arrival checklist status.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: isoDateWithOffset(2),
      assignedTo: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      linkedEntity: {
        id: "mock-app-3",
        name: "Meera Iyer - Technical University of Munich",
        type: "APPLICATION",
      },
      createdAt: isoHoursAgo(16),
    },
    {
      id: "mock-task-4",
      title: "Archive completed intake checklist",
      description: "Move the completed checklist to the student record.",
      priority: "LOW",
      status: "DONE",
      dueDate: isoDateWithOffset(-3),
      assignedTo: {
        id: "mock-admin",
        name: "Demo Tenant Admin",
        role: "Agency Admin",
      },
      linkedEntity: {
        id: "mock-app-3",
        name: "Meera Iyer",
        type: "STUDENT",
      },
      createdAt: isoHoursAgo(96),
      completedAt: now,
    },
  ];
}

export function getMockDashboardTaskSummary(tasks = getMockDashboardTasks()): DashboardTaskSummaryDto {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((task) => task.status !== "DONE" && task.dueDate < today).length;

  return {
    completed: tasks.filter((task) => task.status === "DONE").length,
    dueToday: tasks.filter((task) => task.status !== "DONE" && task.dueDate === today).length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    overdue,
    pending: tasks.filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS").length,
    total: tasks.length,
  };
}

export function getMockDashboardActivities(): DashboardActivityDto[] {
  return [
    {
      id: "mock-activity-1",
      type: "CALL",
      title: "Anjali Singh called Priya Sharma",
      description: "Discussed UK university options — interested in Masters in Data Science",
      status: "Completed",
      occurredAt: isoHoursAgo(0.17),
      actor: {
        id: "mock-counsellor",
        name: "Anjali Singh",
        role: "Counsellor",
      },
      linkedEntity: {
        id: "mock-lead-1",
        name: "Priya Sharma",
        type: "LEAD",
      },
      durationMinutes: 18,
    },
    {
      id: "mock-activity-2",
      type: "NOTE",
      title: "Ravi Kumar moved Manish Gupta to Qualified",
      description: "Stage changed: Contacted → Qualified",
      status: "Completed",
      occurredAt: isoHoursAgo(0.42),
      actor: {
        id: "mock-manager",
        name: "Ravi Kumar",
        role: "Counsellor",
      },
      linkedEntity: {
        id: "mock-lead-2",
        name: "Manish Gupta",
        type: "LEAD",
      },
    },
    {
      id: "mock-activity-3",
      type: "WHATSAPP",
      title: "Meena Joshi sent WhatsApp to Ananya Rao",
      description: "Sent university brochure via welcome template",
      status: "Sent",
      occurredAt: isoHoursAgo(1),
      actor: {
        id: "mock-lead-manager",
        name: "Meena Joshi",
        role: "Counsellor",
      },
      linkedEntity: {
        id: "mock-lead-3",
        name: "Ananya Rao",
        type: "LEAD",
      },
    },
    {
      id: "mock-activity-4",
      type: "EMAIL",
      title: "Arjun Nair emailed Sanjay Verma",
      description: "Sent offer letter from Stanford University",
      status: "Sent",
      occurredAt: isoHoursAgo(26),
      actor: {
        id: "mock-app-manager",
        name: "Arjun Nair",
        role: "Application Manager",
      },
      linkedEntity: {
        id: "mock-app-2",
        name: "Sanjay Verma",
        type: "APPLICATION",
      },
    },
    {
      id: "mock-activity-5",
      type: "NOTE",
      title: "Pooja Verma added note on Kavya Reddy",
      description: "Lead prefers evening calls. Interested in Australia only.",
      status: "Internal",
      occurredAt: isoHoursAgo(28),
      actor: {
        id: "mock-counsellor-2",
        name: "Pooja Verma",
        role: "Counsellor",
      },
      linkedEntity: {
        id: "mock-app-3",
        name: "Kavya Reddy",
        type: "STUDENT",
      },
    },
  ];
}

export function getMockLeadPipeline(_role: RoleKey): DashboardLeadPipelineDto {
  const stages = [
    { label: "New", count: 120, color: "#4f46e5" },
    { label: "Contacted", count: 95, color: "#7c3aed" },
    { label: "Qualified", count: 62, color: "#ec4899" },
    { label: "Applied", count: 38, color: "#ef4444" },
    { label: "Enrolled", count: 22, color: "#10b981" },
  ];

  return {
    stages,
    total: stages.reduce((sum, stage) => sum + stage.count, 0),
  };
}

export function getMockApplicationPipeline(_role: RoleKey): DashboardApplicationPipelineDto {
  const stages = [
    { label: "Doc Check", count: 22, color: "#818cf8" },
    { label: "Applied", count: 15, color: "#6366f1" },
    { label: "Offer", count: 10, color: "#4f46e5" },
    { label: "Visa", count: 7, color: "#4338ca" },
    { label: "Enrolled", count: 4, color: "#10b981" },
  ];

  return {
    stages,
    total: stages.reduce((sum, stage) => sum + stage.count, 0),
  };
}

export function getMockActivityChart(_role: RoleKey): DashboardActivityChartPointDto[] {
  return [
    { label: "May W3", calls: 42, whatsapp: 35 },
    { label: "May W4", calls: 58, whatsapp: 47 },
    { label: "Jun W1", calls: 51, whatsapp: 53 },
    { label: "Jun W2", calls: 63, whatsapp: 61 },
  ];
}

export function getMockPerformanceMetrics(role: RoleKey): DashboardPerformanceMetricDto[] {
  if (role === ROLES.COUNSELLOR) {
    return [
      { label: "Leads Contacted", value: 88, color: "#0f5ad4" },
      { label: "Tasks Completed", value: 72, color: "#10b981" },
      { label: "Follow-up Rate", value: 74, color: "#f59e0b" },
      { label: "WA Reply Rate", value: 62, color: "#7c3aed" },
    ];
  }

  return [
    { label: "Leads Contacted", value: 82, color: "#0f5ad4" },
    { label: "Tasks Completed", value: 75, color: "#10b981" },
    { label: "Follow-up Rate", value: 68, color: "#f59e0b" },
    { label: "WA Reply Rate", value: 58, color: "#7c3aed" },
  ];
}

export function getMockRecentActivities(role: RoleKey): DashboardActivityDto[] {
  const activities = getMockDashboardActivities();

  if (role === ROLES.COUNSELLOR) {
    return activities.filter((activity) => activity.actor?.role === "Counsellor").slice(0, 3);
  }

  return activities.slice(0, 3);
}

