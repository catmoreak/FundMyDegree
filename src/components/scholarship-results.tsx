"use client";

import { useMemo, useState } from "react";
import { ScholarshipCard } from "@/components/scholarship-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScholarshipResult, ScholarshipSearchResponse } from "@/lib/types";
import { Compass, TriangleAlert } from "lucide-react";

type SortKey = "match" | "deadline" | "award";

interface ScholarshipResultsProps {
  loading: boolean;
  error: string | null;
  data: ScholarshipSearchResponse | null;
}

export function ScholarshipResults({ loading, error, data }: ScholarshipResultsProps) {
  const [sort, setSort] = useState<SortKey>("match");

  const sorted = useMemo(() => (data ? sortResults(data.results, sort) : []), [data, sort]);

  if (loading) return <ResultsSkeleton />;

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl px-5 py-4 text-sm ring-1 ring-danger/25 surface-card">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
        <div>
          <p className="font-medium">Search failed</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Ready when you are"
        body="Add your field of study and country above. We'll search the web, check the news for deadline changes, verify each official page, then rank what's left."
      />
    );
  }

  if (data.results.length === 0) {
    return (
      <EmptyState
        title="Nothing matched that search"
        body="Try a broader field of study, or a different country — some scholarship databases index by study destination rather than nationality."
      />
    );
  }

  const stats = summarize(data);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 rounded-2xl px-6 py-5 ring-1 ring-border/70 surface-card sm:grid-cols-4">
        <Stat label="Matches" value={String(data.results.length)} />
        <Stat label="Verified live" value={`${stats.verifiedCount} of ${data.results.length}`} />
        <Stat
          label="Next deadline"
          value={
            stats.nextDeadline
              ? stats.nextDeadline.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
        />
        <Stat
          label="Largest award"
          value={stats.maxAward > 0 ? `$${stats.maxAward.toLocaleString()}` : "—"}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
          Searched for <span className="text-foreground">&ldquo;{data.query}&rdquo;</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 gap-1.5 rounded-lg bg-card text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best match</SelectItem>
              <SelectItem value="deadline">Deadline soonest</SelectItem>
              <SelectItem value="award">Largest award</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {sorted.map((result, i) => (
          <ScholarshipCard key={result.id} result={result} rank={i + 1} index={i} />
        ))}
      </div>
    </div>
  );
}

function sortResults(results: ScholarshipResult[], sort: SortKey): ScholarshipResult[] {
  const copy = [...results];
  if (sort === "deadline") {
    return copy.sort((a, b) => {
      const at = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity;
      const bt = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity;
      return at - bt;
    });
  }
  if (sort === "award") {
    return copy.sort((a, b) => (b.awardAmount ?? 0) - (a.awardAmount ?? 0));
  }
  return copy.sort((a, b) => b.scores.total - a.scores.total);
}

/** Deadlines are compared against the search time so the summary stays pure. */
function summarize(data: ScholarshipSearchResponse) {
  const searchedAt = new Date(data.generatedAt).getTime();

  const upcoming = data.results
    .map((r) => (r.deadlineDate ? new Date(r.deadlineDate) : null))
    .filter((d): d is Date => d !== null && d.getTime() > searchedAt)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    verifiedCount: data.results.filter((r) => r.verified).length,
    nextDeadline: upcoming[0] ?? null,
    maxAward: data.results.reduce(
      (max, r) => (r.awardAmount && r.awardAmount > max ? r.awardAmount : max),
      0
    ),
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-lg font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-5" />
      </span>
      <div className="grid gap-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-[86px] rounded-2xl bg-muted/70 animate-shimmer" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[300px] rounded-2xl bg-muted/70 animate-shimmer"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
      <p className="text-center text-xs text-muted-foreground">
        Searching Google · cross-checking news · verifying official pages…
      </p>
    </div>
  );
}
