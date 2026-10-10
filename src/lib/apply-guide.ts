import { extractListItems, fetchPageHtml, htmlToText } from "./fetch-page";
import { searchGoogleApplyInfo, searchYouTube } from "./serpapi";
import type { ApplyGuide } from "./types";

const STEP_PATTERN =
  /\b(appl(?:y|ication)|submit|register|create an account|sign up|fill (?:in|out)|upload|complete the|send (?:your|the)|attach|log in)\b/i;

const REQUIREMENT_PATTERN =
  /\b(requir|document|eligib|must be|must have|transcript|essay|letter of recommendation|recommendation letter|proof of|certificate|passport|national id|minimum (?:gpa|grade|score)|citizen|enrolled|income)\b/i;

const NOISE_PATTERN =
  /\b(cookie|privacy policy|terms of (?:use|service)|subscribe|newsletter|follow us|all rights reserved|sign in to|advertisement)\b/i;

function pickSentences(text: string, pattern: RegExp, limit: number): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 240);

  const picked: string[] = [];
  for (const sentence of sentences) {
    if (!pattern.test(sentence) || NOISE_PATTERN.test(sentence)) continue;
    picked.push(sentence);
    if (picked.length >= limit) break;
  }
  return picked;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().replace(/\W+/g, " ").trim();
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Builds a "how to apply" guide for one scholarship: steps and requirements
 * scraped from the official page, backed up by SerpAPI's Google results,
 * "People also ask" questions, and YouTube walkthrough videos.
 */
export async function buildApplyGuide(
  title: string,
  link: string
): Promise<ApplyGuide> {
  const [page, googleInfo, videos] = await Promise.all([
    fetchPageHtml(link),
    searchGoogleApplyInfo(
      `${title} scholarship how to apply eligibility required documents`
    ),
    searchYouTube(`${title} scholarship application guide how to apply`),
  ]);

  let steps: string[] = [];
  let requirements: string[] = [];

  if (page.html) {
    const listItems = extractListItems(page.html).filter(
      (item) => !NOISE_PATTERN.test(item)
    );
    steps = listItems.filter((item) => STEP_PATTERN.test(item)).slice(0, 8);
    requirements = listItems
      .filter((item) => REQUIREMENT_PATTERN.test(item) && !steps.includes(item))
      .slice(0, 8);

    // Pages that don't use lists for instructions — fall back to sentences.
    const text = htmlToText(page.html);
    if (steps.length < 3) {
      steps = dedupe([...steps, ...pickSentences(text, STEP_PATTERN, 6)]).slice(0, 6);
    }
    if (requirements.length < 3) {
      requirements = dedupe([
        ...requirements,
        ...pickSentences(text, REQUIREMENT_PATTERN, 6),
      ]).slice(0, 6);
    }
  }

  // Last resort: use the search snippets SerpAPI returned for the apply query.
  if (steps.length === 0) {
    steps = dedupe(
      googleInfo.organic
        .map((r) => r.snippet)
        .filter((s) => s.length > 40 && STEP_PATTERN.test(s))
    ).slice(0, 5);
  }

  return {
    steps: dedupe(steps),
    requirements: dedupe(requirements).filter((r) => !steps.includes(r)),
    applyLinks: googleInfo.organic.slice(0, 5).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    })),
    relatedQuestions: googleInfo.relatedQuestions,
    videos,
    officialPageReachable: page.ok,
  };
}
