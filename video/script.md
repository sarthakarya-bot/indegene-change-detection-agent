# Video script — Change Detection Agent (target: 4:30-5:00)

Record with the agent app and target page both open in tabs. Use local (`localhost:3000` / `localhost:5001`) if the Vercel dashboard steps aren't done yet — functionally identical, and simpler to narrate without a network round-trip. Screen-record at 1080p, cursor visible.

---

**[0:00–0:25] Cold open — what this is**

> "This is a change detection agent for the Indegene assignment. You give it a URL, it visits the page, and on the next run it tells you what changed — separating real content changes from CSS or formatting noise, and explaining why each change might matter. Let me show you."

*(Cut to target page — Lumeno, a fictional B2B SaaS pricing page.)*

> "This is the page it's monitoring — a product page I built for this, with a hero, features, pricing, and testimonials section."

---

**[0:25–1:00] First run — baseline**

*(Cut to agent app. Paste in the URL. Hit Run.)*

> "First run — there's nothing to compare against yet, so watch what it does instead of just failing."

*(Let the live status feed play out: visiting, reading, parsing sections, "no prior snapshot — establishing baseline.")*

> "It reads the page, breaks it into six logical sections — not raw HTML, actual sections — and since there's no history for this URL yet, it says so explicitly and stores this as the baseline. That's the first decision point: it doesn't assume, it checks."

---

**[1:00–2:00] Content change — the real signal**

*(Cut to code editor / target page HTML. Change the Growth plan price, $49 → $59. Save. Reload target page briefly to show it live.)*

> "Now I'll make a real change — raising the Growth plan price by $10."

*(Back to agent app. Run again. Let the feed play.)*

> "Watch the feed: it re-reads the page, compares section by section, and most sections come back byte-identical — no LLM call spent on those. But pricing changed, so it hands that one to the model."

*(Point to the structured report — pricing card, "content" badge, before/after with the diff highlighted, the one-line significance.)*

> "Here's the report: before, after, and a one-line read on why it matters — a 20% price increase, flagged as something a human should actually look at."

---

**[2:00–2:50] Functional-only change — the part that proves it's not just diffing text**

*(Cut to code editor. Add the inline style to the footer logo — no visible text change. Save.)*

> "Now a change that's purely cosmetic — a style tweak in the footer, no text difference at all."

*(Run again. Let the feed show the footer line specifically.)*

> "This is the part I actually care about showing: it detects the markup changed, checks that the text is identical, and explicitly skips the LLM call — because there's nothing for a reader to notice. That's the 'functional vs. content' separation the brief asked for, and it's a real decision, not just a label."

*(Point to the report — footer card, "functional" badge, muted styling.)*

---

**[2:50–3:30] Agent trail + reliability**

*(Scroll down to the agent trail.)*

> "Everything you just saw in the live feed is kept here, permanently, with the reasoning behind each step — not just what it did, but why."

*(Optional — quick edge case: type a dead URL like `localhost:9999`, hit Run, show the clean error instead of a crash.)*

> "And if the URL is unreachable, redirects, or times out, it fails cleanly and says so — it doesn't hang or crash."

---

**[3:30–4:15] Architecture, fast**

*(Voiceover only, or cut to README.md briefly.)*

> "Quick architecture note: one request streams the whole run over Server-Sent Events — no job queue needed. The 'previous snapshot' lives in the browser, not a database, so the whole thing is a stateless pipeline: URL and prior snapshot in, report and new snapshot out. It's built on Next.js, deployed on Vercel, and the reasoning calls go through OpenRouter to Claude. All in that repo, with a README covering the setup and the tradeoffs I made under the time box."

---

**[4:15–4:45] Close**

> "That's it — trigger, live status, structured report, and a full trail, with the agent making real decisions at each step instead of just fetching a page and dumping a diff. Repo and README have the rest."

*(End screen or fade.)*

---

### Shot checklist before recording
- [ ] Target page and agent app both reachable (local or deployed — confirm which before recording)
- [ ] Browser localStorage cleared for the target URL, so the first run is genuinely a baseline
- [ ] Pricing edit and footer edit ready to make live during the recording (or pre-staged in two branches/files to swap in quickly)
- [ ] Dead-URL edge case URL handy (`http://localhost:9999` or similar)
- [ ] Timer visible or mentally paced — hard cap is 5:00
