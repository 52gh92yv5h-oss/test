// Automatiskt test av kravspecifikationens kapitel 4 (extern integration):
// verifierar att båda editorvarianterna kan startas av en extern applikation
// med förvald mall och förifyllda parametervärden.
//
//   node scripts/test-launch.mjs
//
// Kräver att apparna är byggda (npm run build && npm run build:editor-wasm)
// samt Playwright med Chromium. Skriptet letar efter Playwright dels som
// vanligt beroende, dels på den globala sökväg som används i Claude
// Code-miljön.

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
const executablePath = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const browser = await chromium.launch(executablePath ? { executablePath } : {});

let failures = 0;
const check = (name, cond, extra) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`, extra ?? ""); }
};

// ---------- Kap 4 i WASM-editorn: ?mall=&org=&data= ----------
{
  const page = await browser.newPage();
  const data = encodeURIComponent(JSON.stringify({ sokande: "Anna Andersson" }));
  const url =
    "file://" + join(root, "apps/editor-wasm/dist/index.html") +
    `?mall=mall-fardtjanst&org=org-nasby&data=${data}`;
  await page.goto(url);
  await page.waitForSelector("#page-header .hf-cell", { timeout: 15000 });
  check("WASM: editorn öppnas direkt med angiven mall",
    (await page.locator("#doc-title").textContent())?.includes("Beslut om färdtjänst"));
  const chip = page.locator('#doc-blocks .fred-cc[data-param-id="sokande"]').first();
  check("WASM: initialvärde från extern app infogat i dokumentet",
    (await chip.textContent())?.trim() === "Anna Andersson", await chip.textContent());
  await page.close();
}

// ---------- Kap 4 i React-editorn: ?launch=<base64 JSON> ----------
{
  const page = await browser.newPage();
  const payload = {
    templateId: "mall-exempelbolaget-brev", // inbyggd standardmall → autostart utan filinläsning
    organisationId: "org-exempelbolaget",
    values: { mottagareNamn: "Kalle Karlsson", arende: "Offertförfrågan" },
  };
  const b64 = Buffer.from(unescape(encodeURIComponent(JSON.stringify(payload))), "binary").toString("base64");
  const url = "file://" + join(root, "apps/editor/dist/index.html") + `?launch=${encodeURIComponent(b64)}`;
  await page.goto(url);
  await page.waitForSelector(".document-page", { timeout: 15000 });
  check("React: sessionen autostartar med angiven mall",
    (await page.locator(".editor-topbar .title").textContent())?.includes("Affärsbrev"));
  const chips = page.locator('.fred-param-chip[data-param-id="mottagareNamn"]');
  check("React: initialvärde infogat på alla förekomster",
    (await chips.count()) >= 2 &&
    (await chips.first().textContent())?.trim() === "Kalle Karlsson",
    await chips.first().textContent());
  check("React: ärenderaden förifylld",
    (await page.locator('.fred-param-chip[data-param-id="arende"]').first().textContent())?.trim() === "Offertförfrågan");
  await page.close();
}

await browser.close();
console.log(failures === 0
  ? "\nKapitel 4 (extern integration): alla kontroller gick igenom."
  : `\n${failures} kontroller misslyckades.`);
process.exit(failures ? 1 : 0);
