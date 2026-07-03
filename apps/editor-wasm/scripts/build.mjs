// Bygger Fred Editor till en fristående HTML-fil (dist/index.html) och ett
// distributionspaket (dist/fred-editor.zip). WASM-motorn bäddas in som base64
// i ett <template>-element så att filen kan köras direkt från disk, helt
// offline, utan webbserver eller installation.
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("Kompilerar Rust-motorn till WebAssembly …");
execSync("cargo build --release --target wasm32-unknown-unknown", {
  cwd: join(root, "engine"),
  stdio: "inherit",
});

const wasm = readFileSync(join(root, "engine/target/wasm32-unknown-unknown/release/fred_engine.wasm"));
const wasmB64 = wasm.toString("base64");

let html = readFileSync(join(root, "web/index.html"), "utf8");

// Bädda in CSS.
html = html.replace(/<link rel="stylesheet" href="styles\.css" data-inline>/, () => {
  return "<style>\n" + readFileSync(join(root, "web/styles.css"), "utf8") + "\n</style>";
});

// Bädda in skript.
for (const name of ["demo-data.js", "app.js"]) {
  html = html.replace(new RegExp(`<script src="${name}" data-inline></script>`), () => {
    return "<script>\n" + readFileSync(join(root, "web", name), "utf8") + "\n</script>";
  });
}

// Bädda in WASM-modulen som data i template-elementet.
html = html.replace("<!--__WASM__-->", () => wasmB64);

mkdirSync(join(root, "dist"), { recursive: true });
const out = join(root, "dist/index.html");
writeFileSync(out, html);
console.log(`Klar: ${out} (${(html.length / 1024).toFixed(0)} kB, varav WASM ${(wasmB64.length / 1024).toFixed(0)} kB)`);

// Distributionspaket: zip med appen och en kort instruktion. Zip är det
// rekommenderade formatet att skicka via e-post (en rå HTML-bilaga flaggas
// lätt av virusskannrar eftersom inbäddad WASM liknar "HTML smuggling").
const readme = [
  "Fred Editor",
  "===========",
  "",
  "1. Packa upp zip-filen till valfri mapp.",
  "2. Dubbelklicka på index.html sa oppnas Fred Editor i din webblasare.",
  "",
  "Ingen installation eller internetanslutning kravs - allt kors lokalt",
  "pa din dator. Dokument sparas som .json-filer via Arkiv > Spara.",
  "",
].join("\r\n");
writeFileSync(join(root, "dist/LASMIG.txt"), readme);

const zipScript = `
import zipfile, sys
out, html, readme = sys.argv[1:4]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(html, "fred-editor/index.html")
    z.write(readme, "fred-editor/LASMIG.txt")
`;
const zipPath = join(root, "dist/fred-editor.zip");
execFileSync("python3", ["-c", zipScript, zipPath, out, join(root, "dist/LASMIG.txt")]);
console.log(`Klar: ${zipPath}`);
