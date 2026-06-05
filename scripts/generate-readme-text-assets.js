const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "GeistPixel-Square.woff2");
const POPPINS_FONT_PATH = path.join(ROOT, "assets", "fonts", "Poppins-500.woff2");
const fontData = fs.readFileSync(FONT_PATH).toString("base64");
const poppinsFontData = fs.readFileSync(POPPINS_FONT_PATH).toString("base64");

const fontFace = `@font-face {
      font-family: "Geist PixelSquare";
      src: url("data:font/woff2;base64,${fontData}") format("woff2");
      font-weight: 500;
      font-style: normal;
    }`;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeTextSvg(fileName, { width = 1000, height, fontSize, lines, textAnchor = "middle", x = 500 }) {
  const lineHeight = Math.round(fontSize * 1.45);
  const totalTextHeight = lineHeight * (lines.length - 1);
  const startY = Math.round((height - totalTextHeight) / 2);
  const text = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `  <text x="${x}" y="${y}">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace}

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-size: ${fontSize}px;
      font-weight: 500;
      fill: #f7f7f7;
      text-anchor: ${textAnchor};
      dominant-baseline: middle;
    }
  </style>
${text}
</svg>
`;

  fs.writeFileSync(path.join(ROOT, fileName), svg);
}

function readExistingSvgText(fileName, id) {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) {
    return "--";
  }

  const svg = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`<text\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</text>`);
  const match = svg.match(pattern);
  return match ? match[1] : "--";
}

function writeIntroSvg() {
  const icons = [
    {
      file: "react-original.svg",
      alt: "React logo",
    },
    {
      file: "nextjs-original.svg",
      alt: "Next.js logo",
    },
    {
      file: "javascript-original.svg",
      alt: "JavaScript logo",
    },
    {
      file: "typescript-original.svg",
      alt: "TypeScript logo",
    },
    {
      file: "bun-original.svg",
      alt: "Bun.js logo",
    },
    {
      file: "nodejs-original.svg",
      alt: "Node.js logo",
    },
  ];

  const iconMarkup = icons
    .map((icon, index) => {
      const x = 803 + index * 28;
      const iconPath = path.join(ROOT, "assets", "icons", icon.file);
      const iconData = fs.readFileSync(iconPath).toString("base64");
      const href = `data:image/svg+xml;base64,${iconData}`;
      return `  <image href="${href}" x="${x}" y="22" width="22" height="22">
    <title>${escapeXml(icon.alt)}</title>
  </image>`;
    })
    .join("\n");

  const svg = `<svg width="1000" height="130" viewBox="0 0 1000 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace}

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-size: 20px;
      font-weight: 500;
      fill: #f7f7f7;
      text-anchor: start;
      dominant-baseline: middle;
    }
  </style>
  <text x="32" y="36" textLength="765" lengthAdjust="spacingAndGlyphs">Hi there! I'm KOUSHIK G, a Frontend Developer with hands-on experience in</text>
${iconMarkup}
  <text x="32" y="68">I focus on building responsive, user-centric applications and enjoy exploring modern technologies,</text>
  <text x="32" y="96">improving development practices, and turning ideas into useful digital products.</text>
</svg>
`;

  fs.writeFileSync(path.join(ROOT, "readme-intro.svg"), svg);
}

writeIntroSvg();

function writeFooterSvgs() {
  const footerTextSvg = `<svg width="570" height="40" viewBox="0 0 570 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace}

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-size: 31px;
      font-weight: 500;
      fill: #f7f7f7;
      text-anchor: start;
      dominant-baseline: middle;
    }
  </style>
  <text x="32" y="20" textLength="530" lengthAdjust="spacingAndGlyphs">Let's build something awesome together!</text>
</svg>
`;

  fs.writeFileSync(path.join(ROOT, "readme-footer-text.svg"), footerTextSvg);

  const linkedinData = fs.readFileSync(path.join(ROOT, "linkedin.png")).toString("base64");
  const twitterData = fs.readFileSync(path.join(ROOT, "twitter-x-.png")).toString("base64");
  const footerIconsSvg = `<svg width="610" height="92" viewBox="0 0 610 92" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(32 30)">
    <path d="M0 4C0 1.8 1.8 0 4 0H28C30.2 0 32 1.8 32 4V28C32 30.2 30.2 32 28 32H4C1.8 32 0 30.2 0 28V4Z" fill="#EA4335"/>
    <path d="M5 9L16 17L27 9V25H22V18L16 22.5L10 18V25H5V9Z" fill="#111111"/>
  </g>
  <image href="data:image/png;base64,${linkedinData}" x="82" y="30" width="32" height="32" />
  <image href="data:image/png;base64,${twitterData}" x="132" y="30" width="32" height="32" />
</svg>
`;

  fs.writeFileSync(path.join(ROOT, "readme-footer-icons.svg"), footerIconsSvg);
}

