const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FONT_PATH = path.join(ROOT, "assets", "fonts", "GeistPixel-Square.woff2");
const fontData = fs.readFileSync(FONT_PATH).toString("base64");

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

function writeTextSvg(fileName, { height, fontSize, lines }) {
  const lineHeight = Math.round(fontSize * 1.45);
  const totalTextHeight = lineHeight * (lines.length - 1);
  const startY = Math.round((height - totalTextHeight) / 2);
  const text = lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `  <text x="500" y="${y}">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const svg = `<svg width="1000" height="${height}" viewBox="0 0 1000 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace}

    text {
      font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;
      font-size: ${fontSize}px;
      font-weight: 500;
      fill: #f7f7f7;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>
${text}
</svg>
`;

  fs.writeFileSync(path.join(ROOT, fileName), svg);
}

writeTextSvg("readme-intro-top.svg", {
  height: 44,
  fontSize: 19,
  lines: ["Hi there! I'm KOUSHIK G, a Frontend Developer with hands-on experience in"],
});

writeTextSvg("readme-intro-bottom.svg", {
  height: 72,
  fontSize: 17,
  lines: [
    "I focus on building responsive, user-centric applications and enjoy exploring modern technologies,",
    "improving development practices, and turning ideas into useful digital products.",
  ],
});

writeTextSvg("readme-footer-text.svg", {
  height: 52,
  fontSize: 28,
  lines: ["Let's build something awesome together!"],
});

const quotesPath = path.join(ROOT, "quotes-typing.svg");
let quotesSvg = fs.readFileSync(quotesPath, "utf8");
quotesSvg = quotesSvg.replace(/\s*@font-face\s*\{[\s\S]*?\}\s*/g, "");
quotesSvg = quotesSvg.replace(
  /<style>\s*/,
  `<style>
    ${fontFace}

`
);
quotesSvg = quotesSvg.replace(
  /font-family:\s*"[^"]+"(?:,\s*"[^"]+")*(?:,\s*[^;]+)?;/,
  'font-family: "Geist PixelSquare", "Geist Mono", "Fira Code", Consolas, monospace;'
);
quotesSvg = quotesSvg.replace(/font-weight:\s*400;/g, "font-weight: 500;");
fs.writeFileSync(quotesPath, quotesSvg);
