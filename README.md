# Scholarship & Grant Finder

A student enters their profile (degree level, field of study, country, GPA, income bracket) and
the app:

1. **Searches Google** (via SerpAPI) for scholarships matching the profile.
2. **Cross-checks via Google News** (via SerpAPI) to catch recently extended, postponed, or
   closed deadlines that a cached search snippet wouldn't show.
3. **Verifies** each result is still live by fetching the official page server-side.
4. **Ranks** results by `fit × deadline proximity × award size`.

Then, for any scholarship you pick ("How to apply"):

5. **Extracts the application steps and eligibility/documents** from the official page.
6. **Pulls application guides and FAQs** from Google + Google's "People also ask" (via SerpAPI).
7. **Finds walkthrough videos** on YouTube (via SerpAPI's YouTube engine).

Built with Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. SerpAPI is the only
external data source — Google Search, Google News, and YouTube all go through it.

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and add your SerpAPI key from https://serpapi.com/manage-api-key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- `src/lib/query.ts` builds the Google search query from the student's profile.
- `src/lib/serpapi.ts` wraps SerpAPI's Google Search, Google News, and YouTube engines.
- `src/lib/fetch-page.ts` fetches and parses official pages (text, list items, and
  heading-delimited sections).
- `src/lib/verify.ts` confirms a scholarship page is still live and doesn't say "closed" /
  "no longer accepting applications".
- `src/lib/news.ts` searches Google News per candidate for "extended / postponed / cancelled /
  closed" signals.
- `src/lib/extract.ts` pulls deadlines and award amounts out of page/snippet text with regex.
- `src/lib/score.ts` computes the fit, deadline-proximity, and award-size scores and combines
  them into a final ranking.
- `src/lib/apply-guide.ts` builds the "how to apply" guide: steps/requirements from the
  official page's own sections, plus SerpAPI apply links, "People also ask" FAQs, and videos.
- `src/app/api/scholarships/route.ts` orchestrates search → news check → verify → rank.
- `src/app/api/scholarship-detail/route.ts` serves the apply guide + videos, loaded lazily when
  you open a scholarship so it only spends credits on scholarships you care about.

## Notes

- Deadline and amount extraction is regex-based (no LLM call), so it's fast and keeps the only
  required API key to SerpAPI. It won't catch every page layout — results show a "Deadline not
  found" / "Amount not specified" badge when extraction fails, so you can still open the official
  link and check manually.
- Each search runs up to 8 candidate scholarships through a live fetch + a Google News check, so
  expect a few seconds per search and a handful of SerpAPI credits per submission. Opening
  "How to apply" spends 2 more (one Google, one YouTube).
