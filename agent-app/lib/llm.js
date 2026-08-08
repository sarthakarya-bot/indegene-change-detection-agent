// Thin OpenRouter client. OpenRouter exposes an OpenAI-compatible
// /chat/completions endpoint, which is why the payload shape below looks
// like an OpenAI call rather than a native Anthropic one.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

async function callModel(messages, { temperature = 0.2, maxTokens = 300 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example).");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/",
      "X-Title": "Change Detection Agent",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response.");
  return content;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Model response did not contain JSON: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

/**
 * Asks the model to (a) confirm functional-vs-content classification and
 * (b) explain in one line why the change might matter. Only called for
 * sections the deterministic pre-classifier already flagged as changed.
 */
async function reasonAboutSectionChange({ title, status, changeType, beforeText, afterText }) {
  const prompt = `You are reviewing a change detected on a monitored webpage, in the section "${title}".

Change status: ${status}
Preliminary classification (from code, not you): ${changeType}

BEFORE:
"""${(beforeText || "(section did not exist)").slice(0, 1500)}"""

AFTER:
"""${(afterText || "(section was removed)").slice(0, 1500)}"""

Decide:
1. "classification": "functional" if this is purely styling/formatting/whitespace with no meaningful difference a reader would notice, or "content" if the actual substance changed (numbers, claims, copy, offers, names, etc).
2. "significance": one plain-English sentence on why this change might matter to someone monitoring this page (or why it doesn't, if it's trivial).

Respond with ONLY a JSON object: {"classification": "functional" | "content", "significance": "..."}`;

  const raw = await callModel([{ role: "user", content: prompt }]);
  const parsed = extractJson(raw);
  return {
    classification: parsed.classification === "functional" ? "functional" : "content",
    significance: String(parsed.significance || "").trim(),
  };
}

module.exports = { callModel, reasonAboutSectionChange };
