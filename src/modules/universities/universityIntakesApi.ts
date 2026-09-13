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
