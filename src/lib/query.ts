import type { StudentProfile } from "./types";

const DEGREE_LABELS: Record<StudentProfile["degreeLevel"], string> = {
  "high-school": "high school graduate",
  associate: "associate degree",
  bachelors: "undergraduate bachelor's",
  masters: "graduate master's",
  phd: "PhD doctoral",
};

const INCOME_LABELS: Record<StudentProfile["incomeBracket"], string> = {
  low: "low-income need-based",
  middle: "middle-income",
  high: "merit-based",
  unspecified: "",
};

/** Builds the Google search query SerpAPI will run from the student's profile. */
export function buildSearchQuery(profile: StudentProfile): string {
  const parts = [
    DEGREE_LABELS[profile.degreeLevel],
    profile.fieldOfStudy,
    "scholarship",
    INCOME_LABELS[profile.incomeBracket],
    "for students in",
    profile.country,
    new Date().getFullYear().toString(),
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
