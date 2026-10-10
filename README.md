# FundMyDegree

Finds scholarships you can actually still apply for, and ranks them.

Enter your field of study, country, degree level and income bracket. The app then:

- searches Google for matching scholarships
- checks Google News for deadlines that moved or closed
- fetches each official page to confirm it's still live
- ranks what's left by fit, deadline proximity and award size

Click any result to get the application steps, required documents, common questions and YouTube
walkthroughs.

All external data comes from [SerpAPI](https://serpapi.com) (Google Search, Google News, YouTube).

## Setup

Needs Node 20+ and a SerpAPI key.

```bash
npm install
cp .env.local.example .env.local   # add your key to SERPAPI_KEY
npm run dev
```

Open http://localhost:3000.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui.

## Notes

- No LLM is used. Deadlines and amounts are extracted with regex, so some pages show
  "Deadline not found" instead of a guess.
- Roughly 10 SerpAPI credits per search, plus 2 when you open a scholarship's apply guide.
- Verification only means the page was reachable and didn't look closed. Confirm eligibility on
  the official site before applying.
