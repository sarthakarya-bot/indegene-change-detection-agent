# Video script — Change Detection Agent (target: ~3 min, hard cap 5 min per the brief)

Said out loud, casually — like explaining it to a friend, not reading a report. Every beat below has a **SCREEN:** line (exactly what to click/show) and a spoken line (roughly what to say — don't memorize word for word, just hit the point).

**Recommended setup:** record against the **live URLs**, not local — nothing to start up, no risk of a dev server dying mid-recording.
- Target page: `https://lumeno-target-page.vercel.app`
- Agent app: `https://change-detection-agent-eight.vercel.app`

**Before you hit record:**
- Open both URLs in two tabs.
- On the agent app tab, click **Reset snapshot** once (or use a fresh/incognito window) so your first Run in the video is a genuine baseline, not leftover history from earlier testing.
- Know exactly which line you're editing in `target-page/index.html` for the two live edits below — don't fumble live. (If editing and redeploying live feels risky to do on camera, it's fine to say "let's say I've just changed X" and switch to a version of the page you've pre-staged instead — see the note at the bottom.)

---

### [0:00–0:15] Intro

**SCREEN:** Agent app tab, idle state (empty URL field visible).

> "Hey — this is my submission for the Indegene assignment: a change detection agent. You give it a webpage, it watches it, and next time you check, it tells you exactly what changed — and whether that change actually matters, or it's just cosmetic. Let me show you."

---

### [0:15–0:30] The page it's watching

**SCREEN:** Switch to the target page tab. Scroll down slowly through it once — hero, features, pricing, testimonials, footer.

> "This is the page I built for it to watch — a fake pricing page for a made-up product, Lumeno. Nothing fancy, just a normal page with a few sections."

---

### [0:30–1:00] First run — the trigger, and a real baseline

**SCREEN:** Switch to agent app. Paste the target page URL into the field. Click **Run**. Let the live feed play through fully.

> "Here's the trigger — URL in, hit Run. First time it's ever seen this page, so watch what it does instead of just guessing."
> "See that — it's telling you step by step: visiting the page, reading it, breaking it into sections. And since there's nothing to compare against yet, it says exactly that — 'no snapshot, saving this as my starting point' — instead of pretending to find a difference that isn't there."

---

### [1:00–1:45] A real change — content that matters

**SCREEN:** Switch to code editor (or your pre-staged "before/after" toggle). Change the Growth plan price. Save/redeploy. Switch back to the target page briefly to show the new price live. Then back to the agent app, click **Run** again.

> "Now let's actually change something — bumping this plan's price up."
> *(after the run)* "Watch the feed — every section that didn't change just says 'unchanged, skipping,' no wasted AI calls. But pricing — it flags that one."

**SCREEN:** Point at the Change Report card for the pricing section — the `CONTENT` badge, the before/after with the number highlighted, the one-line explanation.

> "And here's the actual report — before, after, and this line is the AI's own read on why it matters. That's the structured output the brief asked for."

---

### [1:45–2:15] Telling real changes from fake ones

**SCREEN:** Edit the footer's inline style only (no visible text change). Redeploy. Back to agent app, click **Run**.

> "Now a change that's purely cosmetic — a style tweak, zero text difference. Watch what happens here."

**SCREEN:** Point at the feed line for the footer, then the report card showing the `FUNCTIONAL` badge.

> "It catches that the markup changed, checks if the actual words changed — they didn't — so it labels it 'functional' and doesn't even bother asking the AI. That's it making a real judgment call, not just diffing text blindly."

---

### [2:15–2:35] Reliability — what happens when things go wrong

**SCREEN:** Clear the URL field, type a broken/unreachable URL (e.g. `http://localhost:9999` or any dead address), click **Run**.

> "Quick one — what if the page is just broken? It doesn't hang or crash — it fails with a plain, specific message and stops cleanly."

---

### [2:35–2:55] The trail

**SCREEN:** Back to a working run, scroll down to Agent Trail.

> "And everything you've seen stays logged here permanently, with the reasoning behind every step — so none of this is a black box."

---

### [2:55–3:15] Wrap

**SCREEN:** Optional — quick cut to the GitHub repo page or README.

> "Quick note on the build — Next.js, deployed on Vercel, reasoning through Claude via OpenRouter. Full repo's on GitHub with a README covering setup and the calls I made. Trigger, live feed, a real structured report, and a full trail — with the agent actually deciding things at each step, not just fetching a page and dumping a diff. Thanks for watching."

---

## If live editing feels too risky on camera

Instead of actually editing and redeploying the page mid-recording, pre-stage two browser tabs or two moments: one with the page as it looked *before* today's edits, one as it looks *now*. Narrate it as "here's the before, here's the after I made earlier" instead of doing it live. The agent's behavior in the recording is identical either way — only the demo choreography changes.

## Timing check
Reads at roughly 3:10–3:30 at a normal, unhurried pace. If you're running long, trim the wrap-up first — never the demo itself, since the report/trail/reliability moments are exactly what's being graded.
