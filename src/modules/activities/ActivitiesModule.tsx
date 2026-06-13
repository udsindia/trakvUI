import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { ActivityFeed } from "@/modules/activities/pages/ActivityFeed";
import { MyTasks } from "@/modules/activities/pages/MyTasks";

export default function ActivitiesModule() {
  return (
    <Routes>
      <Route
        element={
          <PermissionGuard permission={PERMISSIONS.TASK_VIEW}>
            <ActivityFeed />
          </PermissionGuard>
        }
        path="feed"
      />
      <Route
        element={
          <PermissionGuard permission={PERMISSIONS.TASK_VIEW}>
            <MyTasks />
          </PermissionGuard>
        }
        path="tasks"
      />
      <Route element={<Navigate replace to="feed" />} path="*" />
    </Routes>
  );
}
