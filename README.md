# Fred (Fras-EDitor)

Fred är ett fristående, helt offline ordbehandlingssystem baserat på lokala
JSON-konfigurationer. **Version 1.0.0** (visas i respektive apps gränssnitt).

Se `kravspecifikation.md` för den fullständiga kravspecifikationen (V11).

## Appvarianter

| App | Katalog | Teknik | För vem |
|-----|---------|--------|---------|
| **Fred Editor (WASM)** | `apps/editor-wasm` | Rust → WebAssembly + ramverksfri JS, Word-liknande UI | Slutanvändare |
| **Fred Editor (klassisk)** | `apps/editor` | React + TypeScript + Vite | Slutanvändare |
| **Fred Editor för Windows** | `apps/editor-windows` | C#/WPF + WebView2 — tunt native skal runt WASM-editorn | Slutanvändare (Windows) |
| **Fred Konfigurator** | `apps/configurator` | React + TypeScript + Vite | Administratörer |

Gemensam domänmodell, filhantering, typografi och UI-återkoppling ligger i
`packages/shared` (delas av React-apparna). WASM-motorn speglar samma
datamodell i Rust. Windows-appen bäddar in WASM-editorns färdiga
`index.html` via WebView2 och har därmed automatiskt full funktionsparitet.

## Distributionsformer

**Viktigt förtydligande: PWA:n är inte en egen editor-klient.** Innehållet i
`pages/` är exakt samma byggda appar, bara paketerade med manifest och
service worker så att de kan installeras från GitHub Pages på t.ex. en iPad
(hemskärmsikon, fullskärm, offline). Ingen separat kodbas existerar.

