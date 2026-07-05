# Fred (Fras-EDitor)

Fred är ett fristående, helt offline ordbehandlingssystem baserat på lokala
JSON-konfigurationer. **Version 1.4.0** (visas i respektive apps gränssnitt).

Se `kravspecifikation.md` för den fullständiga kravspecifikationen (V13).

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
- **Villkor mellan block (V13, 1.4.0)**: ett block kan förses med ett
  synlighetsvillkor (parameter + värde, `visibleWhen`) och visas då bara
  när villkoret är uppfyllt — döljs/visas dynamiskt när parametervärdet
  ändras, i båda editorvarianterna och i konfiguratorns dokumentvy.
  Villkorade fraser kan inte infogas förrän villkoret är uppfyllt.
  Villkoret sätts per block i konfiguratorns malleditor ("Visas endast
  när"). Exempel i den omfattande exempel-mallen: *Familjesituation* visas
  bara när "Har barn/familj?" = Ja och *Bekräftelse* bara när "Godkänner
  villkoren?" = Ja.
- **En enhetlig konfigurationsfil (V12)**: organisationer, mallhierarki och
  samtliga mallar ligger i **en** JSON-fil (markör `fred-konfiguration`).
  Konfiguratorn har gemensamma åtgärder *Ny/Öppna/Spara konfigurationsfil*
  och kan hantera flera mallar i samma arbetsyta; båda editorvarianterna
  (React och WASM) läser in hela biblioteket med en enda "Öppna
  konfigurationsfil"-knapp. De gamla separata filerna
  (`organisationer.json`, `hierarki.json`, `mall-*.json`) finns inte
  längre.
- **Fördefinierad mallbunt (V12)**: knappen *"+ Sveriges myndighetsmallar"*
  i konfiguratorn slår ihop de inbakade svenska myndighetsmallarna
  (7 organisationer, 11 mallar, hierarki) med arbetsytan — helt offline,
  innehållet inlinas i den sparade filen.
- **Delad localStorage-brygga (V12)**: konfiguratorns ändringar speglas
  automatiskt (debounce ~0,8 s) till nyckeln `fred-shared-config` i
  webbläsarens localStorage, och editorn läser in den vid start. Fungerar
  bara när båda apparna körs från **samma webbursprung** (t.ex. Pages-
  deploymentens `/redigerare/` + `/konfigurator/`) — inte mellan separata
  artifact-URL:er eller i Windows-appen. Filexport/-import fungerar alltid,
  oavsett ursprung.
- **Parameterinmatning — valbart läge (V11)**: användaren väljer om
  parametrar anges **inline i dokumentet** (klicka på fältet/chipen) eller i
  en **panel**; panelens sida (vänster/höger) är valbar och i inline-läge
  kan panelen döljas. Valet sparas lokalt (localStorage). I React-editorn
  finns kontrollerna i verktygsfältet, i WASM-editorn under fliken **Visa**.
  Sedan 1.2.0 har båda editorvarianterna samma standardläge: inline med
  dold panel.
- **Enhetlig startskärm (1.2.0)**: klassiska (React-)editorn har samma
  startskärm som WASM-editorn — hälsning, kategorichips som filtrerar
  mallbiblioteket, mallkort med dokument-miniatyr, *Senaste* (autosparade
  dokument) och *Öppna filer*. Klick på ett mallkort startar dokumentet
  direkt; om flera organisationer är behöriga visas organisationsvalet i
  en dialog, precis som i WASM-editorn.
- **Inbyggd standardmall (V11)**: affärsbrevet "Affärsbrev – Exempelbolaget"
  från det fiktiva företaget **Exempelbolaget AB** (egendesignad logotyp,
  CC0) är inbyggd i alla editorvarianter och fungerar direkt utan att några
  filer läses in. Även som filer i `templates/standard/`.
- **Typografi per mall** (V9): typsnitt, storlek (pt), fet/kursiv/understruken
  på tre nivåer — mallstandard, per block, per sidhuvud/sidfot-fält, med arv.
- **Sidhuvud/sidfot i 3×3-matris** (V9) med live-förhandsgranskning i
  konfiguratorn (V10).
- **Visuell dokumentvy i konfiguratorn (1.3.0)**: fliken *Dokumentvy (test)*
  visar den valda mallen WYSIWYG som färdigt dokument — samma rendering som
  editorn (A4-sida, sidhuvud/sidfot, block, typografi, parameterchips) — och
  låter administratören testa den direkt: fylla i parametrar (nästlade
  villkor följs), skriva i redigerbara block och infoga/ta bort fraser.
  Testet påverkar inte mallen och kan återställas; vyn uppdateras live när
  mallen ändras.
- **Sparande med återkoppling** (V10): tyst sparande + toast där det är
  pålitligt; spara-dialog med *Dela / Ladda ner / Kopiera text* på
  iOS/iPadOS och i inbäddade miljöer.
- **Utskrift/PDF** via webbläsarens utskriftsdialog.
- **Appikoner** (1.1.0): varje app har en egen ikon med SVG-designoriginal i
  `apps/*/public/icon.svg`. Favicon är inbakad som data-URL i respektive
  HTML (syns även i nedladdad enfils-app), PWA:erna får PNG-ikoner via
  manifestet och Windows-exe:n har ikonen inbäddad (`icon.ico`).
  Rasterversionerna fylls ut kant-till-kant med ikonens primärfärg (1.2.0;
  ingen vit kant på hemskärm/skrivbord) och regenereras med `npm run icons`.

## Versionshantering

Versionen hanteras centralt: rot-`package.json` är källan och
`scripts/bump-version.mjs` speglar den till alla ställen där den
förekommer (`FRED_VERSION` i shared, workspace-`package.json`,
`engine/Cargo.toml`+`Cargo.lock`, `FredEditor.csproj`, README).

```bash
npm run bump          # patch: 1.2.3 -> 1.2.4
npm run bump:minor    # 1.2.3 -> 1.3.0
npm run bump:major    # 1.2.3 -> 2.0.0
npm run version:check # verifierar att allt är i synk (körs även i CI)
```

Automatiken i övrigt: `npm run build:pages` vägrar bygga om
versionsangivelserna är osynkade, och service worker-cachenamnet härleds
ur versionen — varje bump gör alltså automatiskt att installerade PWA:er
hämtar om appen vid nästa start. Efter en bump: bygg om apparna
(`npm run build && npm run build:editor-wasm && npm run build:pages`).

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

Varje bunt är **en** konfigurationsfil (`config.json`) i det enhetliga
formatet (marker `fred-konfiguration`, se kravspec avsnitt 6.1):

- `templates/standard/config.json` — Exempelbolaget AB + affärsbrevet
  (samma mall som är inbyggd i editorerna; `apps/editor/src/builtin.ts`
  genereras från denna fil).
- `templates/swedish-government/config.json` — 7 svenska myndigheter med
  riktiga logotyper, mallhierarki och 11 exempelmallar
  (`apps/configurator/src/predefinedBundle.ts` genereras från denna fil).
  Se katalogens README.

Regenerera de inbakade TS-konstanterna efter ändringar i buntarna med
`node scripts/generate-config-bundles.mjs`.

## Logotyper: källor och licenser

Myndighetslogotyperna är hämtade med `scripts/fetch-logos.mjs`
(`NODE_USE_ENV_PROXY=1 node scripts/fetch-logos.mjs` bakom utgående proxy)
och inbäddade i `templates/swedish-government/config.json`. Källa
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

Version 1.4.0 täcker kravspecifikationens kärnflöden (V13). Ej
implementerat ännu: fullständig sidhuvud/sidfot-repetition per utskriven
sida (renderas en gång per dokument) samt installationsprogram utöver
enfils-`index.html`/Windows-exen.
