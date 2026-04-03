import { NextRequest } from "next/server";

import { subscribeToItemEvents } from "@/lib/item-events";

export const dynamic = "force-dynamic";

function formatEvent(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(formatEvent("ready", JSON.stringify({ ok: true }))));

      const unsubscribe = subscribeToItemEvents((event) => {
        controller.enqueue(encoder.encode(formatEvent(event.type, JSON.stringify(event))));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      const abortHandler = () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", abortHandler, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
