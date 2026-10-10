"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DegreeLevel, IncomeBracket, StudentProfile } from "@/lib/types";
import { Loader2, Search } from "lucide-react";

const DEGREE_OPTIONS: Array<{ value: DegreeLevel; label: string }> = [
  { value: "high-school", label: "High school" },
  { value: "associate", label: "Associate degree" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD / Doctoral" },
];

const INCOME_OPTIONS: Array<{ value: IncomeBracket; label: string }> = [
  { value: "low", label: "Low income" },
  { value: "middle", label: "Middle income" },
  { value: "high", label: "High income" },
  { value: "unspecified", label: "Not specified" },
];

const CONTROL = "h-11 rounded-lg bg-card text-sm";

interface SearchPanelProps {
  onSubmit: (profile: StudentProfile) => void;
  loading: boolean;
  hasSearched: boolean;
}

export function SearchPanel({ onSubmit, loading, hasSearched }: SearchPanelProps) {
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>("bachelors");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [country, setCountry] = useState("");
  const [incomeBracket, setIncomeBracket] = useState<IncomeBracket>("unspecified");

  const canSubmit = fieldOfStudy.trim().length > 0 && country.trim().length > 0 && !loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ degreeLevel, fieldOfStudy, country, incomeBracket });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-2xl p-6 ring-1 ring-border/70 surface-card sm:p-7"
    >
      <div className="grid gap-2">
        <Label htmlFor="fieldOfStudy" className="text-[13px] font-medium">
          Field of study
        </Label>
        <Input
          id="fieldOfStudy"
          placeholder="Computer Science"
          value={fieldOfStudy}
          onChange={(e) => setFieldOfStudy(e.target.value)}
          className={CONTROL}
          autoComplete="off"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="country" className="text-[13px] font-medium">
          Country
        </Label>
        <Input
          id="country"
          placeholder="India"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={CONTROL}
          autoComplete="country-name"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="degreeLevel" className="text-[13px] font-medium">
            Degree level
          </Label>
          <Select value={degreeLevel} onValueChange={(v) => setDegreeLevel(v as DegreeLevel)}>
            <SelectTrigger id="degreeLevel" className={`w-full ${CONTROL}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="incomeBracket" className="text-[13px] font-medium">
            Household income
          </Label>
          <Select
            value={incomeBracket}
            onValueChange={(v) => setIncomeBracket(v as IncomeBracket)}
          >
            <SelectTrigger id="incomeBracket" className={`w-full ${CONTROL}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCOME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="mt-1 h-11 w-full gap-2 rounded-lg text-sm font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Searching
          </>
        ) : (
          <>
            <Search className="size-4" />
            {hasSearched ? "Search again" : "Find scholarships"}
          </>
        )}
      </Button>
    </form>
  );
}
