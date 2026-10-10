import {
  extractListItems,
  extractSections,
  fetchPageHtml,
  htmlToText,
  type PageSection,
} from "./fetch-page";
import { searchGoogleApplyInfo, searchYouTube } from "./serpapi";
import type { ApplyGuide } from "./types";

const STEP_HEADING_PATTERN =
  /how to apply|application (?:process|procedure|steps|instructions)|steps to apply|applying|submit your application/i;

const REQUIREMENT_HEADING_PATTERN =
  /eligib|requirement|documents?|who can apply|criteria|qualif/i;

const STEP_PATTERN =
  /\b(appl(?:y|ication)|submit|register|create an account|sign up|fill (?:in|out)|upload|complete the|send (?:your|the)|attach|log in)\b/i;

const REQUIREMENT_PATTERN =
  /\b(requir|document|eligib|must be|must have|transcript|essay|letter of recommendation|recommendation letter|proof of|certificate|passport|national id|minimum (?:gpa|grade|score)|citizen|enrolled|income)\b/i;

const NOISE_PATTERN =
  /\b(cookie|privacy policy|terms of (?:use|service)|subscribe|newsletter|follow us|all rights reserved|sign in to|advertisement|share this|related posts)\b/i;

/**
 * Site navigation and marketing copy that reads like an instruction but isn't.
 * Aggregator pages are full of these ("Get insights, advice and tips…").
 */
const BOILERPLATE_PATTERN =
  /\b(get insights|advice and tips|not sure where|browse (?:our|all|more)|search for courses|find a course|compare (?:courses|universities)|create (?:a free|your free) account|download (?:our|the) (?:app|guide)|talk to (?:us|an advisor)|book a (?:free )?consultation|read more|learn more about our|view all|see more)\b/i;

/** Keeps SerpAPI results/questions that are actually about scholarships. */
const RELEVANCE_PATTERN =
  /\b(scholarship|grant|fellowship|bursary|financial aid|funding|appl(?:y|ication)|eligib|tuition|stipend)\b/i;

