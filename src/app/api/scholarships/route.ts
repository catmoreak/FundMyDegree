import { NextResponse } from "next/server";
import { searchGoogle } from "@/lib/serpapi";
import { buildSearchQuery } from "@/lib/query";
import { extractDeadline, extractAward } from "@/lib/extract";
import { computeFitScore, computeDeadlineScore, computeAwardScore, computeTotalScore } from "@/lib/score";
import { verifyOfficialSite } from "@/lib/verify";
import { checkNewsForFlags } from "@/lib/news";
import type { ScholarshipResult, StudentProfile, ScholarshipSearchResponse } from "@/lib/types";

const MAX_CANDIDATES = 8;

function isStudentProfile(body: unknown): body is StudentProfile {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.degreeLevel === "string" &&
    typeof b.fieldOfStudy === "string" &&
    b.fieldOfStudy.trim().length > 0 &&
    typeof b.country === "string" &&
    b.country.trim().length > 0 &&
    typeof b.incomeBracket === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isStudentProfile(body)) {
    return NextResponse.json(
      { error: "Missing required profile fields: degreeLevel, fieldOfStudy, country, incomeBracket." },
      { status: 400 }
    );
  }
  const profile = body;

  const query = buildSearchQuery(profile);

  let organicResults;
  try {
    organicResults = await searchGoogle(query, MAX_CANDIDATES);
  } catch (err) {
    const message = err instanceof Error ? err.message : "SerpAPI search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const results: ScholarshipResult[] = await Promise.all(
    organicResults.map(async (candidate, index) => {
      const [verification, newsFlags] = await Promise.all([
        verifyOfficialSite(candidate.link),
        checkNewsForFlags(candidate.title).catch(() => []),
      ]);

      const combinedText = [
        candidate.title,
        candidate.snippet,
        verification.pageText ?? "",
      ].join(" ");

      const deadline = extractDeadline(combinedText);
      const award = extractAward(combinedText);

      const fit = computeFitScore(profile, combinedText);
      const deadlineScore = computeDeadlineScore(deadline?.date ?? null);
      const awardScore = computeAwardScore(award?.amountUsdEquivalent ?? null);

      // Any "closed/extended/cancelled" news flag is a strong negative signal
      // regardless of what the cached search snippet says.
      const hasBadNews = newsFlags.some((f) => f.type !== "extended");
      const scores = computeTotalScore(fit, deadlineScore, hasBadNews ? awardScore * 0.5 : awardScore);

      return {
        id: `${index}-${candidate.link}`,
        title: candidate.title,
        link: candidate.link,
        source: candidate.source ?? new URL(candidate.link).hostname,
        snippet: candidate.snippet,
        deadlineText: deadline?.text ?? null,
        deadlineDate: deadline?.date.toISOString() ?? null,
        awardText: award?.text ?? null,
        awardAmount: award?.amountUsdEquivalent ?? null,
        verified: verification.verified && !hasBadNews,
        verificationNote: hasBadNews
          ? "Recent news suggests this scholarship's status or deadline has changed — check before applying."
          : verification.note,
        newsFlags,
        scores,
      } satisfies ScholarshipResult;
    })
  );

  results.sort((a, b) => b.scores.total - a.scores.total);

  const response: ScholarshipSearchResponse = {
    query,
    generatedAt: new Date().toISOString(),
    results,
  };

  return NextResponse.json(response);
}
