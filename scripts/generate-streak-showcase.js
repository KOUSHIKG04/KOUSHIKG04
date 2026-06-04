const fs = require("fs");
const path = require("path");

const USERNAME = process.env.GITHUB_USERNAME || "KOUSHIKG04";
const FROM_DATE = process.env.STREAK_FROM || "2021-12-21";
const SVG_PATH = path.join(__dirname, "..", "streak-cards.svg");
const TOKEN = process.env.GITHUB_TOKEN;
const MOCK = process.argv.includes("--mock") || process.env.MOCK_STREAK_DATA === "1";

const MONTH = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(dateString, includeYear = false) {
  const date = parseDate(dateString);
  const month = MONTH.format(date);
  const day = date.getUTCDate();
  return includeYear ? `${month} ${day}, ${date.getUTCFullYear()}` : `${month} ${day}`;
}

function formatRange(start, end) {
  if (!start || !end) {
    return "No streak yet";
  }

  if (start === end) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setText(svg, id, value) {
  const pattern = new RegExp(`(<text\\b[^>]*id="${id}"[^>]*>)([\\s\\S]*?)(</text>)`);
  if (!pattern.test(svg)) {
    throw new Error(`Missing text node: ${id}`);
  }

  return svg.replace(pattern, `$1${escapeXml(value)}$3`);
}

function contributionRanges(fromDate, toDate) {
  const ranges = [];
  let cursor = parseDate(fromDate);
  const end = parseDate(toDate);

  while (cursor <= end) {
    const rangeStart = new Date(cursor);
    const rangeEnd = addDays(rangeStart, 350);
    const cappedEnd = rangeEnd > end ? end : rangeEnd;
    ranges.push({ from: isoDate(rangeStart), to: isoDate(cappedEnd) });
    cursor = addDays(cappedEnd, 1);
  }

  return ranges;
}

async function queryContributions(from, to) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "streak-showcase-generator",
    },
    body: JSON.stringify({
      query: `
        query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              totalContributions
              contributionCalendar {
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        login: USERNAME,
        from: `${from}T00:00:00Z`,
        to: `${to}T23:59:59Z`,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    throw new Error(JSON.stringify(payload.errors || payload, null, 2));
  }

  const collection = payload.data && payload.data.user && payload.data.user.contributionsCollection;
  if (!collection) {
    throw new Error(`Could not read contributions for ${USERNAME}`);
  }

  return collection;
}

function calculateStats(dayMap, fromDate, toDate, totalContributions) {
  const days = [];
  for (let cursor = parseDate(fromDate); cursor <= parseDate(toDate); cursor = addDays(cursor, 1)) {
    const date = isoDate(cursor);
    days.push({ date, count: dayMap.get(date) || 0 });
  }

  const segments = [];
  let active = null;

  for (const day of days) {
    if (day.count > 0) {
      if (!active) {
        active = { start: day.date, end: day.date, length: 0 };
      }
      active.end = day.date;
      active.length += 1;
    } else if (active) {
      segments.push(active);
      active = null;
    }
  }

  if (active) {
    segments.push(active);
  }

  const today = toDate;
  const yesterday = isoDate(addDays(parseDate(today), -1));
  const current = segments.find((segment) => segment.end === today || segment.end === yesterday) || {
    start: null,
    end: null,
    length: 0,
  };

  const longest = segments.reduce(
    (best, segment) => (segment.length > best.length ? segment : best),
    { start: null, end: null, length: 0 }
  );

  return {
    totalContributions,
    totalRange: `${formatDate(fromDate, true)} - Present`,
    currentStreak: current.length,
    currentRange: formatRange(current.start, current.end),
    longestStreak: longest.length,
    longestRange: formatRange(longest.start, longest.end),
  };
}

async function fetchStats() {
  const today = isoDate(new Date());
  const dayMap = new Map();
  let totalContributions = 0;

  for (const range of contributionRanges(FROM_DATE, today)) {
    const collection = await queryContributions(range.from, range.to);
    totalContributions += collection.totalContributions;

    for (const week of collection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        if (day.date >= FROM_DATE && day.date <= today) {
          dayMap.set(day.date, Math.max(dayMap.get(day.date) || 0, day.contributionCount));
        }
      }
    }
  }

  return calculateStats(dayMap, FROM_DATE, today, totalContributions);
}

function mockStats() {
  return {
    totalContributions: 556,
    totalRange: "Dec 21, 2021 - Present",
    currentStreak: 9,
    currentRange: "May 27 - Jun 4",
    longestStreak: 34,
    longestRange: "Apr 13 - May 16",
  };
}

async function main() {
  if (!MOCK && !TOKEN) {
    throw new Error("GITHUB_TOKEN is required unless --mock is used.");
  }

  const stats = MOCK ? mockStats() : await fetchStats();
  let svg = fs.readFileSync(SVG_PATH, "utf8");

  svg = setText(svg, "total-contributions", stats.totalContributions);
  svg = setText(svg, "total-range", stats.totalRange);
  svg = setText(svg, "current-streak", stats.currentStreak);
  svg = setText(svg, "current-range", stats.currentRange);
  svg = setText(svg, "longest-streak", stats.longestStreak);
  svg = setText(svg, "longest-range", stats.longestRange);

  fs.writeFileSync(SVG_PATH, svg);
  console.log(`Updated streak-cards.svg for ${USERNAME}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