function cleanText(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Rejects nav links, marketing copy and questions masquerading as instructions. */
function isUsableInstruction(text: string): boolean {
  if (NOISE_PATTERN.test(text) || BOILERPLATE_PATTERN.test(text)) return false;
  if (text.trim().endsWith("?")) return false;
  // Nav items are short fragments without sentence structure.
  return text.split(/\s+/).length >= 5;
}

const ABBREVIATIONS = /\b(U\.S\.A?|U\.K|Ph\.D|i\.e|e\.g|etc|vs|No|Mr|Mrs|Ms|Dr|Prof|Inc|Jr|Sr)\./gi;
const DOT_PLACEHOLDER = "\u0001";

/**
 * Splits text into sentences and keeps the ones about `pattern`. Abbreviations
 * are masked first so "U.S." doesn't split a sentence into fragments, and
 * fragments that start mid-sentence (lowercase) are dropped.
 */
function pickSentences(text: string, pattern: RegExp, limit: number): string[] {
  const masked = text.replace(ABBREVIATIONS, (m) => m.replace(/\./g, DOT_PLACEHOLDER));

  const picked: string[] = [];
  for (const raw of masked.split(/(?<=[.!?])\s+(?=["'“(]?[A-Z0-9])/)) {
    const sentence = raw.replaceAll(DOT_PLACEHOLDER, ".").trim();
    if (sentence.length < 45 || sentence.length > 240) continue;
    if (!/^["'“(]?[A-Z0-9]/.test(sentence)) continue;
    if (!pattern.test(sentence) || !isUsableInstruction(sentence)) continue;
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

/** Reads the content under headings that match a topic (e.g. "How to apply"). */
function fromMatchingSections(
  sections: PageSection[],
  headingPattern: RegExp,
  bodyPattern: RegExp,
  limit: number
): string[] {
  const found: string[] = [];

  for (const section of sections) {
    if (!headingPattern.test(section.heading)) continue;

    const listItems = extractListItems(section.html)
      .map(cleanText)
      .filter((item) => item.length >= 20 && isUsableInstruction(item));

    if (listItems.length > 0) {
      found.push(...listItems);
    } else {
      found.push(...pickSentences(htmlToText(section.html, 6000), bodyPattern, limit));
    }

    if (found.length >= limit) break;
  }

  return dedupe(found).slice(0, limit);
}

/** Strips Google's truncation and trailing site name from a result title. */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\.{3,}\s*$/, "")
    .replace(/\s*[|–—-]\s*[^|–—-]{0,40}$/, (match) =>
      /scholarship|grant|fellowship|fund/i.test(match) ? match : ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildApplyQuery(title: string): string {
  const base = cleanTitle(title);
  const needsKeyword = !/scholarship|grant|fellowship|bursary/i.test(base);
  return `${base}${needsKeyword ? " scholarship" : ""} how to apply`;
}

/**
 * Builds a "how to apply" guide for one scholarship: steps and requirements
 * read from the official page, plus SerpAPI's Google results, "People also
 * ask" questions, and YouTube walkthrough videos.
 */
export async function buildApplyGuide(
  title: string,
  link: string
): Promise<ApplyGuide> {
  const applyQuery = buildApplyQuery(title);

  const [page, googleInfo, videos] = await Promise.all([
    fetchPageHtml(link),
    searchGoogleApplyInfo(applyQuery),
    searchYouTube(`${applyQuery} guide`),
  ]);

  let steps: string[] = [];
  let requirements: string[] = [];

  if (page.html) {
    const sections = extractSections(page.html);
    steps = fromMatchingSections(sections, STEP_HEADING_PATTERN, STEP_PATTERN, 8);
    requirements = fromMatchingSections(
      sections,
      REQUIREMENT_HEADING_PATTERN,
      REQUIREMENT_PATTERN,
      8
    );

    // Pages without clear headings — fall back to scanning the whole page.
    if (steps.length < 2 || requirements.length < 2) {
      const listItems = extractListItems(page.html).filter(isUsableInstruction);
      if (steps.length < 2) {
        steps = dedupe([
          ...steps,
          ...listItems.filter((item) => STEP_PATTERN.test(item)),
        ]).slice(0, 6);
      }
      if (requirements.length < 2) {
        requirements = dedupe([
          ...requirements,
          ...listItems.filter((item) => REQUIREMENT_PATTERN.test(item)),
        ]).slice(0, 6);
      }

      const text = htmlToText(page.html);
      if (steps.length < 2) {
        steps = dedupe([...steps, ...pickSentences(text, STEP_PATTERN, 5)]).slice(0, 5);
      }
      if (requirements.length < 2) {
        requirements = dedupe([
          ...requirements,
          ...pickSentences(text, REQUIREMENT_PATTERN, 5),
        ]).slice(0, 5);
      }
    }
  }

  // Last resort: the snippets SerpAPI returned for the "how to apply" query.
  if (steps.length === 0) {
    steps = dedupe(
      googleInfo.organic
        .map((r) => r.snippet)
        .filter(
          (s) =>
            s.length > 40 &&
            STEP_PATTERN.test(s) &&
            RELEVANCE_PATTERN.test(s) &&
            isUsableInstruction(s)
        )
    ).slice(0, 5);
  }

  const stepSet = new Set(steps);

  return {
    steps,
    requirements: requirements.filter((r) => !stepSet.has(r)),
    applyLinks: googleInfo.organic
      .filter((r) => RELEVANCE_PATTERN.test(`${r.title} ${r.snippet}`))
      .slice(0, 5)
      .map((r) => ({ title: r.title, link: r.link, snippet: r.snippet })),
    relatedQuestions: googleInfo.relatedQuestions.filter((q) =>
      RELEVANCE_PATTERN.test(`${q.question} ${q.snippet}`)
    ),
    videos,
    officialPageReachable: page.ok,
  };
}
