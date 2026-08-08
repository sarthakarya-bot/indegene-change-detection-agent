const { fetchPage, normalizeUrl } = require("./fetchPage");
const { parseSections } = require("./parseSections");
const { compareSnapshots } = require("./diffSections");
const { reasonAboutSectionChange } = require("./llm");

/**
 * Runs one full agent cycle for a URL: fetch -> parse -> (compare vs. prior
 * snapshot, if any) -> reason over each real diff -> assemble a report.
 *
 * `emit(message, reason)` is called at every decision point so the caller
 * can stream it live (status feed) and keep it (agent trail). Each call is
 * one entry in both UIs — see agent-app/README.md for why they share a feed.
 */
async function runAgent(rawUrl, previousSnapshot, emit) {
  emit(`Received request to check ${rawUrl}`, "Trigger fired from the UI.");

  const url = normalizeUrl(rawUrl);
  if (url !== rawUrl.trim()) {
    emit(`Normalized URL to ${url}`, "No scheme was given, defaulted to http://.");
  }

  emit(`Visiting ${url}`, "Fetching page HTML with a short timeout and manual redirect handling.");
  const { finalUrl, redirectChain, html } = await fetchPage(url, (msg) => emit(msg, "Redirect followed."));
  if (finalUrl !== url) {
    emit(`Landed on ${finalUrl} after ${redirectChain.length} redirect(s)`, "Reporting on the final destination page.");
  }

  emit("Reading page content", "Parsing HTML into logical sections (header/hero/features/pricing/etc.) rather than diffing raw markup.");
  const sections = parseSections(html);
  emit(`Found ${sections.length} section(s): ${sections.map((s) => s.title).join(", ")}`);

  if (!previousSnapshot) {
    emit(
      "No prior snapshot exists for this URL",
      "First visit — nothing to compare against yet. Storing this as the baseline instead of attempting a diff."
    );
    return {
      snapshot: sections,
      meta: { finalUrl, redirectChain, checkedAt: new Date().toISOString() },
      report: { isBaseline: true, sections: [] },
    };
  }

  emit("Comparing against the stored snapshot", "Matching sections by id and diffing HTML + text for each.");
  const diffs = compareSnapshots(previousSnapshot, sections);

  const unchanged = diffs.filter((d) => d.status === "unchanged");
  const changed = diffs.filter((d) => d.status !== "unchanged");

  if (unchanged.length) {
    emit(
      `${unchanged.length} section(s) unchanged: ${unchanged.map((d) => d.title).join(", ")}`,
      "Byte-identical HTML — skipped, no LLM call spent on these."
    );
  }

  if (!changed.length) {
    emit("No differences found since the last visit", "Every section matched the stored snapshot exactly.");
    return {
      snapshot: sections,
      meta: { finalUrl, redirectChain, checkedAt: new Date().toISOString() },
      report: { isBaseline: false, sections: [] },
    };
  }

  const reportSections = [];
  for (const d of changed) {
    if (d.changeType === "functional") {
      emit(
        `Section "${d.title}": markup changed but text is identical`,
        "Classified as functional/formatting only by direct comparison — skipping the LLM call, nothing for a reader to notice."
      );
      reportSections.push({
        id: d.id,
        title: d.title,
        status: d.status,
        classification: "functional",
        significance: "Only styling or markup changed — the visible text is identical.",
        beforeText: d.beforeText,
        afterText: d.afterText,
        wordDiff: d.wordDiff || [],
      });
      continue;
    }

    emit(
      `Section "${d.title}": ${d.status === "added" ? "new section appeared" : d.status === "removed" ? "section was removed" : "content changed"}`,
      "Asking the model to classify the change and explain why it might matter."
    );

    let reasoned;
    try {
      reasoned = await reasonAboutSectionChange({
        title: d.title,
        status: d.status,
        changeType: d.changeType,
        beforeText: d.beforeText,
        afterText: d.afterText,
      });
    } catch (err) {
      emit(`Model reasoning failed for "${d.title}": ${err.message}`, "Falling back to the raw diff without an interpretation.");
      reasoned = { classification: d.changeType, significance: "(LLM interpretation unavailable — see raw diff.)" };
    }

    emit(
      `Section "${d.title}" reasoning complete`,
      `Model classified as "${reasoned.classification}": ${reasoned.significance}`
    );

    reportSections.push({
      id: d.id,
      title: d.title,
      status: d.status,
      classification: reasoned.classification,
      significance: reasoned.significance,
      beforeText: d.beforeText,
      afterText: d.afterText,
      wordDiff: d.wordDiff || [],
    });
  }

  const contentChanges = reportSections.filter((s) => s.classification === "content");
  if (contentChanges.length === 0) {
    emit(
      "Summary: only formatting changes detected",
      "Every changed section was functional-only — nothing content-wise for a human to review."
    );
  } else {
    emit(
      `Summary: ${contentChanges.length} section(s) with real content changes`,
      "These are surfaced in the report below; functional-only changes are shown but de-emphasized."
    );
  }

  return {
    snapshot: sections,
    meta: { finalUrl, redirectChain, checkedAt: new Date().toISOString() },
    report: { isBaseline: false, sections: reportSections },
  };
}

module.exports = { runAgent };
