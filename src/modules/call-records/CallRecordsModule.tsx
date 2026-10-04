import { Navigate, Route, Routes } from "react-router-dom";
import { CallRecordDetailsPage } from "@/modules/call-records/pages/CallRecordDetailsPage";
import { CallRecordsPage } from "@/modules/call-records/pages/CallRecordsPage";

export default function CallRecordsModule() {
  return (
    <Routes>
      <Route element={<CallRecordsPage />} index />
      <Route element={<CallRecordDetailsPage />} path="details" />
      <Route element={<Navigate replace to="/call-records" />} path="*" />
    </Routes>
  );
}
