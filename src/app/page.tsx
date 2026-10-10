"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/profile-form";
import { ScholarshipResults } from "@/components/scholarship-results";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { ScholarshipSearchResponse, StudentProfile } from "@/lib/types";
import { GraduationCap, Newspaper, Search, ShieldCheck, SquarePlay } from "lucide-react";

const PIPELINE = [
  { icon: Search, label: "Google Search" },
  { icon: Newspaper, label: "Google News deadline check" },
  { icon: ShieldCheck, label: "Official site verified" },
  { icon: SquarePlay, label: "YouTube guides" },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScholarshipSearchResponse | null>(null);

  async function handleSubmit(profile: StudentProfile) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setData(json as ScholarshipSearchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <GraduationCap className="size-4.5" />
            </span>
            <span className="font-semibold tracking-tight">FundMyDegree</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Powered by SerpAPI
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Scholarships that are{" "}
            <span className="text-brand">still open</span>, ranked for you
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            We search the web for scholarships matching your profile, cross-check the news for
            extended or closed deadlines, verify the official page is live, then show you exactly
            how to apply.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {PIPELINE.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5 text-brand" />
                {label}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
          <div className="lg:sticky lg:top-20">
            <ProfileForm onSubmit={handleSubmit} loading={loading} />
          </div>
          <ScholarshipResults loading={loading} error={error} data={data} />
        </div>
      </main>

      <footer className="border-t py-6">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          Always confirm deadlines and eligibility on the official scholarship page before
          applying.
        </p>
      </footer>
    </div>
  );
}
