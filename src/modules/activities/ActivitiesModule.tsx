import { Navigate, Route, Routes } from "react-router-dom";
import { ActivityFeed } from "@/modules/activities/pages/ActivityFeed";
import { MyTasks } from "@/modules/activities/pages/MyTasks";

export default function ActivitiesModule() {
  return (
    <Routes>
      <Route element={<ActivityFeed />} path="feed" />
      <Route element={<MyTasks />} path="tasks" />
      <Route element={<Navigate replace to="feed" />} path="*" />
    </Routes>
  );
}
