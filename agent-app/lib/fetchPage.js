// Visits a URL and returns its HTML, handling redirects and timeouts explicitly
// rather than relying on fetch's silent auto-follow. The agent needs to know
// *that* a redirect happened (and log it) — auto-follow would hide that decision.

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;

function normalizeUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) throw new Error("URL is empty.");
  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url; // default to http for local targets; https-first would break localhost demos
  }
  return url;
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "ChangeDetectionAgent/1.0 (+indegene-assignment)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} rawUrl
 * @param {(msg: string) => void} log
 * @returns {Promise<{finalUrl: string, status: number, html: string, redirectChain: string[]}>}
 */
async function fetchPage(rawUrl, log = () => {}) {
  let url = normalizeUrl(rawUrl);
  const redirectChain = [];
  let hops = 0;

  while (true) {
    if (hops > MAX_REDIRECTS) {
      throw new Error(`Too many redirects (>${MAX_REDIRECTS}) starting from ${rawUrl}.`);
    }

    let res;
    try {
      res = await fetchOnce(url);
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${TIMEOUT_MS}ms.`);
      }
      throw new Error(`Could not reach ${url}: ${err.message}`);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect from ${url} had no Location header.`);
      const next = new URL(location, url).toString();
      log(`Redirected (${res.status}): ${url} -> ${next}`);
      redirectChain.push(url);
      url = next;
      hops += 1;
      continue;
    }

    if (res.status >= 400) {
      throw new Error(`${url} responded with HTTP ${res.status}.`);
    }

    const html = await res.text();
    return { finalUrl: url, status: res.status, html, redirectChain };
  }
}

module.exports = { fetchPage, normalizeUrl };
