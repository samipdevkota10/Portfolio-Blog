import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createComment, listApprovedComments, trackEvent } from "@/lib/db/queries";
import { rateLimit } from "@/lib/rate-limit";

const commentSchema = z.object({
  slug: z.string().min(1),
  author: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  body: z.string().min(5).max(5000),
  website: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const comments = await listApprovedComments(slug);
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = rateLimit({
    key: `comments:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = commentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment payload" }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const comment = await createComment({
    slug: parsed.data.slug,
    author: parsed.data.author,
    email: parsed.data.email || undefined,
    body: parsed.data.body,
    honeypot: parsed.data.website,
    ipHash: createHash("sha256").update(ip).digest("hex"),
  });

  await trackEvent("comment.submitted", {
    slug: parsed.data.slug,
    stored: Boolean(comment),
  });

  return NextResponse.json({ ok: true, comment });
}
