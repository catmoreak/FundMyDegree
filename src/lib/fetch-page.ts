const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

export interface FetchedPage {
  ok: boolean;
  status: number;
  html: string | null;
}

/** Fetches a scholarship page server-side with a hard timeout. */
export async function fetchPageHtml(url: string, timeoutMs = 6000): Promise<FetchedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ScholarshipFinderBot/1.0; +hackathon-project)",
      },
    });
    if (!res.ok) return { ok: false, status: res.status, html: null };
    return { ok: true, status: res.status, html: await res.text() };
  } catch {
    return { ok: false, status: 0, html: null };
  } finally {
    clearTimeout(timeout);
  }
}

export function htmlToText(html: string, maxLength = 20000): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function stripChrome(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
}

/** Pulls the text of list items out of a page — where application steps usually live. */
export function extractListItems(html: string): string[] {
  const items: string[] = [];
  const pattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripChrome(html))) !== null) {
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 20 && text.length <= 240) items.push(text);
    if (items.length >= 400) break;
  }
  return items;
}

export interface PageSection {
  heading: string;
  html: string;
}

/**
 * Splits a page into heading-delimited sections, so an "How to apply" or
 * "Eligibility" heading can be matched and only its own content read.
 */
export function extractSections(html: string): PageSection[] {
  const body = stripChrome(html);
  const headingPattern = /<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi;

  const sections: PageSection[] = [];
  const matches = [...body.matchAll(headingPattern)];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const heading = decodeEntities(current[1].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (!heading) continue;

    const start = (current.index ?? 0) + current[0].length;
    const end = matches[i + 1]?.index ?? body.length;
    sections.push({ heading, html: body.slice(start, end) });
  }

  return sections;
}
