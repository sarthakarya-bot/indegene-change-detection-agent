"use client";

// The "live" view of the same event stream AgentTrail renders in full —
// condensed to the last few lines, styled like a console so it visually
// reads as "the agent is doing something right now."
export default function StatusFeed({ events, running }) {
  const recent = events.slice(-8);

  return (
    <div className="feed-card">
      <div className="feed-title">
        <span className={`pulse-dot ${running ? "" : "idle"}`} />
        Live status
      </div>
      {recent.length === 0 && <div className="feed-empty">Idle — enter a URL and hit Run.</div>}
      {recent.map((e, i) => {
        const isCurrent = running && i === recent.length - 1;
        return (
          <div className={`feed-line ${isCurrent ? "feed-line-current" : ""}`} key={i}>
            &gt; {e.message}
          </div>
        );
      })}
    </div>
  );
}
