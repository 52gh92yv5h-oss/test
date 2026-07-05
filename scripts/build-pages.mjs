// Sätter ihop pages/ – innehållet som GitHub Pages serverar och som gör
// Fred Editor och Fred Konfiguratör installerbara som PWA:er på iPad
// (hemskärmsikon, fullskärm, offline via service worker).
//
// Förutsätter att apparna redan är byggda:
//   node apps/editor-wasm/scripts/build.mjs
//   npm run build:configurator
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "scripts/pages-src");
const out = join(root, "pages");

// Central versionshantering: versionen läses från rot-package.json (bumpas
// med scripts/bump-version.mjs) och används i service worker-cachenamnet så
// att installerade PWA:er hämtar om appen vid varje release. Kontrollera
// först att alla versionsangivelser i repot är i synk.
execFileSync(process.execPath, [join(root, "scripts/bump-version.mjs"), "--check"], { stdio: "inherit" });
const VERSION = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

const APPS = [
  {
    dir: "editor",
    html: join(root, "apps/editor-wasm/dist/index.html"),
    name: "Fred Editor",
    shortName: "Fred",
    themeColor: "#185ABD",
    backgroundColor: "#e4e6e9",
  },
  {
    dir: "redigerare",
    html: join(root, "apps/editor/dist/index.html"),
    name: "Fred Editor (klassisk)",
    shortName: "Fred klassisk",
    themeColor: "#2f5d9f",
    backgroundColor: "#eef0f3",
  },
  {
    dir: "konfigurator",
    html: join(root, "apps/configurator/dist/index.html"),
    name: "Fred Konfiguratör",
    shortName: "Fred Konfig",
    themeColor: "#2f5d9f",
    backgroundColor: "#f4f5f7",
  },
];

const serviceWorker = (cacheName) => `// Offline-stöd: cachar appen vid installation och svarar från cachen.
const CACHE = "${cacheName}";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // ignoreSearch: appstart med ?mall=…&data=… ska träffa cachad index.html.
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
`;

for (const app of APPS) {
  const dir = join(out, app.dir);
  mkdirSync(dir, { recursive: true });

  let html = readFileSync(app.html, "utf8");
  const pwaTags = `
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${app.shortName}">
<meta name="theme-color" content="${app.themeColor}">
<script>
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
</script>
</head>`;
  if (!html.includes("</head>")) throw new Error(`${app.html}: hittar ingen </head>`);
  html = html.replace("</head>", pwaTags);
  writeFileSync(join(dir, "index.html"), html);

  writeFileSync(
    join(dir, "manifest.webmanifest"),
    JSON.stringify(
      {
        name: app.name,
        short_name: app.shortName,
        start_url: "./index.html",
        scope: "./",
        display: "standalone",
        background_color: app.backgroundColor,
        theme_color: app.themeColor,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      null,
      2
    )
  );

  // Cache-namnet följer appversionen: varje versionsbump ger ett nytt namn,
  // och redan installerade PWA:er hämtar om appen när nya service workern
  // aktiveras – ingen manuell cachebump behövs.
  writeFileSync(join(dir, "sw.js"), serviceWorker(`fred-${app.dir}-v${VERSION}`));

  for (const size of [180, 192, 512]) {
    copyFileSync(join(src, "icons", `${app.icons ?? app.dir}-${size}.png`), join(dir, `icon-${size}.png`));
  }
}

copyFileSync(join(src, "landing.html"), join(out, "index.html"));
// Utan .nojekyll kan Jekyll-processningen på Pages ställa till det.
writeFileSync(join(out, ".nojekyll"), "");
console.log(`Klar: ${out}/ (startsida + ${APPS.map((a) => a.dir).join(" + ")})`);
