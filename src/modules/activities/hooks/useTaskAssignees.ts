import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/useAuth";
import { API_CONFIG } from "@/config/api/config";
import { PERMISSIONS } from "@/config/permissions/permissions";
import type { TaskAssigneeOption } from "@/modules/activities/components/CreateTaskModal";
import { httpClient } from "@/shared/services/http/client";

/**
 * Who this user may give a task to, and whether they may at all.
 *
 * From GET /tasks/assignees, which returns exactly the people the server accepts as an
 * assignee. It used to come from the users list, which needs user-admin rights: a manager
 * allowed to assign tasks saw an empty dropdown, and an admin was offered people the save
 * would then refuse.
 *
 * Only fetched while a task form is open, and only for TASK_ASSIGN.
 */
export function useTaskAssignees(formOpen: boolean) {
  const { hasPermissions } = useAuth();
  const canAssign = hasPermissions([PERMISSIONS.TASK_ASSIGN]);

  const query = useQuery({
    enabled: formOpen && canAssign,
    queryKey: ["tasks", "assignees"],
    queryFn: async (): Promise<TaskAssigneeOption[]> => {
      const { data } = await httpClient.get<TaskAssigneeOption[]>(`${API_CONFIG.tasks}/assignees`);
      return (data ?? []).map((user) => ({ id: user.id, name: user.name || "Unnamed user" }));
    },
    staleTime: 60_000,
  });

  return {
    canAssign,
    assignees: query.data ?? [],
    isLoading: query.isLoading,
  };
}
