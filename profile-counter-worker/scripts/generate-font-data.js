import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.resolve(scriptDirectory, "..");
const fontPath = path.resolve(workerRoot, "..", "assets", "fonts", "GeistPixel-Square.woff2");
const outputPath = path.join(workerRoot, "src", "font-data.js");
const fontData = fs.readFileSync(fontPath).toString("base64");

fs.writeFileSync(outputPath, `export const FONT_DATA = ${JSON.stringify(fontData)};\n`);
console.log("Generated src/font-data.js");
