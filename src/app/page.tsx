"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SearchPanel } from "@/components/search-panel";
import { ScholarshipResults } from "@/components/scholarship-results";
import type { ScholarshipSearchResponse, StudentProfile } from "@/lib/types";
import { Newspaper, Search, ShieldCheck, SquarePlay } from "lucide-react";

const PIPELINE = [
  { icon: Search, title: "Search", detail: "Google results matched to your profile" },
  { icon: Newspaper, title: "Cross-check", detail: "News scanned for deadline changes" },
  { icon: ShieldCheck, title: "Verify", detail: "Official page confirmed still live" },
  { icon: SquarePlay, title: "Guide", detail: "Apply steps, FAQs and video walkthroughs" },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScholarshipSearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(profile: StudentProfile) {
    setLoading(true);
    setError(null);
    setHasSearched(true);
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
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8">
        <section className="pb-12 pt-16 sm:pt-20">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-balance text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.75rem]">
              Scholarships that are{" "}
              <span className="text-gradient-brand">still open</span>, ranked for you
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Scholarship listings go stale fast. We search the live web, catch deadlines that
              moved, confirm the page still accepts applications, then show you how to apply.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <SearchPanel onSubmit={handleSubmit} loading={loading} hasSearched={hasSearched} />
          </div>

          <ol className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
            {PIPELINE.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex flex-col gap-2.5">
                <Icon className="size-4 text-brand" />
                <div>
                  <p className="text-[13px] font-medium tracking-tight">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-20">
          <ScholarshipResults loading={loading} error={error} data={data} />
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1.5 px-5 text-center sm:px-8">
          <p className="text-xs text-muted-foreground">
            Always confirm deadlines and eligibility on the official scholarship page before
            applying.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Google Search · Google News · YouTube data via SerpAPI
          </p>
        </div>
      </footer>
    </div>
  );
}
