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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DegreeLevel, IncomeBracket, StudentProfile } from "@/lib/types";
import { Loader2, Search } from "lucide-react";

const DEGREE_OPTIONS: Array<{ value: DegreeLevel; label: string }> = [
  { value: "high-school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD / Doctoral" },
];

const INCOME_OPTIONS: Array<{ value: IncomeBracket; label: string }> = [
  { value: "low", label: "Low income" },
  { value: "middle", label: "Middle income" },
  { value: "high", label: "High income" },
  { value: "unspecified", label: "Prefer not to say" },
];

interface ProfileFormProps {
  onSubmit: (profile: StudentProfile) => void;
  loading: boolean;
}

export function ProfileForm({ onSubmit, loading }: ProfileFormProps) {
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>("bachelors");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [country, setCountry] = useState("");
  const [gpa, setGpa] = useState("");
  const [incomeBracket, setIncomeBracket] = useState<IncomeBracket>("unspecified");

  const canSubmit = fieldOfStudy.trim().length > 0 && country.trim().length > 0 && !loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ degreeLevel, fieldOfStudy, country, gpa: gpa || undefined, incomeBracket });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          Used to build the search query — nothing is stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="degreeLevel">Degree level</Label>
            <Select value={degreeLevel} onValueChange={(v) => setDegreeLevel(v as DegreeLevel)}>
              <SelectTrigger id="degreeLevel" className="w-full">
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

          <div className="grid gap-1.5">
            <Label htmlFor="fieldOfStudy">Field of study</Label>
            <Input
              id="fieldOfStudy"
              placeholder="e.g. Computer Science"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="incomeBracket">Household income</Label>
            <Select
              value={incomeBracket}
              onValueChange={(v) => setIncomeBracket(v as IncomeBracket)}
            >
              <SelectTrigger id="incomeBracket" className="w-full">
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

          <div className="grid gap-1.5">
            <Label htmlFor="gpa">
              GPA / grade <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="gpa"
              placeholder="e.g. 3.7/4.0 or 85%"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="mt-1 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Searching…
              </>
            ) : (
              <>
                <Search className="size-4" /> Find scholarships
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
