import { fetchPageHtml, htmlToText } from "./fetch-page";

const CLOSED_PATTERN =
  /no longer accepting applications|applications (?:are\s+)?closed|deadline has passed|this (?:scholarship|program) (?:is|has) (?:closed|ended|expired)|application period has ended/i;

export interface SiteVerification {
  verified: boolean;
  note: string;
  pageText: string | null;
}

/** Fetches the official scholarship page server-side to confirm it's still live/active. */
export async function verifyOfficialSite(url: string): Promise<SiteVerification> {
  const page = await fetchPageHtml(url);

  if (!page.ok || !page.html) {
    return {
      verified: false,
      note:
        page.status > 0
          ? `Official site responded with status ${page.status}.`
          : "Could not reach the official site to confirm status — verify manually.",
      pageText: null,
    };
  }

  const text = htmlToText(page.html);

  if (CLOSED_PATTERN.test(text)) {
    return {
      verified: false,
      note: "Official site indicates this scholarship may be closed or expired.",
      pageText: text,
    };
  }

  return {
    verified: true,
    note: "Confirmed reachable and live on the official site.",
    pageText: text,
  };
}
