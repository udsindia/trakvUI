import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";
import { joinPhoneNumber } from "@/shared/utils/phone";

/** A student option for the application create picker. */
export interface StudentOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/** Backend StudentSummaryDTO (only the fields we need). */
interface BackendStudentSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
}

/** The list endpoint returns a Spring Page ({ content: [...] }); older builds returned a raw array. */
interface Paged<T> {
  content?: T[];
}

/**
 * The list endpoint pages at 20 by default, which would silently hide older students
 * from the picker as leads get enrolled. Ask for one large page instead — this is a
 * dropdown, so every student has to be selectable.
 */
const STUDENT_PICKER_PAGE_SIZE = 500;

export const studentsApi = {
  getStudents: async (): Promise<StudentOption[]> => {
    const response = await httpClient.get<BackendStudentSummary[] | Paged<BackendStudentSummary>>(
      API_CONFIG.students,
      { params: { page: 0, size: STUDENT_PICKER_PAGE_SIZE } },
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : data?.content ?? [];
    return list.map((s) => ({
      id: s.id,
      name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email || s.id,
      email: s.email ?? "",
      phone: joinPhoneNumber(s.countryCode, s.phone),
    }));
  },
};
