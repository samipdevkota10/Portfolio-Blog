import { NextRequest } from "next/server";
import { z } from "zod";

import { persistAssistantMessage, streamChatResponse } from "@/lib/ai/chat";
import { checkChatRequest } from "@/lib/ai/guard";
import { logger } from "@/lib/logger";

const chatSchema = z.object({
  sessionId: z.string().min(1).max(128).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  context: z
    .object({
      path: z.string().max(200),
      page: z.string().max(40),
      slug: z.string().max(200).optional(),
      section: z.string().max(80).optional(),
    })
    .optional(),
});

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const payload = chatSchema.safeParse(await request.json());

  if (!payload.success) {
    return new Response(sse("error", { message: "Invalid chat payload" }), {
      status: 400,
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  }

  const guard = await checkChatRequest({
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown",
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    sessionId: payload.data.sessionId,
    messages: payload.data.messages,
  });

  if (!guard.ok) {
    return Response.json({ message: guard.message }, { status: guard.status });
  }

  const { metadata, stream, fallbackText, requestId } = await streamChatResponse(payload.data);

  const responseStream = new ReadableStream({
    async start(controller) {
      let collectedText = "";
      let responseId: string | undefined;

      controller.enqueue(new TextEncoder().encode(sse("meta", metadata)));

      if (fallbackText) {
        controller.enqueue(new TextEncoder().encode(sse("chunk", { text: fallbackText })));
        controller.enqueue(new TextEncoder().encode(sse("done", { ok: true })));
        await persistAssistantMessage({
          sessionId: metadata.sessionId,
          content: fallbackText,
          grounded: metadata.grounded,
          citations: metadata.citations,
        });
        controller.close();
        return;
      }

      try {
        for await (const event of stream ?? []) {
          if (event.type === "response.created") {
            responseId = event.response.id;
          }

          if (event.type === "response.output_text.delta") {
            collectedText += event.delta;
            controller.enqueue(new TextEncoder().encode(sse("chunk", { text: event.delta })));
          }
        }

        controller.enqueue(new TextEncoder().encode(sse("done", { ok: true })));
        await persistAssistantMessage({
          sessionId: metadata.sessionId,
          content: collectedText,
          citations: metadata.citations,
          grounded: metadata.grounded,
          responseId,
          requestId,
        });
      } catch (error) {
        logger.error("chat-stream-failed", {
          error: error instanceof Error ? error.message : "Unknown chat stream error",
          requestId,
        });
        controller.enqueue(new TextEncoder().encode(sse("error", { message: "Chat streaming failed" })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
