/**
 * Fields of study offered as suggestions when a course is added.
 *
 * The course finder's Field of Study filter lists the subjects stored on the tenant's
 * courses, so what is typed here is what counsellors can later filter on. The course form
 * used to have no such field and saved every course as "General", which left the filter
 * with that one option. The list is a starting point, not a whitelist: any subject can be
 * typed, and the ones already in use are suggested alongside it so spellings stay the same.
 */
export const FIELDS_OF_STUDY = [
  "Accounting & Finance",
  "Agriculture",
  "Architecture",
  "Arts & Design",
  "Biological Sciences",
  "Business & Management",
  "Chemistry",
  "Computer Science",
  "Cyber Security",
  "Data Science & Analytics",
  "Economics",
  "Education",
  "Engineering",
  "Environmental Science",
  "Health & Medicine",
  "Hospitality & Tourism",
  "Humanities",
  "Law",
  "Marketing",
  "Mathematics",
  "Media & Communication",
  "Nursing",
  "Pharmacy",
  "Physics",
  "Project Management",
  "Psychology",
  "Public Health",
  "Social Sciences",
] as const;

/**
 * The subjects already on courses, then the standard list, one entry per subject whatever
 * its case. A stored spelling wins over the standard one, so the suggestion matches what
 * the finder will filter on.
 */
export function mergeFieldsOfStudy(existing: readonly string[] = []): string[] {
  const seen = new Map<string, string>();
  for (const value of [...existing, ...FIELDS_OF_STUDY]) {
    const trimmed = value?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.set(trimmed.toLowerCase(), trimmed);
    }
  }
  return [...seen.values()].sort((left, right) => left.localeCompare(right));
}

/**
 * The finder option matching a student's field of study, or undefined.
 *
 * The student's value is free text from the lead form ("Not Specified" is common), so only
 * an exact, case-insensitive match is used. A looser match would pre-select a filter the
 * counsellor did not ask for and silently narrow the results.
 */
export function matchFieldOfStudy<T extends { label: string; value: string }>(
  studentField: string | null | undefined,
  options: readonly T[],
): T | undefined {
  const wanted = studentField?.trim().toLowerCase();
  if (!wanted) return undefined;
  return options.find(
    (option) =>
      option.value.trim().toLowerCase() === wanted || option.label.trim().toLowerCase() === wanted,
  );
}
