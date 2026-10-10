"use client";

import { useEffect, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApplyGuide, ScholarshipResult } from "@/lib/types";
import {
  Check,
  CircleHelp,
  ExternalLink,
  FileText,
  Link2,
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

  useEffect(() => {
    if (!open || guide || loading) return;

    let cancelled = false;
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
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? "Could not load application details.");
        setGuide(json as ApplyGuide);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load application details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, guide, loading, result.title, result.link]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base leading-snug">{result.title}</DialogTitle>
          <DialogDescription>
            {result.source}
            {result.deadlineDate &&
              ` · deadline ${new Date(result.deadlineDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`}
          </DialogDescription>
        </DialogHeader>

        {loading && <DetailSkeleton />}

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Couldn&apos;t load details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {guide && !loading && (
          <Tabs defaultValue="apply">
            <TabsList>
              <TabsTrigger value="apply">How to apply</TabsTrigger>
              <TabsTrigger value="videos">Videos ({guide.videos.length})</TabsTrigger>
              <TabsTrigger value="faq">FAQ ({guide.relatedQuestions.length})</TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[55vh] pr-3">
              <TabsContent value="apply" className="grid gap-5">
                {guide.steps.length === 0 && guide.requirements.length === 0 && (
                  <Alert>
                    <CircleHelp />
                    <AlertDescription>
                      We couldn&apos;t pull structured steps from this page. Open the official
                      site below for the application instructions.
                    </AlertDescription>
                  </Alert>
                )}

                {guide.steps.length > 0 && (
                  <section className="grid gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Application steps
                    </h3>
                    <ol className="grid gap-2">
                      {guide.steps.map((step, i) => (
                        <li key={step} className="flex gap-3">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {guide.requirements.length > 0 && (
                  <section className="grid gap-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <FileText className="size-3.5" /> Eligibility &amp; documents
                    </h3>
                    <ul className="grid gap-2">
                      {guide.requirements.map((req) => (
                        <li key={req} className="flex gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          <span className="text-sm leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {guide.applyLinks.length > 0 && (
                  <section className="grid gap-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Link2 className="size-3.5" /> Application pages &amp; guides
                    </h3>
                    <ul className="grid gap-1.5">
                      {guide.applyLinks.map((item) => (
                        <li key={item.link}>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-muted"
                          >
                            <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm leading-snug group-hover:underline">
                              {item.title}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="videos">
                {guide.videos.length === 0 ? (
                  <Alert>
                    <CircleHelp />
                    <AlertDescription>
                      No walkthrough videos found for this scholarship on YouTube.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {guide.videos.map((video) => (
                      <a
                        key={video.link}
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group grid gap-2 rounded-xl p-2 transition-colors hover:bg-muted"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                          {video.thumbnail ? (
                            <Image
                              src={video.thumbnail}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 100vw, 320px"
                              className="object-cover transition-transform group-hover:scale-[1.03]"
                              unoptimized
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <Play className="size-6 text-muted-foreground" />
                            </div>
                          )}
                          {video.length && (
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
                              {video.length}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-0.5">
                          <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              video.channel,
                              video.views !== null && `${compactNumber.format(video.views)} views`,
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

              <TabsContent value="faq">
                {guide.relatedQuestions.length === 0 ? (
                  <Alert>
                    <CircleHelp />
                    <AlertDescription>
                      No related questions surfaced for this scholarship.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Accordion type="single" collapsible>
                    {guide.relatedQuestions.map((q) => (
                      <AccordionItem key={q.question} value={q.question}>
                        <AccordionTrigger>{q.question}</AccordionTrigger>
                        <AccordionContent className="grid gap-2">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {q.snippet || "No summary available — see the source below."}
                          </p>
                          {q.link && (
                            <a
                              href={q.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand"
                            >
                              {q.source || "Source"}
                              <ExternalLink className="size-3" />
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

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Steps, FAQ &amp; videos via SerpAPI (Google + YouTube)
          </p>
          <Button asChild size="sm">
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              Official site <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-11/12 rounded" />
      <Skeleton className="h-4 w-9/12 rounded" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    </div>
  );
}
