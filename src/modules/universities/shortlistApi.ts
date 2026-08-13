import { httpClient } from "@/shared/services/http/client";

/**
 * Course-shortlist endpoints. A shortlist belongs to a specific student
 * (backend table `course_shortlists`, keyed by student_id + course_id).
 */
export const shortlistApi = {
  /** Course ids currently shortlisted by the student. */
  getShortlistedCourseIds: async (studentId: string): Promise<string[]> => {
    const { data } = await httpClient.get<string[]>(`/students/${studentId}/shortlist`);
    return data;
  },

  /** Add a course to the student's shortlist (idempotent server-side). */
  addToShortlist: async (studentId: string, courseId: string): Promise<void> => {
    await httpClient.post(`/students/${studentId}/shortlist/${courseId}`);
  },

  /** Remove a course from the student's shortlist. */
  removeFromShortlist: async (studentId: string, courseId: string): Promise<void> => {
    await httpClient.delete(`/students/${studentId}/shortlist/${courseId}`);
  },
};
