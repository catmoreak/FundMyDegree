export type DegreeLevel =
  | "high-school"
  | "associate"
  | "bachelors"
  | "masters"
  | "phd";

export type IncomeBracket = "low" | "middle" | "high" | "unspecified";

export interface StudentProfile {
  degreeLevel: DegreeLevel;
  fieldOfStudy: string;
  country: string;
  incomeBracket: IncomeBracket;
}

export interface ScoreBreakdown {
  fit: number;
  deadline: number;
  award: number;
  total: number;
}

export interface NewsFlag {
  type: "extended" | "closed" | "postponed" | "cancelled";
  title: string;
  link: string;
  snippet: string;
}

export interface ScholarshipResult {
  id: string;
  title: string;
  link: string;
  source: string;
  snippet: string;
  deadlineText: string | null;
  deadlineDate: string | null;
  awardText: string | null;
  awardAmount: number | null;
  verified: boolean;
  verificationNote: string;
  newsFlags: NewsFlag[];
  scores: ScoreBreakdown;
}

export interface ScholarshipSearchResponse {
  query: string;
  generatedAt: string;
  results: ScholarshipResult[];
}

export interface RelatedQuestion {
  question: string;
  snippet: string;
  link: string;
  source: string;
}

export interface YouTubeVideo {
  title: string;
  link: string;
  channel: string;
  thumbnail: string | null;
  length: string | null;
  views: number | null;
  publishedDate: string | null;
  description: string;
}

export interface ApplyGuide {
  steps: string[];
  requirements: string[];
  applyLinks: Array<{ title: string; link: string; snippet: string }>;
  relatedQuestions: RelatedQuestion[];
  videos: YouTubeVideo[];
  officialPageReachable: boolean;
}
