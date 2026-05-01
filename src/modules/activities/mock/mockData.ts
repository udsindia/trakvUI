import type {
  Activity,
  ActivitySummaryMetric,
  BoardTask,
  LoggableActivityType,
  TaskColumnDefinition,
} from "@/modules/activities/types/types";

function buildTimestamp(dayOffset: number, hours: number, minutes: number) {
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  value.setDate(value.getDate() + dayOffset);

  return value.toISOString();
}

function buildDate(dayOffset: number) {
  const value = new Date();
  value.setDate(value.getDate() + dayOffset);
  value.setHours(9, 0, 0, 0);

  return value.toISOString().slice(0, 10);
}

export const activityFeedMockData: Activity[] = [
  {
    id: "activity-1",
    type: "CALL",
    title: "Phone Call",
    description: "Called Sarah Johnson regarding project proposal alignment.",
    status: "Completed",
    timestamp: buildTimestamp(0, 14, 30),
    agent: "Michael Chen",
    duration: 15,
  },
  {
    id: "activity-2",
    type: "MEETING",
    title: "Client Meeting",
    description: "Quarterly review meeting with ABC Corporation stakeholders.",
    status: "Scheduled",
    timestamp: buildTimestamp(0, 13, 0),
    agent: "Lisa Ward",
    location: "Conference Room A",
  },
  {
    id: "activity-3",
    type: "WHATSAPP",
    title: "WhatsApp Message",
    description: "Follow-up message sent to David Rodriguez about revised timelines.",
    status: "Sent",
    timestamp: buildTimestamp(0, 11, 45),
    agent: "Emma Thompson",
    contact: "+1 (555) 123-4567",
  },
  {
    id: "activity-4",
    type: "EMAIL",
    title: "Email",
    description: "Proposal documents sent to jennifer.brown@company.com.",
    status: "Sent",
    timestamp: buildTimestamp(0, 10, 20),
    agent: "James Wilson",
    subject: "Project Proposal - Q2 2026",
  },
  {
    id: "activity-5",
    type: "NOTE",
    title: "Note Added",
    description: "Added follow-up note for Robert Kim regarding contract negotiations.",
    status: "Internal",
    timestamp: buildTimestamp(0, 9, 15),
    agent: "Sara Martinez",
    category: "Sales",
  },
  {
    id: "activity-6",
    type: "DOCUMENT",
    title: "Document Uploaded",
    description: "Contract_Amendment_v2.pdf uploaded to the shared client folder.",
    status: "Contract",
    timestamp: buildTimestamp(0, 8, 30),
    agent: "Kevin Park",
    fileSize: "2.4 MB",
  },
  {
    id: "activity-7",
    type: "CALL",
    title: "Discovery Call",
    description: "Discussed onboarding priorities with Future Systems procurement team.",
    status: "Completed",
    timestamp: buildTimestamp(-1, 16, 10),
    agent: "Michael Chen",
    duration: 24,
  },
  {
    id: "activity-8",
    type: "MEETING",
    title: "Planning Sync",
    description: "Internal strategy sync for the Q2 retention campaign launch.",
    status: "Completed",
    timestamp: buildTimestamp(-1, 12, 40),
    agent: "Lisa Ward",
    location: "Zoom Room 2",
  },
  {
    id: "activity-9",
    type: "WHATSAPP",
    title: "Client Reminder",
    description: "Shared payment reminder and next-step checklist with Maria Lewis.",
    status: "Sent",
    timestamp: buildTimestamp(-2, 15, 25),
    agent: "Emma Thompson",
    contact: "+1 (555) 441-2088",
  },
  {
    id: "activity-10",
    type: "EMAIL",
    title: "Quote Follow-up",
    description: "Sent a pricing clarification email to Global Solutions Ltd.",
    status: "Sent",
    timestamp: buildTimestamp(-3, 11, 5),
    agent: "James Wilson",
    subject: "Updated Pricing Clarification",
  },
  {
    id: "activity-11",
    type: "NOTE",
    title: "Qualification Note",
    description: "Captured lead qualification notes after the product walkthrough.",
    status: "Internal",
    timestamp: buildTimestamp(-4, 10, 0),
    agent: "Sara Martinez",
    category: "Qualification",
  },
  {
    id: "activity-12",
    type: "DOCUMENT",
    title: "Proposal Deck Uploaded",
    description: "Uploaded a revised proposal deck for board review and approval.",
    status: "Contract",
    timestamp: buildTimestamp(-5, 9, 20),
    agent: "Kevin Park",
    fileSize: "4.8 MB",
  },
];

export const activityTemplateOptions = [
  "Discovery call summary",
  "Meeting recap",
  "Proposal follow-up",
  "Escalation response",
];

export const loggableActivityTypes: LoggableActivityType[] = [
  "CALL",
  "MEETING",
  "WHATSAPP",
  "EMAIL",
];

