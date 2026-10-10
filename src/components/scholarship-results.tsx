import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ScholarshipCard } from "@/components/scholarship-card";
import type { ScholarshipSearchResponse } from "@/lib/types";
import { BadgeCheck, CalendarClock, Search, Sparkles, TriangleAlert, Wallet } from "lucide-react";

interface ScholarshipResultsProps {
  loading: boolean;
  error: string | null;
  data: ScholarshipSearchResponse | null;
}

export function ScholarshipResults({ loading, error, data }: ScholarshipResultsProps) {
  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
        <p className="text-center text-xs text-muted-foreground">
          Searching Google, cross-checking news, and verifying official pages…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Search failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed bg-transparent ring-0">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-brand-subtle">
            <Search className="size-5 text-brand" />
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium">No search yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Fill in your profile and we&apos;ll find, verify, and rank scholarships you can
              actually apply for.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.results.length === 0) {
    return (
      <Card className="border-dashed bg-transparent ring-0">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">No scholarships found</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Try a broader field of study or a different country.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { verifiedCount, nextDeadline, maxAward } = summarize(data);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Sparkles className="size-4" />} label="Matches" value={String(data.results.length)} />
        <StatTile icon={<BadgeCheck className="size-4" />} label="Verified live" value={`${verifiedCount}/${data.results.length}`} />
        <StatTile
          icon={<CalendarClock className="size-4" />}
          label="Next deadline"
          value={
            nextDeadline
              ? nextDeadline.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "—"
          }
        />
        <StatTile
          icon={<Wallet className="size-4" />}
          label="Top award"
          value={maxAward > 0 ? `$${maxAward.toLocaleString()}` : "—"}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        SerpAPI query:{" "}
        <span className="font-mono text-foreground">&ldquo;{data.query}&rdquo;</span> · ranked by
        fit × deadline × award
      </p>

      {data.results.map((result, i) => (
        <ScholarshipCard key={result.id} result={result} rank={i + 1} />
      ))}
    </div>
  );
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

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-1">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="text-lg font-semibold leading-none tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}
