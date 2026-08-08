# Change Detection Agent

A trigger-based agent that visits a URL, reads it section by section, and — on a later run — tells you what changed, separates real content changes from styling/formatting noise, and explains in one line why each change might matter.

Built for the Indegene Associate PM (Applied AI) assignment. Part 1 (the monitored target page) lives in `../target-page`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
```

You'll also need something to point the agent at — either the target page in `../target-page` served locally (`npx serve ../target-page`) or any public URL.

**Environment variables** (`.env.local`):
- `OPENROUTER_API_KEY` — required. Get one at [openrouter.ai/keys](https://openrouter.ai/keys). The agent uses OpenRouter (OpenAI-compatible endpoint) rather than calling a model provider directly, so the model is swappable without touching code.
- `OPENROUTER_MODEL` — optional, defaults to `anthropic/claude-sonnet-5`.

## How it works

**One request, start to finish.** Hitting "Run" makes a single `POST /api/run` call. The response is a stream of Server-Sent Events over that one connection — no polling endpoint, no job queue, no background worker. The pipeline runs to completion inside that one request and every step it takes is emitted as an event along the way.

**The agent doesn't call the model on autopilot.** Each run:
1. Normalizes and visits the URL — manual redirect following (not `fetch`'s silent auto-follow) so a redirect is a logged decision, not something that happens invisibly. Requests time out after 8s and dead URLs/non-2xx responses fail cleanly instead of throwing.
2. Parses the HTML into logical sections (`<section>`, `<header>`, `<footer>`, `<nav>`, or a heading-based split as a fallback for pages that don't use semantic tags) rather than diffing raw markup section-by-section.
3. Compares each section against the stored snapshot **in code, before any LLM call**: identical HTML → skip entirely; identical text but different HTML → classify as `functional` and skip the LLM (nothing for a reader to notice); different text → hand off to the model.
4. Only sections that actually changed in substance get an LLM call, and that call does two things at once: confirm the classification and write the one-line "why this might matter."
5. Assembles the structured report and returns it, section by section.

That third step is the one worth calling out: the model is only invoked where judgment is actually needed. A page with 20 sections and one real content edit costs one LLM call, not twenty.

**State lives in the browser, not the server.** The "previous snapshot" is stored in `localStorage`, keyed by URL, and sent up with each request. The `/api/run` handler is a pure function of `(url, previousSnapshot) -> (report, newSnapshot)` — nothing is written to disk or a database. This was a deliberate call for a single-user prototype built in one day: it needs no database, behaves identically running locally or deployed to Vercel's serverless functions (which don't persist writes across invocations anyway), and the interface is narrow enough to swap in Redis/Postgres later without touching the pipeline logic. The tradeoff: snapshots don't survive clearing browser storage, and two browsers won't share history for the same URL. Fine for a prototype; the first thing to change for a real multi-user product.

**No headless browser.** The agent fetches raw HTML with `fetch`, not a rendered DOM via Playwright/Puppeteer. This keeps the agent fast, dependency-light, and trivial to deploy on Vercel (headless Chromium on serverless is its own project). The real cost: content that only exists after client-side JavaScript runs won't be seen, and a change confined entirely to a linked stylesheet (as opposed to inline styles or markup) is invisible too, since only the HTML document is fetched. For a target page you control — and for most content-driven pages generally — this is the right tradeoff. A production version monitoring arbitrary JS-heavy sites would want a headless-browser fetch step instead.

**Live status feed and agent trail are the same event stream**, rendered twice: the feed shows the last few events with a "this is happening now" console treatment; the trail keeps the full list with the reasoning behind each step, and stays on screen after the run finishes.

## Architecture

```
app/
  page.js                 UI: trigger, orchestrates the fetch+stream, owns localStorage
  api/run/route.js        POST handler — streams SSE events for one full agent run
  components/
    StatusFeed.js          live, condensed view of events
    AgentTrail.js           full, persistent view of events with rationale
    ChangeReport.js          structured before/after report per section
lib/
  fetchPage.js             URL visit: redirects, timeouts, error handling
  parseSections.js         HTML -> logical sections
  diffSections.js          section-level diff + deterministic functional/content pre-classification
  llm.js                   OpenRouter client + the classify-and-explain prompt
  agentPipeline.js         orchestrates the above, emits every decision as an event
```

## Known limitations (not fixed, by design, given the time box)

- Snapshot history is per-browser (`localStorage`), not server-side — see above.
- CSS-file-only changes aren't detected (only the fetched HTML document is inspected, not linked stylesheets). Inline style/markup changes are.
- No headless rendering — JS-rendered content isn't seen.
- Redirects are capped at 5 hops; deeper chains fail with a clear error rather than looping forever.
- Deployed on Vercel: if the target page is also a Vercel deployment with "Vercel Authentication" (SSO) turned on, the agent's server-side fetch will hit the login redirect instead of the page. Turn that off in the target project's Deployment Protection settings for the agent to reach it.
