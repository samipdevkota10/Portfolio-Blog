import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createContactSubmission, markContactNotified, trackEvent } from "@/lib/db/queries";
import { sendContactNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = rateLimit({
    key: `contact:${ip}`,
    limit: 3,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = contactSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact payload" }, { status: 400 });
  }

  const submission = await createContactSubmission(parsed.data);
  const emailResult = await sendContactNotification(parsed.data);

  if (submission && !("skipped" in emailResult)) {
    await markContactNotified(submission.id);
  }

  await trackEvent("contact.submitted", {
    subject: parsed.data.subject,
    stored: Boolean(submission),
  });

  return NextResponse.json({
    ok: true,
    submissionId: submission?.id ?? null,
  });
}
