export type DashboardPeriod = "today" | "week" | "month" | "quarter";

export interface DashboardDateRange {
  fromDate: string;
  toDate: string;
}

function formatDashboardDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function startOfWeek(date: Date): Date {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + mondayOffset);
  return normalized;
}

function startOfMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function startOfQuarter(date: Date): Date {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return startOfDay(new Date(date.getFullYear(), quarterMonth, 1));
}

export function getDashboardDateRange(period: DashboardPeriod, referenceDate = new Date()): DashboardDateRange {
  const today = startOfDay(referenceDate);
  const toDate = formatDashboardDate(today);

  switch (period) {
    case "today":
      return { fromDate: toDate, toDate };
    case "week":
      return { fromDate: formatDashboardDate(startOfWeek(today)), toDate };
    case "month":
      return { fromDate: formatDashboardDate(startOfMonth(today)), toDate };
    case "quarter":
      return { fromDate: formatDashboardDate(startOfQuarter(today)), toDate };
    default:
      return { fromDate: formatDashboardDate(startOfWeek(today)), toDate };
  }
}
