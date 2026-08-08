# Trigger-Based Web Change Detection Agent

Indegene Associate PM (Applied AI) hiring assignment.

## Structure

- **`target-page/`** — Part 1. A small, realistic fictional B2B SaaS product page ("Lumeno") with distinct sections (hero, features, pricing, testimonials, footer) for the agent to monitor. Deliberately simple, static HTML/CSS.
- **`agent-app/`** — Part 2, the actual deliverable. The change detection agent: trigger UI, live status feed, structured change report, and agent trail. See [`agent-app/README.md`](agent-app/README.md) for setup and architecture.
- **`video/`** — voiceover script for the submission recording.

## Live demo

- Target page: https://lumeno-target-page-sarthak-aryas-projects-e288fd0e.vercel.app
- Agent app: https://change-detection-agent-sarthak-aryas-projects-e288fd0e.vercel.app

## Quick local run

```bash
# Terminal 1 — serve the target page
npx serve target-page -l 5001

# Terminal 2 — run the agent
cd agent-app
npm install
cp .env.example .env.local   # add your OPENROUTER_API_KEY
npm run dev
```

Open http://localhost:3000, enter `http://localhost:5001`, hit Run. First run establishes a baseline; edit `target-page/index.html` or `target-page/styles.css`, run again, and the change report shows up.

## What was manually changed on the target page during the assignment

1. **Content change** — Growth plan price raised from $49/seat/mo to $59/seat/mo (`target-page/index.html`, pricing section).
2. **Functional-only change** — added an inline `letter-spacing` style to the footer logo; visible text unchanged (`target-page/index.html`, footer section).

Both are picked up correctly by the agent and classified as `content` and `functional` respectively — see `agent-app/README.md` for how that classification works.
