import type { IncomeBracket, DegreeLevel, ScoreBreakdown, StudentProfile } from "./types";

const DEGREE_KEYWORDS: Record<DegreeLevel, string[]> = {
  "high-school": ["high school", "undergraduate", "freshman"],
  associate: ["associate degree", "community college", "undergraduate"],
  bachelors: ["bachelor", "undergraduate", "undergrad", "ba ", "bs ", "bsc"],
  masters: ["master", "graduate", "msc", "ma ", "mba", "postgraduate"],
  phd: ["phd", "doctoral", "doctorate", "postdoc"],
};

const INCOME_KEYWORDS: Record<IncomeBracket, string[]> = {
  low: [
    "low-income",
    "low income",
    "need-based",
    "need based",
    "financial need",
    "underprivileged",
    "disadvantaged",
    "first-generation",
  ],
  middle: ["merit-based", "merit based", "middle-income", "middle income"],
  high: ["merit-based", "merit based", "academic excellence"],
  unspecified: [],
};

/** Weighted keyword-overlap score between the student's profile and a result's text. */
export function computeFitScore(profile: StudentProfile, text: string): number {
  const t = text.toLowerCase();
  let score = 0;
  let max = 0;

  const fieldWords = profile.fieldOfStudy
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  max += 2;
  if (fieldWords.length > 0 && fieldWords.some((w) => t.includes(w))) score += 2;

  max += 1.5;
  if (profile.country && t.includes(profile.country.toLowerCase())) score += 1.5;

  const degreeKeywords = DEGREE_KEYWORDS[profile.degreeLevel] ?? [];
  max += 1;
  if (degreeKeywords.some((k) => t.includes(k))) score += 1;

  const incomeKeywords = INCOME_KEYWORDS[profile.incomeBracket] ?? [];
  if (incomeKeywords.length > 0) {
    max += 1;
    if (incomeKeywords.some((k) => t.includes(k))) score += 1;
  }

  max += 0.5;
  if (/scholarship|grant|fellowship|bursary/.test(t)) score += 0.5;

  return max > 0 ? score / max : 0.5;
}

/**
 * Scores deadline proximity: a non-expired deadline a few weeks to a few
 * months out is ideal (enough time to prepare, still current); expired
 * deadlines are penalized heavily; unknown deadlines get a neutral score.
 */
export function computeDeadlineScore(deadlineDate: Date | null): number {
  if (!deadlineDate) return 0.6;

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = (deadlineDate.getTime() - now.getTime()) / msPerDay;

  if (daysUntil < 0) return 0.05;
  if (daysUntil <= 7) return 0.5;
  if (daysUntil <= 180) return 1;
  return 0.7;
}

/** Scores award size on a log scale so a $500 vs $5,000 gap matters more than $40k vs $45k. */
export function computeAwardScore(amountUsdEquivalent: number | null): number {
  if (amountUsdEquivalent === null) return 0.5;
  if (amountUsdEquivalent <= 0) return 0.1;
  const score = Math.log10(amountUsdEquivalent) / Math.log10(50000);
  return Math.max(0, Math.min(1, score));
}

const WEIGHTS = { fit: 0.45, deadline: 0.3, award: 0.25 };

export function computeTotalScore(
  fit: number,
  deadline: number,
  award: number
): ScoreBreakdown {
  const total = fit * WEIGHTS.fit + deadline * WEIGHTS.deadline + award * WEIGHTS.award;
  return { fit, deadline, award, total };
}
