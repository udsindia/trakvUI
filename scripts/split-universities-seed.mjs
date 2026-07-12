import fs from "node:fs";

const mockPath = "src/modules/universities/universitiesMockData.ts";
const seedPath = "src/modules/universities/universitiesSeedData.ts";
const content = fs.readFileSync(mockPath, "utf8");
const start = content.indexOf("export const UNIVERSITIES");
const end = content.indexOf("export function getUniversityById");
const arrays = content
  .slice(start, end)
  .replace("export const UNIVERSITIES", "export const SEED_UNIVERSITIES")
  .replace("export const COURSES", "export const SEED_COURSES");
const header =
  "import type { Course, University } from \"@/modules/universities/universities.types\";\n\n";

fs.writeFileSync(seedPath, header + arrays);
