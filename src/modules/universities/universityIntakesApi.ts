import { httpClient } from "@/shared/services/http/client";

/** Where an intake stands in its admissions cycle — mirrors the backend IntakeStatus enum. */
export type IntakeStatus = "OPEN" | "CLOSED" | "WAITLIST";

export type UniversityIntake = {
  id: string;
  intakeMonth: string;
  intakeYear: number;
  status: IntakeStatus;
  applicationDeadline?: string | null;
  notes?: string | null;
};

export type UniversityIntakeInput = {
  intakeMonth: string;
  intakeYear: number;
  status: IntakeStatus;
  applicationDeadline?: string | null;
  notes?: string | null;
};

const base = (universityId: string) => `/universities/${universityId}/intakes`;

export const universityIntakesApi = {
  list: async (universityId: string): Promise<UniversityIntake[]> => {
    const response = await httpClient.get<UniversityIntake[]>(base(universityId));
    return response.data;
  },

  /**
   * Replaces the whole calendar. The server does the same — the table uniques on
   * (university, month, year), and patching rows one at a time collides with itself.
   */
  save: async (
    universityId: string,
    intakes: UniversityIntakeInput[],
    applyToExistingCourses: boolean,
  ): Promise<UniversityIntake[]> => {
    const response = await httpClient.put<UniversityIntake[]>(base(universityId), {
      intakes,
      applyToExistingCourses,
    });
    return response.data;
  },

  /** Adds the calendar's months to existing courses that are missing them. */
  applyToCourses: async (universityId: string): Promise<number> => {
    const response = await httpClient.post<{ intakesCreated: number }>(
      `${base(universityId)}/apply-to-courses`,
    );
    return response.data.intakesCreated;
  },
};

/**
 * A single course's intakes — its own copy of the calendar, as adjusted for this cycle.
 * Same shape as the university's, deliberately, so one editor serves both.
 */
export const courseIntakesApi = {
  list: async (courseId: string): Promise<UniversityIntake[]> => {
    const response = await httpClient.get<UniversityIntake[]>(`/courses/${courseId}/intakes`);
    return response.data;
  },

  save: async (
    courseId: string,
    intakes: UniversityIntakeInput[],
  ): Promise<UniversityIntake[]> => {
    const response = await httpClient.put<UniversityIntake[]>(`/courses/${courseId}/intakes`, {
      intakes,
      applyToExistingCourses: false,
    });
    return response.data;
  },
};

/** One month a calendar save would change on one course. */
export type IntakeMonthChange = {
  month: string;
  year: number;
  from: string | null;
  to: string | null;
  action: "ADDED" | "CHANGED" | "NO_LONGER_IN_CALENDAR";
};

export type IntakeCourseChange = {
  courseId: string;
  courseName: string;
  custom: boolean;
  months: IntakeMonthChange[];
};

/**
 * The blast radius of a calendar save. coursesUpdated were following and are simply brought
 * into line; coursesNeedingConfirmation answered a month for themselves and will be asked.
 */
export type IntakeChangePreview = {
  coursesUpdated: number;
  coursesNeedingConfirmation: number;
  changes: IntakeCourseChange[];
};

export type IntakeChangeNotice = {
  id: string;
  scopeLabel: string | null;
  changedAt: string;
  summary: { months?: IntakeMonthChange[] };
};

export const intakeNoticesApi = {
  preview: async (
    universityId: string,
    intakes: UniversityIntakeInput[],
  ): Promise<IntakeChangePreview> => {
    const response = await httpClient.post<IntakeChangePreview>(
      `/universities/${universityId}/intakes/preview`,
      { intakes, applyToExistingCourses: false },
    );
    return response.data;
  },

  forCourse: async (courseId: string): Promise<IntakeChangeNotice[]> => {
    const response = await httpClient.get<IntakeChangeNotice[]>(
      `/courses/${courseId}/intake-notices`,
    );
    return response.data;
  },

  /** Take the university's calendar for this course. */
  apply: async (noticeId: string): Promise<void> => {
    await httpClient.post(`/intake-notices/${noticeId}/apply`);
  },

  /** Stay as we are — recorded, so the same change is not asked twice. */
  keepOwn: async (noticeId: string): Promise<void> => {
    await httpClient.post(`/intake-notices/${noticeId}/keep-own`);
  },
};

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  WAITLIST: "Waitlist",
};

export const INTAKE_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
