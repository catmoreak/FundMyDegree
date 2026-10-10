"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApplyGuide, ScholarshipResult } from "@/lib/types";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  FileText,
  Link2,
  ListChecks,
  Play,
  TriangleAlert,
} from "lucide-react";

interface ScholarshipDetailDialogProps {
  result: ScholarshipResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

export function ScholarshipDetailDialog({
  result,
  open,
  onOpenChange,
}: ScholarshipDetailDialogProps) {
  const [guide, setGuide] = useState<ApplyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks which scholarship we already have a guide for. Kept in a ref so it
  // isn't an effect dependency — making `loading` a dependency would re-run the
  // effect mid-fetch and cancel the request that was still in flight.
  const loadedLink = useRef<string | null>(null);

  useEffect(() => {
    if (!open || loadedLink.current === result.link) return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/scholarship-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: result.title, link: result.link }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load application details.");
        if (!active) return;
        loadedLink.current = result.link;
        setGuide(json as ApplyGuide);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load application details.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [open, result.title, result.link]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-2 border-b border-border/70 px-6 py-5 pr-12">
          <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-brand">
            <ListChecks className="size-3.5" /> Application guide
          </span>
          <DialogTitle className="text-[15px] font-semibold leading-snug tracking-tight">
            {result.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {result.source}
            {result.deadlineDate &&
              ` · deadline ${new Date(result.deadlineDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {loading && <DetailSkeleton />}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-danger-surface px-3.5 py-3 text-xs text-danger ring-1 ring-danger/20">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">Couldn&apos;t load details</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {guide && !loading && (
            <Tabs defaultValue={firstTabWithContent(guide)}>
              <TabsList variant="line" className="w-full justify-start border-b border-border/70 pb-0">
                <TabsTrigger value="apply">Steps</TabsTrigger>
                <TabsTrigger value="videos">
                  Videos
                  <Count>{guide.videos.length}</Count>
                </TabsTrigger>
                <TabsTrigger value="faq">
                  FAQ
                  <Count>{guide.relatedQuestions.length}</Count>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="-mr-3 max-h-[52vh] pr-3">
                <TabsContent value="apply" className="grid gap-6 pt-1">
                  {guide.steps.length === 0 && guide.requirements.length === 0 && (
                    <Notice>
                      We couldn&apos;t pull structured steps from this page. Open the official site
                      below for the full instructions.
                    </Notice>
                  )}

                  {guide.steps.length > 0 && (
                    <section className="grid gap-3">
                      <SectionLabel icon={<ListChecks className="size-3.5" />}>
                        Application steps
                      </SectionLabel>
                      <ol className="grid gap-3">
                        {guide.steps.map((step, i) => (
                          <li key={step} className="flex gap-3">
                            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[10px] font-semibold text-brand">
                              {i + 1}
                            </span>
                            <span className="text-[13px] leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {guide.requirements.length > 0 && (
                    <section className="grid gap-3">
                      <SectionLabel icon={<FileText className="size-3.5" />}>
                        Eligibility &amp; documents
                      </SectionLabel>
                      <ul className="grid gap-2.5">
                        {guide.requirements.map((req) => (
                          <li key={req} className="flex gap-2.5">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-surface">
                              <Check className="size-2.5 text-success" />
                            </span>
                            <span className="text-[13px] leading-relaxed">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {guide.applyLinks.length > 0 && (
                    <section className="grid gap-2">
                      <SectionLabel icon={<Link2 className="size-3.5" />}>
                        Application pages &amp; guides
                      </SectionLabel>
                      <ul className="grid gap-0.5">
                        {guide.applyLinks.map((item) => (
                          <li key={item.link}>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-2 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted"
                            >
                              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                              <span className="text-[13px] leading-snug group-hover:underline">
                                {item.title}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="pt-1">
                  {guide.videos.length === 0 ? (
                    <Notice>No walkthrough videos found for this scholarship on YouTube.</Notice>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {guide.videos.map((video) => (
                        <a
                          key={video.link}
                          href={video.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group grid gap-2.5"
                        >
                          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border/70">
                            {video.thumbnail ? (
                              <Image
                                src={video.thumbnail}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 100vw, 320px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                unoptimized
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Play className="size-6 text-muted-foreground" />
                              </div>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/25">
                              <span className="flex size-10 scale-75 items-center justify-center rounded-full bg-background/90 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                <Play className="size-4 fill-current" />
                              </span>
                            </span>
                            {video.length && (
                              <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                                {video.length}
                              </span>
                            )}
                          </div>
                          <div className="grid gap-1">
                            <p className="line-clamp-2 text-[13px] font-medium leading-snug group-hover:underline">
                              {video.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {[
                                video.channel,
                                video.views !== null &&
                                  `${compactNumber.format(video.views)} views`,
                                video.publishedDate,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="faq" className="pt-1">
                  {guide.relatedQuestions.length === 0 ? (
                    <Notice>No related questions surfaced for this scholarship.</Notice>
                  ) : (
                    <Accordion type="single" collapsible>
                      {guide.relatedQuestions.map((q) => (
                        <AccordionItem key={q.question} value={q.question}>
                          <AccordionTrigger className="text-[13px]">{q.question}</AccordionTrigger>
                          <AccordionContent className="grid gap-2">
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                              {q.snippet || "No summary available — see the source below."}
                            </p>
                            {q.link && (
                              <a
                                href={q.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-brand"
                              >
                                {q.source || "Source"}
                                <ArrowUpRight className="size-3" />
                              </a>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          <p className="text-xs text-muted-foreground">Steps, FAQ &amp; videos via SerpAPI</p>
          <Button asChild size="sm" className="h-9 gap-1.5 rounded-lg px-3.5">
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              Official site <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Aggregator pages often yield no steps — open on a tab that has something in it. */
function firstTabWithContent(guide: ApplyGuide): string {
  if (guide.steps.length > 0 || guide.requirements.length > 0) return "apply";
  if (guide.videos.length > 0) return "videos";
  if (guide.relatedQuestions.length > 0) return "faq";
  return "apply";
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h3>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
      {children}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
      <CircleHelp className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-7 w-48 rounded-lg bg-muted animate-shimmer" />
      <div className="h-3.5 w-full rounded bg-muted animate-shimmer" style={{ animationDelay: "80ms" }} />
      <div className="h-3.5 w-11/12 rounded bg-muted animate-shimmer" style={{ animationDelay: "160ms" }} />
      <div className="h-3.5 w-9/12 rounded bg-muted animate-shimmer" style={{ animationDelay: "240ms" }} />
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div className="aspect-video rounded-xl bg-muted animate-shimmer" style={{ animationDelay: "320ms" }} />
        <div className="aspect-video rounded-xl bg-muted animate-shimmer" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}
