const STUDENTS_BASE_PATH = "/students";

export const studentsRoutePaths = {
  list: STUDENTS_BASE_PATH,
  details: `${STUDENTS_BASE_PATH}/:id`,
} as const;

export function studentDetailsPath(studentId: string) {
  return `${STUDENTS_BASE_PATH}/${studentId}`;
}
