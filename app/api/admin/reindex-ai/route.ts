import { NextResponse } from "next/server";

import { getAdminContext } from "@/lib/auth";
import { reindexKnowledgeBase } from "@/lib/ai/ingest";

export async function POST() {
  const admin = await getAdminContext();

  if (!admin.configured) {
    return NextResponse.json({ error: "Clerk is not configured." }, { status: 503 });
  }

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await reindexKnowledgeBase();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
