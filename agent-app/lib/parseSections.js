const cheerio = require("cheerio");

function normalizeText(str) {
  return (str || "").replace(/\s+/g, " ").trim();
}

function slugify(str, fallback) {
  const s = normalizeText(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return s || fallback;
}

// Two sections with identical heading text (e.g. two "Overview" sections)
// would otherwise slugify to the same id and silently collide — the second
// one would overwrite the first when matched up for diffing. This keeps
// every id unique by suffixing repeats deterministically.
function dedupeId(id, seen) {
  if (!seen.has(id)) {
    seen.add(id);
    return id;
  }
  let n = 2;
  while (seen.has(`${id}-${n}`)) n += 1;
  const unique = `${id}-${n}`;
  seen.add(unique);
  return unique;
}

/**
 * Parses raw HTML into a list of logical sections. Prefers semantic
 * <section>/<header>/<footer>/<nav> blocks (what a well-built page uses);
 * falls back to splitting on top-level headings for pages that don't.
 *
 * Each section carries both its normalized text (for content diffing) and
 * its raw inner HTML (for detecting formatting-only changes: same text,
 * different markup).
 */
function parseSections(html) {
  const $ = cheerio.load(html);
  const sections = [];

  const matched = $("body").find("section, header, footer, nav").toArray();
  const matchedSet = new Set(matched);
  // A <nav> inside a <header> (or a <section> inside a <section>) would
  // otherwise be counted twice — once as its own block, once as part of its
  // parent's text. Keep only the outermost match per DOM branch.
  const topLevelEls = matched.filter((el) => {
    let parent = $(el).parent();
    while (parent.length && parent.get(0)?.tagName !== "body") {
      if (matchedSet.has(parent.get(0))) return false;
      parent = parent.parent();
    }
    return true;
  });

  if (topLevelEls.length > 0) {
    const seenIds = new Set();
    topLevelEls.forEach((el, i) => {
      const $el = $(el);
      const heading = $el.find("h1, h2, h3").first().text();
      const rawId = $el.attr("id") || slugify(heading, `${el.tagName}-${i}`);
      const id = dedupeId(rawId, seenIds);
      const tagLabel = el.tagName ? el.tagName.charAt(0).toUpperCase() + el.tagName.slice(1) : id;
      sections.push({
        id,
        tag: el.tagName,
        title: normalizeText(heading) || tagLabel,
        text: normalizeText($el.text()),
        html: $.html($el).trim(),
      });
    });
    return sections;
  }

  // Fallback: no semantic sectioning found — split the body by top-level headings.
  const body = $("body");
  const headings = body.find("h1, h2").toArray();
  if (headings.length === 0) {
    return [
      {
        id: "page",
        tag: "body",
        title: normalizeText($("title").text()) || "Page",
        text: normalizeText(body.text()),
        html: $.html(body).trim(),
      },
    ];
  }

  const seenIds = new Set();
  headings.forEach((h, i) => {
    const $h = $(h);
    const title = normalizeText($h.text());
    const id = dedupeId(slugify(title, `section-${i}`), seenIds);
    let text = title;
    let html = $.html($h);
    let node = $h.next();
    while (node.length && !["h1", "h2"].includes(node.prop("tagName")?.toLowerCase())) {
      text += " " + normalizeText(node.text());
      html += $.html(node);
      node = node.next();
    }
    sections.push({ id, tag: "section", title, text: normalizeText(text), html: html.trim() });
  });
  return sections;
}

module.exports = { parseSections, normalizeText };
