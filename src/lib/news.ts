import { searchGoogleNews } from "./serpapi";
import type { NewsFlag } from "./types";

const FLAG_PATTERNS: Array<{ type: NewsFlag["type"]; pattern: RegExp }> = [
  { type: "extended", pattern: /deadline\s+(?:has been|is|was)?\s*extended/i },
  { type: "postponed", pattern: /postponed|rescheduled/i },
  { type: "cancelled", pattern: /cancell?ed/i },
  { type: "closed", pattern: /applications?\s+(?:are\s+)?closed|no longer accepting/i },
];

/**
 * Cross-checks a candidate scholarship via Google News to catch recently
 * extended/closed/postponed deadlines that the main search result's cached
 * snippet might not reflect.
 */
export async function checkNewsForFlags(scholarshipTitle: string): Promise<NewsFlag[]> {
  const news = await searchGoogleNews(`${scholarshipTitle} scholarship deadline`);
  const flags: NewsFlag[] = [];

  for (const item of news) {
    const text = `${item.title} ${item.snippet}`;
    for (const { type, pattern } of FLAG_PATTERNS) {
      if (pattern.test(text)) {
        flags.push({ type, title: item.title, link: item.link, snippet: item.snippet });
        break;
      }
    }
  }

  return flags;
}
