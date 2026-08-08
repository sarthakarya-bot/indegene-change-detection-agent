# Video script — Change Detection Agent (target: 3 min, hard cap 4 min)

Written to be said out loud, casually — like you're explaining it to a friend, not reading a report. Contractions are fine. Don't worry about hitting every word exactly; hit the beats.

Have both tabs open before you hit record: the target page (Lumeno) and the agent app. Local or live URLs both work — live is simpler since there's nothing to start up.

---

**[0:00–0:20] Intro**

> "Hey, so this is my submission for the Indegene assignment — a change detection agent. Basically, you give it a webpage, and it watches that page for you. Next time you check, it tells you exactly what changed, and whether that change actually matters or if it's just cosmetic. Let me just show you how it works."

---

**[0:20–0:40] The page it's watching**

*(Switch to the target page tab.)*

> "This is the page I built for it to monitor — a fake pricing page for a made-up product called Lumeno. Nothing fancy, just a normal page with a few sections — pricing, features, testimonials, that kind of thing."

---

**[0:40–1:15] First run**

*(Switch to the agent app. Paste the URL. Click Run.)*

> "Now let's run the agent on it. First time it's ever seen this page, so watch what it does."

*(Let the live feed play — should take a few seconds now that it's paced properly.)*

> "See that — it's actually telling you step by step what it's doing. Visiting the page, reading through it, breaking it into sections. And since it's the first time, it just says 'nothing to compare yet, saving this as my starting point.' It's not pretending to find a difference where there isn't one."

---

**[1:15–2:15] Making a real change**

*(Cut to code / or just say you're editing it. Show the price change live if possible, or just narrate it.)*

> "Okay, now let's actually change something. I'm bumping the price of this plan up by ten dollars."

*(Back to the agent app, click Run again.)*

> "And I run it again. Watch the feed — it's going through every section, and for the ones that didn't change, it just says 'unchanged, skipping' — it doesn't waste time or an AI call double-checking something that's identical. But this pricing section — it flags it."

*(Point at the report.)*

> "And here's the actual output — before, after, and this line here is the AI's own take on why it matters: basically saying, hey, this is a real price increase, that's worth someone's attention."

---

**[2:15–2:50] The part I actually care about — telling real changes from fake ones**

> "Now here's the bit I think is the most important part of this whole build. I also made a change that's purely cosmetic — like a tiny style tweak, no actual text changed. Watch what happens."

*(Run again with the functional-only change live.)*

> "See — it catches that something in the code changed, but it checks: is the actual text different? No. So it just labels it 'functional' and doesn't even bother asking the AI about it. That's the agent actually making a judgment call, not just diffing text blindly."

---

**[2:50–3:15] The trail, quickly**

*(Scroll to Agent Trail.)*

> "And everything you just saw stays logged down here, with the reasoning behind each step — so it's not a black box, you can see exactly why it did what it did."

---

**[3:15–3:40] Quick wrap**

> "Quick note on how it's built — it's a Next.js app, deployed on Vercel, and it uses Claude through OpenRouter for the reasoning part. Everything's on GitHub with a README that walks through the setup and the decisions I made. That's pretty much it — trigger, live feed, a proper report, and a full trail, with the agent actually thinking through each step instead of just fetching a page and dumping a diff on you. Thanks for watching."

---

### Before you record
- [ ] Decide: local URLs or live Vercel URLs (live is one less thing to explain)
- [ ] Have the price-change edit and the cosmetic-only edit ready to trigger quickly (don't fumble live — know exactly which line you're changing)
- [ ] Clear/reset the snapshot for the URL beforehand so your first Run in the video is a genuine baseline
- [ ] Keep an eye on time — this reads at about 3 minutes at a normal pace; if you're rushing to fit it in, it's too long, cut the wrap-up section short instead of speeding through the demo
