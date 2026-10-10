import { NextResponse } from "next/server";
import { buildApplyGuide } from "@/lib/apply-guide";

interface DetailRequest {
  title: string;
  link: string;
}

function isDetailRequest(body: unknown): body is DetailRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    typeof b.link === "string" &&
    /^https?:\/\//.test(b.link)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isDetailRequest(body)) {
    return NextResponse.json(
      { error: "Requires a scholarship 'title' and an http(s) 'link'." },
      { status: 400 }
    );
  }

  try {
    const guide = await buildApplyGuide(body.title, body.link);
    return NextResponse.json(guide);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build apply guide.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
