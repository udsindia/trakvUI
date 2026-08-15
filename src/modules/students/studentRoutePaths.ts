export const studentRoutePaths = {
  root: "/students",
  details: (studentId: string) => `/students/${studentId}`,
  edit: (studentId: string) => `/students/${studentId}/edit`,
} as const;
