"use client";

function DiffText({ wordDiff, fallback }) {
  if (!wordDiff || wordDiff.length === 0) return <>{fallback}</>;
  return (
    <>
      {wordDiff.map((part, i) => {
        if (part.added) return <ins key={i} className="diff-ins">{part.value}</ins>;
        if (part.removed) return <del key={i} className="diff-del">{part.value}</del>;
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

export default function ChangeReport({ report }) {
  if (!report) return null;

  if (report.isBaseline) {
    return (
      <div className="report-section">
        <h2>Change report</h2>
        <div className="report-empty">
          Baseline snapshot captured — nothing to compare yet. Edit the target page and run again.
        </div>
      </div>
    );
  }

  if (!report.sections || report.sections.length === 0) {
    return (
      <div className="report-section">
        <h2>Change report</h2>
        <div className="report-empty">No differences found since the last visit.</div>
      </div>
    );
  }

  return (
    <div className="report-section">
      <h2>Change report</h2>
      {report.sections.map((s) => (
        <div className="change-card" key={s.id}>
          <div className="change-card-head">
            <h3>
              {s.title}
              {s.status === "added" ? " (new section)" : s.status === "removed" ? " (removed)" : ""}
            </h3>
            <span className={`badge ${s.classification === "content" ? "badge-content" : "badge-functional"}`}>
              {s.classification}
            </span>
          </div>
          <p className="significance">{s.significance}</p>
          <div className="before-after">
            <div>
              <h4>Before</h4>
              <div className="text-block">{s.beforeText || "—"}</div>
            </div>
            <div>
              <h4>After</h4>
              <div className="text-block">
                <DiffText wordDiff={s.wordDiff} fallback={s.afterText || "—"} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
