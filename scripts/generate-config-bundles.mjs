// Genererar apps/editor/src/builtin.ts och
// apps/configurator/src/predefinedBundle.ts från de konsoliderade
// config.json-filerna (kravspec V12: enhetlig ConfigFile med
// organisationer + hierarki + mallar).
//
//   node scripts/generate-config-bundles.mjs
//
// Körs offline (ingen nätverksåtkomst) - bakar bara in redan lokala
// JSON-filer som TS-konstanter så apparna slipper läsa filer vid körning.
// Kör om detta skript efter att ha redigerat templates/standard/config.json
// eller templates/swedish-government/config.json för hand.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

// ---------- apps/editor/src/builtin.ts ----------
const std = loadJson("templates/standard/config.json");

const builtinTs = `// Inbyggd standardkonfiguration (kravspec V12): en enhetlig ConfigFile med
// organisation, hierarki och affärsbrevsmall för det fiktiva företaget
// Exempelbolaget AB, tillgänglig utan att externa filer läses in.
// Logotypen är egendesignad för Fred (CC0).
//
// Genererad fil - regenerera via
// node scripts/generate-config-bundles.mjs från
// templates/standard/config.json. Redigera inte för hand.
import { ConfigFile } from "@fred/shared";

export const BUILTIN_CONFIG: ConfigFile = ${JSON.stringify(std, null, 2)} as unknown as ConfigFile;

export const BUILTIN_ORGANISATION = BUILTIN_CONFIG.organisations[0];
export const BUILTIN_MALL = BUILTIN_CONFIG.mallar[0];

// Datum-parametern förifylls med dagens datum vid appstart.
const datumDef = BUILTIN_MALL.parameters.find((p) => p.id === "datum");
if (datumDef) datumDef.defaultValue = new Date().toISOString().slice(0, 10);
`;
writeFileSync(join(root, "apps/editor/src/builtin.ts"), builtinTs);
console.log("Skrev apps/editor/src/builtin.ts");

// ---------- apps/configurator/src/predefinedBundle.ts ----------
const sg = loadJson("templates/swedish-government/config.json");

const bundleTs = `// Fördefinierad mallbunt (kravspec V12): Sveriges myndighetsmallar,
// tillgänglig i Konfiguratorn via knappen "Lägg till Sveriges
// myndighetsmallar". Bakas in offline - inget nätverksanrop krävs.
//
// Genererad fil - regenerera via
// node scripts/generate-config-bundles.mjs från
// templates/swedish-government/config.json. Redigera inte för hand.
import { ConfigFile } from "@fred/shared";

export const PREDEFINED_BUNDLE: ConfigFile = ${JSON.stringify(sg, null, 2)} as unknown as ConfigFile;
`;
writeFileSync(join(root, "apps/configurator/src/predefinedBundle.ts"), bundleTs);
console.log("Skrev apps/configurator/src/predefinedBundle.ts");
