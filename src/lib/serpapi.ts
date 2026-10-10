import type { RelatedQuestion, YouTubeVideo } from "./types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

export interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface NewsResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

function getApiKey(): string {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    throw new Error(
      "SERPAPI_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return key;
}

async function callSerpApi(params: Record<string, string>) {
  const search = new URLSearchParams({ ...params, api_key: getApiKey() });
  const res = await fetch(`${SERPAPI_BASE}?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`SerpAPI request failed with status ${res.status}`);
  }
  return res.json();
}

function toOrganicResults(data: unknown): OrganicResult[] {
  const organic = ((data as { organic_results?: unknown[] }).organic_results ??
    []) as Array<{
    title?: string;
    link?: string;
    snippet?: string;
    source?: string;
    displayed_link?: string;
  }>;

  return organic
    .filter((r) => r.title && r.link)
    .map((r) => ({
      title: r.title!,
      link: r.link!,
      snippet: r.snippet ?? "",
      source: r.source ?? r.displayed_link ?? new URL(r.link!).hostname,
    }));
}

/** Searches Google (via SerpAPI) for scholarships matching the built query. */
export async function searchGoogle(
  query: string,
  num = 10
): Promise<OrganicResult[]> {
  const data = await callSerpApi({
    engine: "google",
    q: query,
    num: String(num),
    hl: "en",
  });
  return toOrganicResults(data);
}

/** Cross-checks a candidate scholarship via Google News to catch recently extended/closed ones. */
export async function searchGoogleNews(
  query: string,
  num = 5
): Promise<NewsResult[]> {
  let data: unknown;
  try {
    data = await callSerpApi({ engine: "google_news", q: query, hl: "en" });
  } catch {
    return [];
  }

  const items = ((data as { news_results?: unknown[] }).news_results ??
    []) as Array<{
    title?: string;
    link?: string;
    snippet?: string;
    date?: string;
  }>;

  return items
    .filter((r) => r.title && r.link)
    .slice(0, num)
    .map((r) => ({
      title: r.title!,
      link: r.link!,
      snippet: r.snippet ?? "",
      date: r.date,
    }));
}

/**
 * Google search for application guidance. Also returns Google's "People also
 * ask" block, which is a good source of concrete application questions.
 */
export async function searchGoogleApplyInfo(query: string): Promise<{
  organic: OrganicResult[];
  relatedQuestions: RelatedQuestion[];
}> {
  const data = await callSerpApi({
    engine: "google",
    q: query,
    num: "8",
    hl: "en",
  });

  const rawQuestions = ((data as { related_questions?: unknown[] })
    .related_questions ?? []) as Array<{
    question?: string;
    snippet?: string;
    link?: string;
    title?: string;
    displayed_link?: string;
    list?: string[];
  }>;

  const relatedQuestions: RelatedQuestion[] = rawQuestions
    .filter((q) => q.question)
    .slice(0, 6)
    .map((q) => ({
      question: q.question!,
      snippet: q.snippet ?? (q.list ?? []).join(" • "),
      link: q.link ?? "",
      source: q.title ?? q.displayed_link ?? "",
    }));

  return { organic: toOrganicResults(data), relatedQuestions };
}

/** Finds walkthrough/guide videos for a scholarship via SerpAPI's YouTube engine. */
export async function searchYouTube(
  query: string,
  num = 6
): Promise<YouTubeVideo[]> {
  let data: unknown;
  try {
    data = await callSerpApi({ engine: "youtube", search_query: query });
  } catch {
    return [];
  }

  const videos = ((data as { video_results?: unknown[] }).video_results ??
    []) as Array<{
    title?: string;
    link?: string;
    length?: string;
    views?: number;
    published_date?: string;
    description?: string;
    channel?: { name?: string };
    thumbnail?: { static?: string };
  }>;

  return videos
    .filter((v) => v.title && v.link)
    .slice(0, num)
    .map((v) => ({
      title: v.title!,
      link: v.link!,
      channel: v.channel?.name ?? "",
      thumbnail: v.thumbnail?.static ?? null,
      length: v.length ?? null,
      views: typeof v.views === "number" ? v.views : null,
      publishedDate: v.published_date ?? null,
      description: v.description ?? "",
    }));
}
