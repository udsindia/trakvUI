import { Navigate, Route, Routes } from "react-router-dom";
import { PermissionGuard } from "@/app/router/PermissionGuard";
import { studentRoutes } from "@/modules/students/studentRoutes";

export default function StudentsModule() {
  return (
    <Routes>
      {studentRoutes.map(({ Component, index, key, path, requiredPermissions }) => (
        <Route
          key={key}
          element={
            <PermissionGuard allOf={requiredPermissions}>
              <Component />
            </PermissionGuard>
          }
          index={index}
          path={path}
        />
      ))}
      <Route element={<Navigate replace to="." />} path="*" />
    </Routes>
  );
}
