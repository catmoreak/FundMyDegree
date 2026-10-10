import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 surface-glass">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">FundMyDegree</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Powered by SerpAPI
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
