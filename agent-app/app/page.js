"use client";

import { useState } from "react";
import StatusFeed from "./components/StatusFeed";
import AgentTrail from "./components/AgentTrail";
import ChangeReport from "./components/ChangeReport";

// The agent is stateless server-side: the browser is the only place the
// "previous snapshot" lives, keyed per URL. See README.md for why.
function snapshotKey(url) {
  return `agent:snapshot:${url.trim()}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  async function handleRun(e) {
    e.preventDefault();
    if (!url.trim() || running) return;

    setRunning(true);
    setError(null);
    setReport(null);
    setEvents([]);

    let previousSnapshot = null;
    try {
      const raw = localStorage.getItem(snapshotKey(url));
      previousSnapshot = raw ? JSON.parse(raw) : null;
    } catch {
      previousSnapshot = null;
    }

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, previousSnapshot }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep the last, possibly-incomplete chunk for next read

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const evt = JSON.parse(line.slice(5).trim());

          if (evt.type === "log") {
            setEvents((prev) => [...prev, evt]);
          } else if (evt.type === "result") {
            setReport(evt.report);
            try {
              localStorage.setItem(snapshotKey(url), JSON.stringify(evt.snapshot));
            } catch {
              // localStorage full/unavailable — non-fatal, just means no diff next run
            }
          } else if (evt.type === "error") {
            setError(evt.message);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    if (!url.trim()) return;
    try {
      localStorage.removeItem(snapshotKey(url));
    } catch {
      // ignore
    }
    setEvents((prev) => [...prev, { message: `Cleared stored snapshot for ${url}`, ts: Date.now() }]);
    setReport(null);
  }

  return (
    <main className="page">
      <div className="app-header">
        <h1>Change Detection Agent</h1>
        <p>Enter a URL and run it. The agent snapshots the page, compares it to the last visit, and reasons over what changed.</p>
      </div>

      <form className="trigger-card" onSubmit={handleRun}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={running}
        />
        <button className="btn btn-primary" type="submit" disabled={running}>
          {running ? "Running…" : "Run"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={handleReset} disabled={running}>
          Reset snapshot
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <StatusFeed events={events} running={running} />
      <ChangeReport report={report} />
      <AgentTrail events={events} />
    </main>
  );
}
