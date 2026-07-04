// Rasteriserar appikonerna från SVG-källorna i apps/*/public/icon.svg genom
// att rendera dem i headless Chromium (Playwright) och skärmdumpa i exakta
// pixelstorlekar:
//
//   node scripts/generate-icons.mjs
//
// Skriver:
//   scripts/pages-src/icons/{editor,redigerare,konfigurator}-{180,192,512}.png
//     – PWA-/hemskärmsikoner som build-pages.mjs kopierar till pages/.
//   apps/editor-windows/icon.ico
//     – programikon för FredEditor.exe (ICO med PNG-poster 256/48/32/16).
//
// SVG-källorna (per app) är designoriginalen; ändra dem och kör om skriptet.
// Favicons i apparnas HTML inlinas som data-URL:er från samma källor (se
// respektive index.html) så att de följer med enfilsbyggena.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// PWA-katalog (pages/<dir>) → SVG-designoriginal.
const PWA_ICONS = {
  editor: "apps/editor-wasm/public/icon.svg", // pages/editor = WASM-editorn
  redigerare: "apps/editor/public/icon.svg", // pages/redigerare = React-editorn
  konfigurator: "apps/configurator/public/icon.svg",
};
const WINDOWS_ICON_SRC = "apps/editor-windows/public/icon.svg";

async function loadPlaywright() {
  try {
    const require = createRequire(join(root, "package.json"));
    return await import(require.resolve("playwright"));
  } catch {
    const globalPath = "/opt/node22/lib/node_modules/playwright/index.mjs";
    if (existsSync(globalPath)) return import(globalPath);
    throw new Error("Playwright hittades inte. Installera med: npm i -D playwright");
  }
}

const { chromium } = await loadPlaywright();
const executablePath = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium"].find(existsSync);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();

/** Renderar en SVG-fil i angiven pixelstorlek och returnerar PNG-bytes. */
async function renderPng(svgPath, size) {
  const svg = readFileSync(join(root, svgPath), "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><style>*{margin:0;padding:0}body{line-height:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: true });
}

// ---------- PWA-/hemskärmsikoner ----------
const iconsDir = join(root, "scripts/pages-src/icons");
mkdirSync(iconsDir, { recursive: true });
for (const [app, svgPath] of Object.entries(PWA_ICONS)) {
  for (const size of [180, 192, 512]) {
    writeFileSync(join(iconsDir, `${app}-${size}.png`), await renderPng(svgPath, size));
    console.log(`ok  ${app}-${size}.png  (från ${svgPath})`);
  }
}

// ---------- Windows-ikon (.ico med PNG-poster) ----------
// ICO-formatet tillåter PNG-komprimerade poster (Vista+). 256 anges som 0
// i katalogposten.
const icoSizes = [256, 48, 32, 16];
const pngs = [];
for (const size of icoSizes) pngs.push(await renderPng(WINDOWS_ICON_SRC, size));

const count = icoSizes.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserverad
header.writeUInt16LE(1, 2); // typ: ikon
header.writeUInt16LE(count, 4);
const entries = [];
let offset = 6 + 16 * count;
for (let i = 0; i < count; i++) {
  const e = Buffer.alloc(16);
  e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 0); // bredd (0 = 256)
  e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 1); // höjd
  e.writeUInt8(0, 2); // palett
  e.writeUInt8(0, 3); // reserverad
  e.writeUInt16LE(1, 4); // färgplan
  e.writeUInt16LE(32, 6); // bitar per pixel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  entries.push(e);
}
writeFileSync(join(root, "apps/editor-windows/icon.ico"), Buffer.concat([header, ...entries, ...pngs]));
console.log(`ok  icon.ico (${icoSizes.join("/")} px, ${(offset / 1024).toFixed(0)} kB, från ${WINDOWS_ICON_SRC})`);

await browser.close();
console.log("Klart. Kör scripts/build-pages.mjs för att uppdatera pages/.");