| Distributionsform | Innehåll | Kanal |
|---|---|---|
| Enfils-`index.html` per app | `apps/*/dist/index.html` — körs direkt från disk (`file://`) | Repot / `fred-editor.zip` |
| **GitHub Pages (PWA)** | `pages/editor` = WASM-editorn · `pages/redigerare` = React-editorn · `pages/konfigurator` = konfiguratorn — samma byggen + manifest/service worker | Pages-deployment (workflow `pages.yml`) |
| **Windows-exe** | `FredEditor.exe` (C#-skalet, ~156 MB självständig) | GitHub Actions-artifact från workflow `windows-editor.yml` |

`pages/` byggs om med `npm run build:pages` (efter att apparna byggts) och
deployas av `.github/workflows/pages.yml` **vid push till `main`** — merga
branchen (eller kör workflowet manuellt via *Run workflow*) för att
uppdatera Pages-sajten. Windows-exen byggs av `windows-editor.yml`
(windows-runner) och laddas upp som artifact; se
`apps/editor-windows/README.md`.

## Funktioner i korthet

- **Mallstyrda dokument**: låsta/redigerbara block, fasta/fria block
  (fraser), flernivåparametrar med global uppdatering.
- **Parameterinmatning — valbart läge (V11)**: användaren väljer om
  parametrar anges **inline i dokumentet** (klicka på fältet/chipen) eller i
  en **panel**; panelens sida (vänster/höger) är valbar och i inline-läge
  kan panelen döljas. Valet sparas lokalt (localStorage). I React-editorn
  finns kontrollerna i verktygsfältet, i WASM-editorn under fliken **Visa**.
- **Inbyggd standardmall (V11)**: affärsbrevet "Affärsbrev – Exempelbolaget"
  från det fiktiva företaget **Exempelbolaget AB** (egendesignad logotyp,
  CC0) är inbyggd i alla editorvarianter och fungerar direkt utan att några
  filer läses in. Även som filer i `templates/standard/`.
- **Typografi per mall** (V9): typsnitt, storlek (pt), fet/kursiv/understruken
  på tre nivåer — mallstandard, per block, per sidhuvud/sidfot-fält, med arv.
- **Sidhuvud/sidfot i 3×3-matris** (V9) med live-förhandsgranskning i
  konfiguratorn (V10).
- **Sparande med återkoppling** (V10): tyst sparande + toast där det är
  pålitligt; spara-dialog med *Dela / Ladda ner / Kopiera text* på
  iOS/iPadOS och i inbäddade miljöer.
- **Utskrift/PDF** via webbläsarens utskriftsdialog.

## Utveckling

```bash
npm install

npm run dev:editor         # React-editorn på http://localhost:5173
npm run dev:configurator   # konfiguratorn på annan port

npm run typecheck          # typkontroll av alla TS-paket
npm run build              # bygger React-apparna till apps/*/dist/index.html

# WASM-editorn (engångssteg: rustup target add wasm32-unknown-unknown)
npm run build:editor-wasm  # → apps/editor-wasm/dist/index.html + fred-editor.zip
npm run test:editor-wasm   # motortester i Node

npm run build:pages        # paketerar om pages/ (PWA) från färdiga byggen
npm run test:launch        # automatiskt test av kapitel 4 (kräver Playwright)

# Windows-editorn (kräver .NET 8 SDK; korskompilerbar från Linux/macOS)
dotnet publish apps/editor-windows/FredEditor.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true
```

## Testa extern integration (kravspecifikationen kapitel 4)

Kapitel 4 kräver att en extern applikation kan starta editorn med en
specifik mall och förifyllda parametervärden. Så här verifierar du det:

### WASM-editorn — `?mall=&org=&data=`

Öppna den byggda appen med URL-parametrar (demomallen ingår):

```
apps/editor-wasm/dist/index.html?mall=mall-fardtjanst&org=org-nasby&data=%7B%22sokande%22%3A%22Anna%20Andersson%22%7D
```

**Förväntat resultat:** editorn hoppar över startskärmen och öppnar
"Beslut om färdtjänst" med Näsby kommun som avsändare, och alla
förekomster av parametern *Sökandens namn* visar "Anna Andersson".

### React-editorn — `?launch=<base64-kodad JSON>`

Payloaden är JSON `{ "templateId", "organisationId"?, "values"? }`,
base64-kodad. Skapa den t.ex. med:

```bash
node -e 'console.log(Buffer.from(JSON.stringify({
  templateId: "mall-exempelbolaget-brev",
  organisationId: "org-exempelbolaget",
  values: { mottagareNamn: "Kalle Karlsson", arende: "Offertförfrågan" }
})).toString("base64"))'
```

Öppna sedan `apps/editor/dist/index.html?launch=<resultatet>`.

**Förväntat resultat:** eftersom standardmallen är inbyggd autostartar
sessionen direkt: dokumentet öppnas med mottagarnamn och ärende förifyllda
på alla förekomster. För en mall som *inte* är inbyggd väntar starten tills
motsvarande mallfil lästs in på startskärmen — då autostartar sessionen.

### Automatiskt

```bash
npm run build && npm run build:editor-wasm   # om inte redan byggt
npm run test:launch
```

`scripts/test-launch.mjs` kör båda flödena i Chromium via Playwright och
verifierar att mallen öppnas och att initialvärdena infogats.

## Mallbibliotek

- `templates/standard/` — Exempelbolagets affärsbrev + organisation
  (samma mall som är inbyggd i editorerna).
- `templates/swedish-government/` — 11 exempelmallar för svenska
  myndigheter, organisationsfil med riktiga logotyper och mallhierarki.
  Se katalogens README.

## Logotyper: källor och licenser

Myndighetslogotyperna är hämtade med `scripts/fetch-logos.mjs`
(`NODE_USE_ENV_PROXY=1 node scripts/fetch-logos.mjs` bakom utgående proxy)
och inbäddade i `templates/swedish-government/organisations.json`. Källa
och licens lagras per organisation i fälten `logoSource`/`logoLicense`:

| Logotyp | Källa | Licens |
|---|---|---|
| Arbetsförmedlingen | Wikimedia Commons: `File:Arbetsförmedlingen logo.svg` | Public domain |
| Skatteverket | engelska Wikipedia: `File:Skatteverket Logo.svg` | PD (public domain, textlogotyp) |
| Försäkringskassan | Commons: `File:Logo Försäkringskassan.svg` | Public domain |
| CSN | Commons: `File:Centrala Studiestödsnämnden logo.svg` | Public domain |
| Migrationsverket | Commons: `File:Logotyp för Migrationsverket.svg` | Public domain |
| Polismyndigheten | Commons: `File:Polisen vapen.svg` | **CC BY-SA 2.5** — kräver erkännande; se filsidan på Commons för upphovsperson |
| Kronofogdemyndigheten | Commons: `File:Logo Kronofogdemyndigheten.svg` | Public domain |
| Exempelbolaget AB | Egendesignad för Fred (fiktivt företag) | CC0 |

Licenser enligt respektive filsidas `LicenseShortName` vid hämtningstillfället —
kontrollera filsidan vid vidare användning. **Varumärkesnot:** myndighets-
logotyperna tillhör respektive myndighet och används i mallarna endast för
att återge korrekt avsändare i dokument som utfärdas i myndighetens namn.

## Status

Version 1.0.0 täcker kravspecifikationens kärnflöden (V11). Ej
implementerat ännu: fullständig sidhuvud/sidfot-repetition per utskriven
sida (renderas en gång per dokument) samt installationsprogram utöver
enfils-`index.html`/Windows-exen.
