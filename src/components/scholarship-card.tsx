"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScoreMeter } from "@/components/score-meter";
import { ScholarshipDetailDialog } from "@/components/scholarship-detail-dialog";
import type { ScholarshipResult } from "@/lib/types";
import {
  BadgeCheck,
  CalendarClock,
  CircleHelp,
  ExternalLink,
  ListChecks,
  TriangleAlert,
  Wallet,
} from "lucide-react";

function deadlineDisplay(result: ScholarshipResult) {
  if (!result.deadlineDate) {
    return { label: "Deadline not found", className: "text-muted-foreground" };
  }
  const date = new Date(result.deadlineDate);
  const daysUntil = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (daysUntil < 0) return { label: `${label} · expired`, className: "text-destructive" };
  if (daysUntil <= 14) return { label: `${label} · ${daysUntil}d left`, className: "text-warning" };
  return { label: `${label} · ${daysUntil}d left`, className: "text-success" };
}

export function ScholarshipCard({
  result,
  rank,
}: {
  result: ScholarshipResult;
  rank: number;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const deadline = deadlineDisplay(result);

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand">
              {rank}
            </span>

            <div className="min-w-0 flex-1">
              <CardTitle className="leading-snug">
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {result.title}
                </a>
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{result.source}</span>
                {result.verified ? (
                  <Badge variant="outline" className="gap-1 text-success">
                    <BadgeCheck className="size-3.5" /> Verified live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <CircleHelp className="size-3.5" /> Unverified
                  </Badge>
                )}
              </div>
            </div>

            <ScoreMeter value={result.scores.total} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {result.snippet && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{result.snippet}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="grid gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Deadline
                </span>
                <span className={`text-sm font-medium ${deadline.className}`}>
                  {deadline.label}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="grid gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Award
                </span>
                <span className="text-sm font-medium">
                  {result.awardText ?? "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {result.newsFlags.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription>
                {result.verificationNote}{" "}
                <a href={result.newsFlags[0].link} target="_blank" rel="noopener noreferrer">
                  See news coverage
                </a>
                .
              </AlertDescription>
            </Alert>
          )}
          {result.newsFlags.length === 0 && !result.verified && (
            <Alert>
              <CircleHelp />
              <AlertDescription>{result.verificationNote}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <ScoreRow label="Fit" value={result.scores.fit} />
            <ScoreRow label="Deadline" value={result.scores.deadline} />
            <ScoreRow label="Award" value={result.scores.award} />
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button size="sm" onClick={() => setDetailOpen(true)}>
            <ListChecks className="size-3.5" /> How to apply
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              Official site <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </CardFooter>
      </Card>

      <ScholarshipDetailDialog
        result={result}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <Progress value={value * 100} />
    </div>
  );
}