writeFooterSvgs();

function writeStreaksSvg() {
  const totalContributions = readExistingSvgText("streaks-card.svg", "total-contributions");
  const currentStreak = readExistingSvgText("streaks-card.svg", "current-streak");
  const longestStreak = readExistingSvgText("streaks-card.svg", "longest-streak");

  const svg = `<svg width="1400" height="179" viewBox="0 0 1400 179" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace}

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-weight: 500;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .value {
      fill: #f7f7f7;
      font-size: 58px;
      paint-order: stroke;
      stroke: rgba(255, 255, 255, 0.18);
      stroke-width: 1px;
    }

    .label {
      fill: #b8b8b8;
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 4px;
    }
  </style>

  <defs>
    <pattern id="diagonal-lines" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="16" stroke="#141414" stroke-width="3" opacity="0.55" />
    </pattern>
    <filter id="soft-shadow" x="-5%" y="-25%" width="110%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect x="18" y="20" width="1364" height="139" rx="19" fill="#020202" stroke="#2c2c2c" stroke-width="3" filter="url(#soft-shadow)" />
  <rect x="25" y="27" width="1350" height="125" rx="14" fill="url(#diagonal-lines)" opacity="0.7" />
  <rect x="25" y="27" width="1350" height="125" rx="14" stroke="#111111" stroke-width="2" />

  <line x1="500" y1="48" x2="500" y2="131" stroke="#2c2c2c" stroke-width="2" />
  <line x1="900" y1="48" x2="900" y2="131" stroke="#2c2c2c" stroke-width="2" />

  <text id="total-contributions" class="value" x="300" y="75">${escapeXml(totalContributions)}</text>
  <text class="label" x="300" y="121">TOTAL CONTRIBUTION</text>

  <text id="current-streak" class="value" x="670" y="75">${escapeXml(currentStreak)}</text>
  <g transform="translate(718 52)">
    <rect x="16" y="0" width="8" height="8" fill="#ff3d20" />
    <rect x="8" y="8" width="8" height="8" fill="#ff5a1f" />
    <rect x="16" y="8" width="8" height="8" fill="#ff7a18" />
    <rect x="24" y="8" width="8" height="8" fill="#ff3d20" />
    <rect x="8" y="16" width="8" height="8" fill="#ff8a12" />
    <rect x="16" y="16" width="8" height="8" fill="#ffd33d" />
    <rect x="24" y="16" width="8" height="8" fill="#ff6a1a" />
    <rect x="0" y="24" width="8" height="8" fill="#ff5a1f" />
    <rect x="8" y="24" width="8" height="8" fill="#ffd33d" />
    <rect x="16" y="24" width="8" height="8" fill="#ffe66d" />
    <rect x="24" y="24" width="8" height="8" fill="#ff8a12" />
    <rect x="32" y="24" width="8" height="8" fill="#ff3d20" />
    <rect x="0" y="32" width="8" height="8" fill="#ff8a12" />
    <rect x="8" y="32" width="8" height="8" fill="#ffd33d" />
    <rect x="16" y="32" width="8" height="8" fill="#ffd33d" />
    <rect x="24" y="32" width="8" height="8" fill="#ff8a12" />
    <rect x="32" y="32" width="8" height="8" fill="#ff5a1f" />
  </g>
  <text class="label" x="700" y="121">CURRENT STREAKS</text>

  <text id="longest-streak" class="value" x="1100" y="75">${escapeXml(longestStreak)}</text>
  <text class="label" x="1100" y="121">LONGEST STREAKS</text>
</svg>
`;

  fs.writeFileSync(path.join(ROOT, "streaks-card.svg"), svg);
}

