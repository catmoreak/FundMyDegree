"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScoreMeter } from "@/components/score-meter";
import { ScholarshipDetailDialog } from "@/components/scholarship-detail-dialog";
import type { ScholarshipResult } from "@/lib/types";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  ListChecks,
  TriangleAlert,
} from "lucide-react";

type Urgency = "expired" | "urgent" | "open" | "unknown";

const URGENCY_TEXT: Record<Urgency, string> = {
  expired: "text-danger",
  urgent: "text-warning",
  open: "text-success",
  unknown: "text-muted-foreground",
};

function readDeadline(result: ScholarshipResult): {
  urgency: Urgency;
  dateLabel: string;
  windowLabel: string;
} {
  if (!result.deadlineDate) {
    return { urgency: "unknown", dateLabel: "Not published", windowLabel: "Check official site" };
  }
  const date = new Date(result.deadlineDate);
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const dateLabel = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (days < 0) return { urgency: "expired", dateLabel, windowLabel: `Closed ${-days}d ago` };
  if (days <= 14) return { urgency: "urgent", dateLabel, windowLabel: `${days} days left` };
  return { urgency: "open", dateLabel, windowLabel: `${days} days left` };
}

export function ScholarshipCard({
  result,
  rank,
  index,
}: {
  result: ScholarshipResult;
  rank: number;
  index: number;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const deadline = readDeadline(result);
  const hasNewsFlag = result.newsFlags.length > 0;

  return (
    <>
      <article
        className="rounded-2xl ring-1 ring-border/70 transition-shadow duration-300 animate-rise surface-card hover:shadow-[var(--shadow-lifted)]"
        style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
      >
        <div className="flex items-start gap-4 p-6 pb-5">
          <span className="w-5 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-muted-foreground">
            {rank}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {result.title}
              </a>
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
              <span className="truncate text-muted-foreground">{result.source}</span>
              <span className="text-border">·</span>
              {result.verified ? (
                <span className="inline-flex items-center gap-1 font-medium text-success">
                  <BadgeCheck className="size-3.5" /> Verified live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <CircleHelp className="size-3.5" /> Unconfirmed
                </span>
              )}
              {hasNewsFlag && (
                <>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-warning">
                    <TriangleAlert className="size-3.5" /> Status changed
                  </span>
                </>
              )}
            </div>

            {result.snippet && (
              <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {result.snippet}
              </p>
            )}
          </div>

          <ScoreMeter value={result.scores.total} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/70 px-6 py-4 sm:grid-cols-3">
          <Metric label="Deadline" value={deadline.dateLabel} valueClass={URGENCY_TEXT[deadline.urgency]} />
          <Metric label="Award" value={result.awardText ?? "Not listed"} />
          <Metric
            label="Application window"
            value={deadline.windowLabel}
            valueClass={URGENCY_TEXT[deadline.urgency]}
            className="col-span-2 sm:col-span-1"
          />
        </dl>

        <div className="grid gap-4 border-t border-border/70 px-6 py-4 sm:grid-cols-3">
          <ScoreBar label="Profile fit" value={result.scores.fit} />
          <ScoreBar label="Deadline" value={result.scores.deadline} />
          <ScoreBar label="Award size" value={result.scores.award} />
        </div>

        {(hasNewsFlag || !result.verified) && (
          <div className="flex items-start gap-2 border-t border-border/70 px-6 py-3.5 text-xs leading-relaxed text-muted-foreground">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            <p>
              {result.verificationNote}
              {hasNewsFlag && (
                <>
                  {" "}
                  <a
                    href={result.newsFlags[0].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    See coverage
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border/70 px-6 py-4">
          <Button size="sm" onClick={() => setDetailOpen(true)} className="h-9 gap-1.5 rounded-lg px-3.5">
            <ListChecks className="size-4" /> How to apply
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-9 gap-1 rounded-lg px-3">
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              Official site <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </article>

      <ScholarshipDetailDialog result={result} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

function Metric({
  label,
  value,
  valueClass = "",
  className = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 truncate text-sm font-medium ${valueClass}`}>{value}</dd>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
