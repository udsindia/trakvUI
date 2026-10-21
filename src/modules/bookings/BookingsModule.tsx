import { Navigate, Route, Routes } from "react-router-dom";
import { BookingsPage } from "@/modules/bookings/pages/BookingsPage";

export default function BookingsModule() {
  return (
    <Routes>
      <Route element={<BookingsPage />} index />
      <Route element={<Navigate replace to="/bookings" />} path="*" />
    </Routes>
  );
}
