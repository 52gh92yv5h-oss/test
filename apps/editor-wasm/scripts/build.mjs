// Bygger Fred Editor till en enda fristående HTML-fil (dist/index.html).
// WASM-motorn bäddas in som base64 så att filen kan köras direkt från disk,
// helt offline, utan webbserver eller installation.
import { execSync } from "node:child_process";
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

// Bädda in WASM-modulen.
html = html.replace("/*__WASM__*/", () => `window.FRED_WASM_BASE64 = "${wasmB64}";`);

mkdirSync(join(root, "dist"), { recursive: true });
const out = join(root, "dist/index.html");
writeFileSync(out, html);
console.log(`Klar: ${out} (${(html.length / 1024).toFixed(0)} kB, varav WASM ${(wasmB64.length / 1024).toFixed(0)} kB)`);
