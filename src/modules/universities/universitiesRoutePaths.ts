const UNIVERSITIES_BASE_PATH = "/courses";

/**
 * Where a university's own pages live.
 *
 * Separate from the course finder's base above: both modules mount the same detail
 * components, but a link to a university should land under /universities so the nav
 * highlights the section you are actually looking at.
 */
const UNIVERSITY_DETAIL_BASE_PATH = "/universities";

export const universitiesRoutePaths = {
  search: UNIVERSITIES_BASE_PATH,
  university: `${UNIVERSITIES_BASE_PATH}/:universityId`,
  course: `${UNIVERSITIES_BASE_PATH}/:universityId/courses/:courseId`,
} as const;

export function universityDetailsPath(universityId: string) {
  return `${UNIVERSITY_DETAIL_BASE_PATH}/${universityId}`;
}

export function courseDetailsPath(universityId: string, courseId: string) {
  return `${UNIVERSITY_DETAIL_BASE_PATH}/${universityId}/courses/${courseId}`;
}