export const studentReferenceOptions = [
  {
    id: "9e4b0f84-e326-4ad1-9e09-cf67fbc51b35",
    name: "Ananya Sharma",
  },
  {
    id: "22fe80d5-529f-44ee-a2fc-b5fe0976eb07",
    name: "Kabir Mehta",
  },
  {
    id: "8c2aa561-6d61-4f5b-acd0-685c8616d447",
    name: "Meera Iyer",
  },
];

export const applicationReferenceOptions = [
  {
    id: "4ce2f164-cbee-4dc7-9b54-f22f7ac8d0d1",
    name: "Ananya Sharma - University of Toronto",
    studentId: "9e4b0f84-e326-4ad1-9e09-cf67fbc51b35",
  },
  {
    id: "8e26173e-a625-47ac-a622-0ef399d99163",
    name: "Kabir Mehta - Monash University",
    studentId: "22fe80d5-529f-44ee-a2fc-b5fe0976eb07",
  },
  {
    id: "98a9c7b9-5ff3-4119-a947-48bccd44a346",
    name: "Meera Iyer - Technical University of Munich",
    studentId: "8c2aa561-6d61-4f5b-acd0-685c8616d447",
  },
];

export const taskColumnDefinitions: TaskColumnDefinition[] = [
  { key: "todo", title: "To Do" },
  { key: "inProgress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export const taskBoardMockData: BoardTask[] = [
  {
    id: "task-1",
    column: "todo",
    label: "PINNED",
    title: "Follow up with premium lead",
    description: "Contact a high-value prospect about the enterprise counselling package.",
    priority: "HIGH",
    dueDate: buildDate(1),
    assignedAgent: {
      name: "Michael Chen",
      role: "Senior Counsellor",
    },
    linkedLead: {
      name: "Aarav Malhotra",
      details: "MBA candidate considering Canada and the UK intake options.",
      email: "aarav.malhotra@example.com",
      phone: "+91 98765 43210",
      status: "Hot Lead",
    },
    notes: [
      {
        id: "task-1-note-1",
        author: "Michael Chen",
        timeAgo: "1 hour ago",
        content: "Lead requested a cost comparison for two universities before the weekend.",
      },
    ],
  },
  {
    id: "task-2",
    column: "todo",
    label: "OVERDUE",
    title: "Send proposal to ABC Corp",
    description: "Prepare and send the customized solution proposal for the corporate plan.",
    priority: "MEDIUM",
    dueDate: buildDate(-1),
    assignedAgent: {
      name: "Jennifer Smith",
      role: "Account Executive",
    },
    linkedLead: {
      name: "ABC Corp",
      details: "Corporate migration partner exploring an annual retained engagement.",
      email: "procurement@abccorp.com",
      phone: "+1 (555) 228-1097",
      status: "Hot Lead",
    },
    notes: [
      {
        id: "task-2-note-1",
        author: "Jennifer Smith",
        timeAgo: "Yesterday",
        content: "Legal requested the latest pricing appendix before proposal dispatch.",
      },
    ],
  },
  {
    id: "task-3",
    column: "todo",
    title: "Schedule demo call",
    description: "Coordinate a product demonstration with the shortlisted prospect team.",
    priority: "LOW",
    dueDate: buildDate(2),
    assignedAgent: {
      name: "David Wilson",
      role: "Business Development",
    },
    linkedLead: {
      name: "Nina Patel",
      details: "Independent consultant evaluating the CRM workflow experience.",
      email: "nina.patel@example.com",
      phone: "+91 99880 99880",
      status: "Warm Lead",
    },
    notes: [
      {
        id: "task-3-note-1",
        author: "David Wilson",
        timeAgo: "3 hours ago",
        content: "Waiting on the client team to confirm Friday afternoon availability.",
      },
    ],
  },
  {
    id: "task-4",
    column: "todo",
    title: "Update lead qualification",
    description: "Review and update the lead score based on the latest discovery notes.",
    priority: "MEDIUM",
    dueDate: buildDate(4),
    assignedAgent: {
      name: "Emma Thompson",
      role: "Lead Specialist",
    },
    linkedLead: {
      name: "Global Skills Hub",
      details: "Agency partner requesting a revised qualification framework.",
      email: "ops@globalskillshub.com",
      phone: "+44 20 7946 0958",
      status: "Warm Lead",
    },
    notes: [
      {
        id: "task-4-note-1",
        author: "Emma Thompson",
        timeAgo: "30 minutes ago",
        content: "Recent WhatsApp interaction suggests faster turnaround expectations.",
      },
    ],
  },
  {
    id: "task-5",
    column: "inProgress",
    label: "IN PROGRESS",
    progress: 60,
    title: "Negotiate contract terms",
    description: "Working through commercial terms and pricing adjustments with legal.",
    priority: "HIGH",
    dueDate: buildDate(5),
    assignedAgent: {
      name: "Robert Brown",
      role: "Partnership Manager",
    },
    linkedLead: {
      name: "Tech Innovations Inc",
      details: "Enterprise account evaluating a quarterly rollout across three teams.",
      email: "contracts@techinnovations.com",
      phone: "+1 (555) 310-4400",
      status: "Hot Lead",
    },
    notes: [
      {
        id: "task-5-note-1",
        author: "Robert Brown",
        timeAgo: "2 hours ago",
        content: "Finance approved the revised payment schedule subject to legal review.",
      },
      {
        id: "task-5-note-2",
        author: "Priya Menon",
        timeAgo: "Yesterday",
        content: "Customer asked for a final redline copy before Monday.",
      },
    ],
  },
  {
    id: "task-6",
    column: "inProgress",
    label: "IN PROGRESS",
    progress: 80,
    title: "Prepare sales presentation",
    description: "Create a board-ready presentation for next week's leadership meeting.",
    priority: "MEDIUM",
    dueDate: buildDate(3),
    assignedAgent: {
      name: "Lisa Anderson",
      role: "Solutions Consultant",
    },
    linkedLead: {
      name: "Future Systems Corp",
      details: "Prospect requesting a tailored demo and operational rollout plan.",
      email: "board@futuresystems.com",
      phone: "+1 (555) 772-8810",
      status: "Warm Lead",
    },
    notes: [
      {
        id: "task-6-note-1",
        author: "Lisa Anderson",
        timeAgo: "4 hours ago",
        content: "Presentation draft is ready; adding the final pricing slide and FAQ appendix.",
      },
    ],
  },
  {
    id: "task-7",
    column: "done",
    label: "COMPLETED",
    title: "Cold outreach campaign",
    description: "Completed the scheduled Q4 email outreach sequence to 500 prospects.",
    priority: "LOW",
    dueDate: buildDate(-4),
    assignedAgent: {
      name: "Sarah Johnson",
      role: "Outbound Specialist",
    },
    linkedLead: {
      name: "Growth Orbit",
      details: "Outbound list segment for higher-intent prospects in the US market.",
      email: "hello@growthorbit.com",
      phone: "+1 (555) 440-5500",
      status: "Qualified",
    },
    notes: [
      {
        id: "task-7-note-1",
        author: "Sarah Johnson",
        timeAgo: "2 days ago",
        content: "Sequence completed with a 12% reply rate and 4 demo requests booked.",
      },
    ],
    completionNote: "Campaign completed and performance summary shared with the team.",
  },
  {
    id: "task-8",
    column: "done",
    label: "COMPLETED",
    title: "Client onboarding meeting",
    description: "Conducted the onboarding session with the new enterprise client team.",
    priority: "MEDIUM",
    dueDate: buildDate(-6),
    assignedAgent: {
      name: "Chris Walker",
      role: "Customer Success",
    },
    linkedLead: {
      name: "Global Solutions Ltd",
      details: "Recently converted client entering the onboarding and handoff phase.",
      email: "success@globalsolutions.com",
      phone: "+44 20 7123 4567",
      status: "Customer",
    },
    notes: [
      {
        id: "task-8-note-1",
        author: "Chris Walker",
        timeAgo: "5 days ago",
        content: "Kickoff completed successfully and implementation milestones were agreed.",
      },
    ],
    completionNote: "Onboarding meeting completed with action items assigned.",
  },
  {
    id: "task-9",
    column: "done",
    label: "COMPLETED",
    title: "Market research analysis",
    description: "Completed the competitor review for the new service packaging launch.",
    priority: "HIGH",
    dueDate: buildDate(-8),
    assignedAgent: {
      name: "Priya Menon",
      role: "Strategy Analyst",
    },
    linkedLead: {
      name: "Future Systems Corp",
      details: "Research project supporting the enterprise expansion sales pitch.",
      email: "research@futuresystems.com",
      phone: "+1 (555) 887-0099",
      status: "Qualified",
    },
    notes: [
      {
        id: "task-9-note-1",
        author: "Priya Menon",
        timeAgo: "1 week ago",
        content: "Shared research output with the growth team and leadership stakeholders.",
      },
    ],
    completionNote: "Research pack delivered and archived for future proposals.",
  },
];

export const activitySummaryMockData: ActivitySummaryMetric[] = [
  {
    key: "calls-made",
    label: "Calls Made",
    type: "CALL",
    value: 127,
  },
  {
    key: "meetings-held",
    label: "Meetings Held",
    type: "MEETING",
    value: 43,
  },
  {
    key: "whatsapp-messages",
    label: "WhatsApp Messages",
    type: "WHATSAPP",
    value: 89,
  },
];
