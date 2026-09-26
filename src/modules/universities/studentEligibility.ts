import type { Course, EligibilityStatus, StudentProfile } from "@/modules/universities/universities.types";

type EligibilityResult = {
  eligibilityStatus: EligibilityStatus;
  eligibilityPercent: number;
  eligibilityWarning?: string;
  eligibilityHint?: string;
};

export function computeCourseEligibility(
  course: Pick<Course, "ieltsMin" | "ieltsPerBand" | "ieltsLabel">,
  student: StudentProfile,
): EligibilityResult {
  const lowestBand = Math.min(
    student.ieltsOverall,
    student.ieltsWriting,
    student.ieltsSpeaking,
  );
  const perBandRequired = course.ieltsPerBand ?? 6.0;

  if (student.ieltsOverall < course.ieltsMin) {
    return {
      eligibilityStatus: "not-eligible",
      eligibilityPercent: 0,
      eligibilityHint: `Requires ${course.ieltsLabel}. ${student.name}'s overall score is ${student.ieltsOverall}.`,
    };
  }

  if (course.ieltsPerBand && lowestBand < course.ieltsPerBand) {
    return {
      eligibilityStatus: "not-eligible",
      eligibilityPercent: 25,
      eligibilityHint: `Requires IELTS ${course.ieltsPerBand} in each band. ${student.name}'s lowest band is ${lowestBand}.`,
    };
  }

  let score = 0;
  const degreeMet = student.percentage >= 60;
  const overallMet = student.ieltsOverall >= course.ieltsMin;
  const perBandMet = lowestBand >= perBandRequired;
  const perBandRisk = !perBandMet && lowestBand >= perBandRequired - 0.5;
  const relevantDegree = /cs|computer|tech|engineering|data/i.test(student.degree);

  if (degreeMet) score += 25;
  if (overallMet) score += 25;
  if (perBandMet) score += 25;
  else if (perBandRisk) score += 12;
  if (relevantDegree) score += 25;

  const eligibilityPercent = score;
  let eligibilityStatus: EligibilityStatus = "not-eligible";

  if (eligibilityPercent >= 90) {
    eligibilityStatus = "eligible";
  } else if (eligibilityPercent >= 70) {
    eligibilityStatus = "partial";
  }

  return {
    eligibilityStatus,
    eligibilityPercent,
    eligibilityWarning: perBandRisk ? "W/S band risk" : undefined,
  };
}

export function resolveStudentSelection(
  value: StudentProfile | string | null,
  knownStudents: StudentProfile[],
): StudentProfile | null {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmedName = value.trim();
  if (!trimmedName) {
    return null;
  }

  const matchedStudent = knownStudents.find(
    (student) => student.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (matchedStudent) {
    return matchedStudent;
  }

  return {
    id: `custom-${trimmedName.toLowerCase().replace(/\s+/g, "-")}`,
    name: trimmedName,
    ieltsOverall: 6.5,
    ieltsWriting: 6.5,
    ieltsSpeaking: 6.5,
    degree: "Bachelor's degree",
    university: "—",
    percentage: 70,
  };
}
