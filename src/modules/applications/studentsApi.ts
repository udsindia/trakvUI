import { httpClient } from "@/shared/services/http/client";
import { API_CONFIG } from "@/config/api/config";

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
  phone?: string;
}

/** The list endpoint returns a Spring Page ({ content: [...] }); older builds returned a raw array. */
interface Paged<T> {
  content?: T[];
}

export const studentsApi = {
  getStudents: async (): Promise<StudentOption[]> => {
    const response = await httpClient.get<BackendStudentSummary[] | Paged<BackendStudentSummary>>(
      API_CONFIG.students,
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : data?.content ?? [];
    return list.map((s) => ({
      id: s.id,
      name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email || s.id,
      email: s.email ?? "",
      phone: s.phone ?? "",
    }));
  },
};
