import type { StudentProfile } from "@/modules/universities/universities.types";

export const MOCK_STUDENT: StudentProfile = {
  id: "rohan-desai",
  name: "Rohan Desai",
  ieltsOverall: 7.0,
  ieltsWriting: 6.5,
  ieltsSpeaking: 6.5,
  degree: "B.Tech CS",
  university: "BITS Pilani",
  percentage: 78.4,
};

export const MOCK_STUDENTS: StudentProfile[] = [
  MOCK_STUDENT,
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    ieltsOverall: 7.5,
    ieltsWriting: 7.0,
    ieltsSpeaking: 7.0,
    degree: "B.Tech IT",
    university: "DTU Delhi",
    percentage: 82.1,
  },
  {
    id: "amit-patel",
    name: "Amit Patel",
    ieltsOverall: 6.0,
    ieltsWriting: 5.5,
    ieltsSpeaking: 6.0,
    degree: "B.Sc Mathematics",
    university: "Mumbai University",
    percentage: 68.5,
  },
];
