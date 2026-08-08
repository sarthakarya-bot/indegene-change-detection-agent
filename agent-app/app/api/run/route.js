const { runAgent } = require("../../../lib/agentPipeline");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams the agent's run as newline-delimited SSE events over a single
// request/response. No job store, no polling endpoint, no server-side
// session state needed — one HTTP call is the entire lifecycle of a run.
export async function POST(req) {
  const { url, previousSnapshot } = await req.json();

  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "A URL is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const emit = (message, reason) => send({ type: "log", message, reason, ts: Date.now() });

      try {
        const { report, snapshot, meta } = await runAgent(url, previousSnapshot || null, emit);
        send({ type: "result", report, snapshot, meta, ts: Date.now() });
      } catch (err) {
        emit(`Agent stopped: ${err.message}`, "Unrecoverable error — see message.");
        send({ type: "error", message: err.message, ts: Date.now() });
      } finally {
        controller.close();
      }
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
