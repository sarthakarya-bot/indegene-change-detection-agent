const { runAgent } = require("../../../lib/agentPipeline");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimum time each live-feed line stays visible before the next one is
// revealed. The agent itself still runs at full speed underneath — this
// only paces how fast the UI *shows* what already happened, so a run with
// several instant "unchanged, skipped" sections doesn't blur past in one
// frame. Real gaps (e.g. an LLM call taking 2-3s) are unaffected, since
// pacing only kicks in when the next event is already queued and waiting.
const MIN_STEP_VISIBLE_MS = 500;

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

      // The pipeline (lib/agentPipeline.js) is untouched and still computes
      // at full speed, calling `emit` synchronously as it goes. Those calls
      // just push into this queue instead of writing to the stream directly;
      // a separate loop below drains one at a time, paced for readability.
      const queue = [];
      let pipelineDone = false;
      const emit = (message, reason) => {
        queue.push({ type: "log", message, reason, ts: Date.now() });
      };

      const drain = (async () => {
        while (queue.length > 0 || !pipelineDone) {
          if (queue.length === 0) {
            await new Promise((r) => setTimeout(r, 50));
            continue;
          }
          send(queue.shift());
          await new Promise((r) => setTimeout(r, MIN_STEP_VISIBLE_MS));
        }
      })();

      try {
        const { report, snapshot, meta } = await runAgent(url, previousSnapshot || null, emit);
        queue.push({ type: "result", report, snapshot, meta, ts: Date.now() });
      } catch (err) {
        emit(`Agent stopped: ${err.message}`, "Unrecoverable error — see message.");
        queue.push({ type: "error", message: err.message, ts: Date.now() });
      } finally {
        pipelineDone = true;
      }

      await drain;
      controller.close();
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
