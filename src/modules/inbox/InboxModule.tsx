import { Navigate, Route, Routes } from "react-router-dom";
import { InstagramInboxPage } from "@/modules/inbox/pages/InstagramInboxPage";

export default function InboxModule() {
  return (
    <Routes>
      <Route element={<InstagramInboxPage />} index />
      <Route element={<Navigate replace to="/inbox" />} path="*" />
    </Routes>
  );
}