writeStreaksSvg();

function writeQuotesSvg() {
  const quotes = [
    "Karmanye vadhikaraste ma phaleshu kadachana.",
    "Yogaḥ karmasu kauśalam.",
    "Na hi kalyāṇa-kṛt kaścid durgatiṁ tāta gacchati.",
    "Uddhared ātmanātmānaṁ nātmānam avasādayet.",
    "Sukha-duḥkhe same kṛtvā lābhālābhau jayājayau.",
  ];

  const clipPaths = quotes
    .map(
      (_, index) =>
        `    <clipPath id="clip-quote-${index + 1}"><rect id="quote-mask-${index + 1}" class="mask-quote" x="0" y="5" width="0" height="32"/></clipPath>`
    )
    .join("\n");

  const groups = quotes
    .map(
      (quote, index) => `  <g id="group-${index + 1}" class="group">
    <text class="quote" x="500" y="21" clip-path="url(#clip-quote-${index + 1})">"${escapeXml(quote)}"</text>
  </g>`
    )
    .join("\n\n");

  const svg = `<svg width="1000" height="42" viewBox="0 0 1000 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @font-face {
      font-family: "Poppins";
      src: url("data:font/woff2;base64,${poppinsFontData}") format("woff2");
      font-weight: 500;
      font-style: normal;
    }

    text {
      font-family: "Poppins", Arial, sans-serif;
      font-weight: 500;
      fill: #f7f7f7;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .quote {
      font-size: 18px;
    }

    .group {
      opacity: 0;
      animation: show 50s linear infinite;
    }

    .mask-quote {
      animation: type 50s linear infinite;
    }

    #group-1 { animation-name: show-1; }
    #group-2 { animation-name: show-2; }
    #group-3 { animation-name: show-3; }
    #group-4 { animation-name: show-4; }
    #group-5 { animation-name: show-5; }

    #quote-mask-1 { animation-name: type-quote-1; }
    #quote-mask-2 { animation-name: type-quote-2; }
    #quote-mask-3 { animation-name: type-quote-3; }
    #quote-mask-4 { animation-name: type-quote-4; }
    #quote-mask-5 { animation-name: type-quote-5; }

    @keyframes show-1 {
      0%, 18% { opacity: 1; }
      19.5%, 99.9% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes show-2 {
      0%, 19.9% { opacity: 0; }
      20%, 38% { opacity: 1; }
      39.5%, 100% { opacity: 0; }
    }

    @keyframes show-3 {
      0%, 39.9% { opacity: 0; }
      40%, 58% { opacity: 1; }
      59.5%, 100% { opacity: 0; }
    }

    @keyframes show-4 {
      0%, 59.9% { opacity: 0; }
      60%, 78% { opacity: 1; }
      79.5%, 100% { opacity: 0; }
    }

    @keyframes show-5 {
      0%, 79.9% { opacity: 0; }
      80%, 98% { opacity: 1; }
      99.5%, 100% { opacity: 0; }
    }

    @keyframes type-quote-1 {
      0% { width: 0; }
      5% { width: 1000px; }
      19.9% { width: 1000px; }
      20%, 100% { width: 0; }
    }

    @keyframes type-quote-2 {
      0%, 20% { width: 0; }
      25% { width: 1000px; }
      39.9% { width: 1000px; }
      40%, 100% { width: 0; }
    }

    @keyframes type-quote-3 {
      0%, 40% { width: 0; }
      45% { width: 1000px; }
      59.9% { width: 1000px; }
      60%, 100% { width: 0; }
    }

    @keyframes type-quote-4 {
      0%, 60% { width: 0; }
      65% { width: 1000px; }
      79.9% { width: 1000px; }
      80%, 100% { width: 0; }
    }

    @keyframes type-quote-5 {
      0%, 80% { width: 0; }
      85% { width: 1000px; }
      99.5% { width: 1000px; }
      100% { width: 0; }
    }
  </style>

  <defs>
${clipPaths}
  </defs>

${groups}
</svg>
`;

  fs.writeFileSync(path.join(ROOT, "quotes-typing.svg"), svg);
}

writeQuotesSvg();
