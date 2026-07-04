// Hämtar riktiga myndighetslogotyper från Wikimedia (Commons + en.wikipedia)
// och bäddar in dem som base64-data-URL:er i
// templates/swedish-government/organisations.json.
//
//   node scripts/fetch-logos.mjs
//
// Kräver nätverksåtkomst till *.wikimedia.org / *.wikipedia.org. I miljöer
// med begränsad nätverkspolicy (t.ex. Claude Code-miljöer med "Trusted")
// misslyckas skriptet med tydligt felmeddelande – lägg då till domänerna i
// miljöns tillåtlista eller kör skriptet lokalt.
//
// Varumärkesnot: logotyperna tillhör respektive myndighet och används här
// endast för att återge korrekt avsändare i dokumentmallarna.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORG_FILE = join(root, "templates/swedish-government/organisations.json");

// Känd filtitel per organisation (verifierade mot respektive wiki) samt
// sökterm som fallback om titeln skulle försvinna/döpas om.
const SOURCES = {
  "org-arbetsformedlingen": {
    wiki: "commons.wikimedia.org",
    title: "File:Arbetsförmedlingen logo.svg",
    search: "Arbetsförmedlingen logo svg",
  },
  "org-skatteverket": {
    // Saknas på Commons; ligger lokalt på engelska Wikipedia.
    wiki: "en.wikipedia.org",
    title: "File:Skatteverket Logo.svg",
    search: "intitle:Skatteverket logo",
  },
  "org-forsaksringskassan": {
    wiki: "commons.wikimedia.org",
    title: "File:Logo Försäkringskassan.svg",
    search: "Försäkringskassan logo svg",
  },
  "org-csn": {
    wiki: "commons.wikimedia.org",
    title: "File:Centrala Studiestödsnämnden logo.svg",
    search: "Centrala studiestödsnämnden logo",
  },
  "org-migrationsverket": {
    wiki: "commons.wikimedia.org",
    title: "File:Logotyp för Migrationsverket.svg",
    search: "Migrationsverket logotyp svg",
  },
  "org-polismyndigheten": {
    // Polisens vapen – emblemet i myndighetens logotyp.
    wiki: "commons.wikimedia.org",
    title: "File:Polisen vapen.svg",
    search: "Polisen vapen svg",
  },
  "org-kronofogden": {
    wiki: "commons.wikimedia.org",
    title: "File:Logo Kronofogdemyndigheten.svg",
    search: "Kronofogdemyndigheten logo svg",
  },
};

const HEADERS = { "User-Agent": "fred-template-logos/1.0 (dokumentmallar; engångshämtning)" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Hämtar med omförsök vid 429 (Wikimedias hastighetsbegränsning). */
async function fetchWithRetry(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status !== 429) return res;
    const wait = 3000 * 2 ** i;
    console.log(`     429 – väntar ${wait / 1000}s och försöker igen …`);
    await sleep(wait);
  }
  return fetch(url, { headers: HEADERS });
}

async function api(wiki, params) {
  // OBS: inget `origin`-parameter här – Wikimedias API svarar 403 på
  // `origin=*` från icke-CORS-klienter (t.ex. Node).
  const url = `https://${wiki}/w/api.php?${new URLSearchParams({ format: "json", ...params })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`API på ${wiki} svarade ${res.status}`);
  return res.json();
}

async function imageInfo(wiki, title) {
  const data = await api(wiki, {
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "400", // PNG-thumb även för SVG → jämn rendering, rimlig storlek
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  return page?.imageinfo?.[0] ?? null;
}

async function searchFile(wiki, term) {
  const data = await api(wiki, {
    action: "query",
    list: "search",
    srsearch: term,
    srnamespace: "6",
    srlimit: "10",
  });
  const hits = data?.query?.search ?? [];
  return hits.find((h) => /\.(svg|png)$/i.test(h.title))?.title ?? null;
}

async function fetchLogo({ wiki, title, search }) {
  let info = await imageInfo(wiki, title);
  let usedTitle = title;
  if (!info) {
    usedTitle = await searchFile(wiki, search);
    if (!usedTitle) throw new Error(`hittades varken via titel eller sökning på ${wiki}`);
    info = await imageInfo(wiki, usedTitle);
    if (!info) throw new Error(`ingen bildinfo för ${usedTitle}`);
  }
  const url = info.thumburl ?? info.url;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`bildhämtning svarade ${res.status}`);
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error(`misstänkt liten fil (${buf.length} B)`);
  return {
    dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
    source: `${wiki}: ${usedTitle}`,
    bytes: buf.length,
  };
}

const orgFile = JSON.parse(readFileSync(ORG_FILE, "utf8"));
let updated = 0;
const failures = [];

for (const org of orgFile.organisations) {
  const src = SOURCES[org.id];
  if (!src) continue;
  try {
    const { dataUrl, source, bytes } = await fetchLogo(src);
    org.logoDataUrl = dataUrl;
    org.logoSource = source;
    updated++;
    console.log(`ok   ${org.name} ← ${source} (${(bytes / 1024).toFixed(0)} kB)`);
  } catch (err) {
    failures.push(`${org.name}: ${err.message}`);
    console.error(`FAIL ${org.name}: ${err.message}`);
  }
  await sleep(1500); // skona Wikimedias thumbnail-tjänst
}

if (updated > 0) {
  writeFileSync(ORG_FILE, JSON.stringify(orgFile, null, 2) + "\n");
  console.log(`\n${updated} logotyper inbäddade i ${ORG_FILE}`);
}
if (failures.length > 0) {
  console.error(`\n${failures.length} logotyper kunde inte hämtas. Kontrollera nätverksåtkomsten till wikimedia.org/wikipedia.org.`);
  process.exit(1);
}
