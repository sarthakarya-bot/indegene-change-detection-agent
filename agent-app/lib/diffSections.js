const { diffWords } = require("diff");

/**
 * Compares two section lists (previous snapshot vs. this run) and produces
 * a preliminary, deterministic classification for each changed section
 * BEFORE any LLM call:
 *   - identical HTML                -> unchanged (skip entirely, no LLM call)
 *   - identical text, different HTML -> "functional" (styling/markup only)
 *   - different text                 -> "content" (needs LLM reasoning)
 *   - present in only one snapshot   -> "added" / "removed" (always content)
 *
 * This keeps expensive LLM reasoning reserved for sections that actually
 * need judgment, instead of running every section through the model.
 */
function compareSnapshots(oldSections, newSections) {
  const oldMap = new Map(oldSections.map((s) => [s.id, s]));
  const newMap = new Map(newSections.map((s) => [s.id, s]));
  const allIds = [...new Set([...oldMap.keys(), ...newMap.keys()])];

  const results = [];

  for (const id of allIds) {
    const before = oldMap.get(id);
    const after = newMap.get(id);

    if (before && !after) {
      results.push({
        id,
        title: before.title,
        status: "removed",
        changeType: "content",
        beforeText: before.text,
        afterText: "",
        beforeHtml: before.html,
        afterHtml: "",
        wordDiff: diffWords(before.text, ""),
      });
      continue;
    }

    if (!before && after) {
      results.push({
        id,
        title: after.title,
        status: "added",
        changeType: "content",
        beforeText: "",
        afterText: after.text,
        beforeHtml: "",
        afterHtml: after.html,
        wordDiff: diffWords("", after.text),
      });
      continue;
    }

    if (before.html === after.html) {
      results.push({
        id,
        title: after.title,
        status: "unchanged",
        changeType: null,
        beforeText: before.text,
        afterText: after.text,
      });
      continue;
    }

    const textSame = before.text === after.text;
    results.push({
      id,
      title: after.title,
      status: "changed",
      changeType: textSame ? "functional" : "content",
      beforeText: before.text,
      afterText: after.text,
      beforeHtml: before.html,
      afterHtml: after.html,
      wordDiff: textSame ? [] : diffWords(before.text, after.text),
    });
  }

  return results;
}

module.exports = { compareSnapshots };
