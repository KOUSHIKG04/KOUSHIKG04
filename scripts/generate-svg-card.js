const fs = require("fs");
const path = require("path");

const USERNAME = process.env.GITHUB_USERNAME || "KOUSHIKG04";
const FROM_DATE = process.env.STREAK_FROM || "2021-12-21";
const SVG_PATH = path.join(__dirname, "..", "streaks-card.svg");
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
  const value = `${MONTH.format(date)} ${date.getUTCDate()}`;
  return includeYear ? `${value}, ${date.getUTCFullYear()}` : value;
}

function formatRange(start, end) {
  if (!start || !end) {
    return "No streak yet";
  }

  return start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`;
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
    throw new Error(`Missing SVG text node: ${id}`);
  }

  return svg.replace(pattern, `$1${escapeXml(value)}$3`);
}

function getText(svg, id) {
  const pattern = new RegExp(`<text\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</text>`);
  const match = svg.match(pattern);
  if (!match) {
    throw new Error(`Missing SVG text node: ${id}`);
  }

  return match[1];
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
      "User-Agent": "svg-card-generator",
    },
    body: JSON.stringify({
      query: `
        query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
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
      active ||= { start: day.date, end: day.date, length: 0 };
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
    totalContributions += collection.contributionCalendar.totalContributions;

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

function mockStats(svg) {
  return {
    totalContributions: process.env.MOCK_TOTAL_CONTRIBUTIONS || getText(svg, "total-contributions"),
    currentStreak: process.env.MOCK_CURRENT_STREAK || getText(svg, "current-streak"),
    longestStreak: process.env.MOCK_LONGEST_STREAK || getText(svg, "longest-streak"),
  };
}

async function main() {
  if (!MOCK && !TOKEN) {
    throw new Error("GITHUB_TOKEN is required unless --mock is used.");
  }

  let svg = fs.readFileSync(SVG_PATH, "utf8");
  const stats = MOCK ? mockStats(svg) : await fetchStats();

  svg = setText(svg, "total-contributions", stats.totalContributions);
  svg = setText(svg, "current-streak", stats.currentStreak);
  svg = setText(svg, "longest-streak", stats.longestStreak);

  fs.writeFileSync(SVG_PATH, svg);
  console.log(`Updated streaks-card.svg for ${USERNAME}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
