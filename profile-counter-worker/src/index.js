import { FONT_DATA } from "./font-data.js";

const DEFAULT_USERNAME = "KOUSHIKG04";
const COUNTER_URL = "https://komarev.com/ghpvc/";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extractCount(badgeSvg) {
  const ariaLabel = badgeSvg.match(/aria-label="[^"]*:\s*([^"]+)"/i);
  if (ariaLabel) {
    return ariaLabel[1].trim();
  }

  const values = [...badgeSvg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/gi)]
    .map((match) => match[1].trim())
    .filter((value) => /^[\d,.]+(?:[KMBT]|Qa|Qi)?$/i.test(value));

  return values.at(-1) || "--";
}

export function renderProfileViewsSvg(count) {
  const safeCount = escapeXml(count);

  return `<svg width="109" height="30" viewBox="0 0 109 30" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Profile views: ${safeCount}">
  <style>
    @font-face {
      font-family: "Geist PixelSquare";
      src: url("data:font/woff2;base64,${FONT_DATA}") format("woff2");
      font-weight: 500;
      font-style: normal;
    }

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-weight: 500;
      dominant-baseline: middle;
    }

    .label {
      fill: #f7f7f7;
      font-size: 7px;
      letter-spacing: 0.75px;
    }

    .count {
      fill: #f7f7f7;
      font-size: 9.5px;
      text-anchor: middle;
    }
  </style>

  <defs>
    <pattern id="diagonal-lines" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="#181818" stroke-width="2" opacity="0.7" />
    </pattern>
  </defs>

  <rect x="1" y="1" width="107" height="28" rx="6" fill="#020202" stroke="#2c2c2c" stroke-width="2" />
  <rect x="4" y="4" width="101" height="22" rx="3" fill="url(#diagonal-lines)" stroke="#111111" />
  <line x1="82" y1="5" x2="82" y2="25" stroke="#2c2c2c" />

  <text class="label" x="9" y="15.5">PROFILE VIEWS</text>
  <text class="count" x="95.5" y="15.5">${safeCount}</text>
</svg>`;
}

async function fetchProfileCount(username) {
  const counterUrl = new URL(COUNTER_URL);
  counterUrl.searchParams.set("username", username);
  counterUrl.searchParams.set("label", "PROFILE VIEWS");
  counterUrl.searchParams.set("color", "020202");
  counterUrl.searchParams.set("style", "flat-square");
  counterUrl.searchParams.set("abbreviated", "true");
  counterUrl.searchParams.set("request", Date.now().toString());

  const response = await fetch(counterUrl, {
    headers: { "User-Agent": "koushik-profile-views-worker" },
    cf: { cacheTtl: 0, cacheEverything: false },
  });

  if (!response.ok) {
    throw new Error(`Counter service returned ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 64_000) {
    throw new Error("Counter service response was unexpectedly large");
  }

  const badgeSvg = await response.text();
  if (badgeSvg.length > 64_000) {
    throw new Error("Counter service response was unexpectedly large");
  }

  return extractCount(badgeSvg);
}

export default {
  async fetch(request, environment) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/health") {
      return Response.json({ ok: true });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (requestUrl.pathname !== "/" && requestUrl.pathname !== "/profile-views.svg") {
      return new Response("Not found", { status: 404 });
    }

    const username = environment.PROFILE_USERNAME || DEFAULT_USERNAME;
    let count = "--";

    try {
      count = await fetchProfileCount(username);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "profile_count_fetch_failed",
          message: error instanceof Error ? error.message : String(error),
          path: requestUrl.pathname,
        }),
      );
    }

    return new Response(request.method === "HEAD" ? null : renderProfileViewsSvg(count), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Surrogate-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
