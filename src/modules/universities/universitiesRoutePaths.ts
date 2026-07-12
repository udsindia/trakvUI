const UNIVERSITIES_BASE_PATH = "/universities";

export const universitiesRoutePaths = {
  search: UNIVERSITIES_BASE_PATH,
  university: `${UNIVERSITIES_BASE_PATH}/:universityId`,
  course: `${UNIVERSITIES_BASE_PATH}/:universityId/courses/:courseId`,
} as const;

export function universityDetailsPath(universityId: string) {
  return `${UNIVERSITIES_BASE_PATH}/${universityId}`;
}

export function courseDetailsPath(universityId: string, courseId: string) {
  return `${UNIVERSITIES_BASE_PATH}/${universityId}/courses/${courseId}`;
}
