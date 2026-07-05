// Central versionshantering: rot-package.json är enda källan, och det här
// skriptet speglar versionen till alla ställen där den förekommer.
//
//   node scripts/bump-version.mjs            # bumpar patch (1.2.3 -> 1.2.4)
//   node scripts/bump-version.mjs minor      # 1.2.3 -> 1.3.0
//   node scripts/bump-version.mjs major      # 1.2.3 -> 2.0.0
//   node scripts/bump-version.mjs 2.5.0      # sätter exakt version
//   node scripts/bump-version.mjs --check    # verifierar att allt är i synk (CI)
//
// Speglas till:
//   packages/shared/src/version.ts        FRED_VERSION (visas i React-apparna)
//   packages/*/package.json, apps/*/package.json
//   apps/editor-wasm/engine/Cargo.toml    + Cargo.lock (visas i WASM-editorn)
//   apps/editor-windows/FredEditor.csproj <Version> (exe-metadata)
//   README.md                             "Version X.Y.Z"
//
// Service worker-cachenamnet i pages/ härleds automatiskt ur versionen av
// scripts/build-pages.mjs – installerade PWA:er uppdateras därmed vid varje
// versionsbump utan manuell cachebump.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootPkgPath = join(root, "package.json");
const current = JSON.parse(readFileSync(rootPkgPath, "utf8")).version;

const arg = process.argv[2] ?? "patch";
const checkOnly = arg === "--check";

function nextVersion() {
  if (/^\d+\.\d+\.\d+$/.test(arg)) return arg;
  const [ma, mi, pa] = current.split(".").map(Number);
  if (arg === "major") return `${ma + 1}.0.0`;
  if (arg === "minor") return `${ma}.${mi + 1}.0`;
  if (arg === "patch") return `${ma}.${mi}.${pa + 1}`;
  console.error(`Okänt argument: ${arg} (använd patch|minor|major|x.y.z|--check)`);
  process.exit(2);
}

const version = checkOnly ? current : nextVersion();

/** Alla filer som bär versionen + hur den byts/verifieras i respektive fil. */
const TARGETS = [
  ...[
    "package.json",
    "packages/shared/package.json",
    "apps/editor/package.json",
    "apps/configurator/package.json",
    "apps/editor-wasm/package.json",
  ].map((p) => ({
    path: p,
    pattern: /("version":\s*")(\d+\.\d+\.\d+)(")/,
  })),
  {
    path: "packages/shared/src/version.ts",
    pattern: /(FRED_VERSION = ")(\d+\.\d+\.\d+)(")/,
  },
  {
    path: "apps/editor-wasm/engine/Cargo.toml",
    // Paketets version står först i filen, före [dependencies].
    pattern: /(^version = ")(\d+\.\d+\.\d+)(")/m,
  },
  {
    path: "apps/editor-wasm/engine/Cargo.lock",
    pattern: /(name = "fred-engine"\nversion = ")(\d+\.\d+\.\d+)(")/,
  },
  {
    path: "apps/editor-windows/FredEditor.csproj",
    pattern: /(<Version>)(\d+\.\d+\.\d+)(<\/Version>)/,
  },
  {
    path: "README.md",
    pattern: /(\*\*Version )(\d+\.\d+\.\d+)(\*\*)/,
  },
  {
    path: "README.md",
    pattern: /(^Version )(\d+\.\d+\.\d+)( täcker)/m,
  },
];

let failures = 0;
for (const t of TARGETS) {
  const file = join(root, t.path);
  if (!existsSync(file)) { console.error(`SAKNAS  ${t.path}`); failures++; continue; }
  const text = readFileSync(file, "utf8");
  const m = text.match(t.pattern);
  if (!m) { console.error(`MISSAR  ${t.path}: mönstret hittades inte`); failures++; continue; }
  if (checkOnly) {
    if (m[2] !== current) { console.error(`OSYNK   ${t.path}: ${m[2]} (förväntade ${current})`); failures++; }
    else console.log(`ok      ${t.path}: ${m[2]}`);
  } else {
    writeFileSync(file, text.replace(t.pattern, `$1${version}$3`));
    console.log(`ok      ${t.path}: ${m[2]} -> ${version}`);
  }
}

if (failures) process.exit(1);
if (checkOnly) {
  console.log(`\nAlla versionsangivelser är i synk: ${current}`);
} else {
  console.log(`\nVersion ${current} -> ${version}. Bygg om apparna (npm run build && npm run build:editor-wasm && npm run build:pages) så följer versionen och service worker-cachen med.`);
}
