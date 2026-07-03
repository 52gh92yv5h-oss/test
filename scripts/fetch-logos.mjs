// Hämtar riktiga myndighetslogotyper från Wikimedia Commons och bäddar in
// dem som base64-data-URL:er i templates/swedish-government/organisations.json.
//
//   node scripts/fetch-logos.mjs
//
// Kräver nätverksåtkomst till commons.wikimedia.org och upload.wikimedia.org.
// I miljöer med begränsad nätverkspolicy (t.ex. Claude Code-miljöer som bara
// tillåter paketregister) misslyckas skriptet med tydligt felmeddelande –
// kör det då lokalt eller öppna policyn för wikimedia.org-domänerna.
//
// Varumärkesnot: logotyperna tillhör respektive myndighet och används här
// endast för att återge korrekt avsändare i dokumentmallarna.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORG_FILE = join(root, "templates/swedish-government/organisations.json");

// Sökterm per organisations-id. Commons-API:t får ranka träffarna;
// vi tar första fil som ser ut som en logotyp (svg/png).
const SEARCH_TERMS = {
  "org-arbetsformedlingen": "Arbetsförmedlingen logo",
  "org-skatteverket": "Skatteverket logo",
  "org-forsaksringskassan": "Försäkringskassan logo",
  "org-csn": "Centrala studiestödsnämnden logo",
  "org-migrationsverket": "Migrationsverket logo",
  "org-polismyndigheten": "Polismyndigheten Sverige logo",
  "org-kronofogden": "Kronofogdemyndigheten logo",
};

const API = "https://commons.wikimedia.org/w/api.php";
const HEADERS = { "User-Agent": "fred-template-logos/1.0 (dokumentmallar; engångshämtning)" };

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Commons-API svarade ${res.status} för ${url}`);
  return res.json();
}

async function findLogoFile(term) {
  const data = await api({
    action: "query",
    list: "search",
    srsearch: term,
    srnamespace: "6", // File:
    srlimit: "10",
  });
  const hits = data?.query?.search ?? [];
  const candidate = hits.find((h) => /\.(svg|png)$/i.test(h.title));
  return candidate?.title ?? null; // t.ex. "File:Skatteverket logo.svg"
}

async function fetchImageAsDataUrl(fileTitle) {
  // Be om en PNG-thumb (~400px bred) även för SVG – ger jämn rendering
  // och rimlig storlek i JSON-filen.
  const data = await api({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "400",
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  const url = info?.thumburl ?? info?.url;
  if (!url) throw new Error(`Ingen bild-URL för ${fileTitle}`);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Bildhämtning svarade ${res.status} för ${url}`);
  const mime = res.headers.get("content-type")?.split(";")[0] || info.mime || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error(`Misstänkt liten fil (${buf.length} B) för ${fileTitle}`);
  return { dataUrl: `data:${mime};base64,${buf.toString("base64")}`, source: fileTitle, bytes: buf.length };
}

const orgFile = JSON.parse(readFileSync(ORG_FILE, "utf8"));
let updated = 0;
const failures = [];

for (const org of orgFile.organisations) {
  const term = SEARCH_TERMS[org.id];
  if (!term) continue;
  try {
    const fileTitle = await findLogoFile(term);
    if (!fileTitle) throw new Error(`Ingen logotyp hittad på Commons för "${term}"`);
    const { dataUrl, source, bytes } = await fetchImageAsDataUrl(fileTitle);
    org.logoDataUrl = dataUrl;
    org.logoSource = `Wikimedia Commons: ${source}`;
    updated++;
    console.log(`ok   ${org.name} ← ${source} (${(bytes / 1024).toFixed(0)} kB)`);
  } catch (err) {
    failures.push(`${org.name}: ${err.message}`);
    console.error(`FAIL ${org.name}: ${err.message}`);
  }
}

if (updated > 0) {
  writeFileSync(ORG_FILE, JSON.stringify(orgFile, null, 2) + "\n");
  console.log(`\n${updated} logotyper inbäddade i ${ORG_FILE}`);
}
if (failures.length > 0) {
  console.error(`\n${failures.length} logotyper kunde inte hämtas. Kontrollera nätverksåtkomsten till wikimedia.org.`);
  process.exit(1);
}
