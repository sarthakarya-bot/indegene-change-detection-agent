"use client";

// The durable record: every event the pipeline emitted, with the "why"
// alongside the "what." Same underlying events as StatusFeed, kept in full
// and left on screen after the run finishes.
export default function AgentTrail({ events }) {
  return (
    <div className="report-section">
      <h2>Agent trail</h2>
      <div className="trail-card">
        {events.length === 0 && <div className="trail-empty">No actions yet.</div>}
        {events.map((e, i) => (
          <div className="trail-item" key={i}>
            <div className="trail-ts">{e.ts ? new Date(e.ts).toLocaleTimeString() : ""}</div>
            <div className="trail-body">
              <div className="trail-msg">{e.message}</div>
              {e.reason && <div className="trail-reason">{e.reason}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
