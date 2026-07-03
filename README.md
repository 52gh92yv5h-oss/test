# Fred (Fras-EDitor)

Fred är ett fristående, helt offline ordbehandlingssystem baserat på lokala
JSON-konfigurationer. **Version 1.0.0** (visas i respektive apps gränssnitt).

Systemet består av tre appvarianter:

- **Fred Editor** (`apps/editor`) – React-app för slutanvändare som skapar
  och redigerar dokument utifrån en mall.
- **Fred Konfigurator** (`apps/configurator`) – React-app för administratörer
  som bygger och underhåller mallbiblioteket, med live-förhandsgranskning av
  sidhuvud/sidfot.
- **Fred Editor WASM** (`apps/editor-wasm`) – alternativ editor med
  Word-liknande gränssnitt där all dokumentlogik körs i en
  WebAssembly-motor skriven i Rust. Se `apps/editor-wasm/README.md`.

Gemensam domänmodell, JSON-filhantering, typografi-hjälpare och
UI-återkoppling (toast/spara-dialog) ligger i `packages/shared` och delas av
React-apparna. WASM-motorn speglar samma datamodell i Rust.

Se `kravspecifikation.md` för den fullständiga kravspecifikationen (V10).

## Arkitektur

- React + TypeScript, byggt med Vite (editor + konfigurator).
- Rust → `wasm32-unknown-unknown` + ramverksfri JavaScript (editor-wasm).
- Ingen server, ingen databas, inga externa nätverksanrop. All data läses
  och sparas som lokala JSON-filer.
- Varje app byggs till en enda fristående `dist/index.html` som kan köras
  direkt från en lokal katalog, även med `file://`, utan installation.

## Funktioner i korthet

- **Mallstyrda dokument**: låsta/redigerbara block, fasta/fria block
  (fraser), flernivåparametrar med global uppdatering.
- **Typografi per mall** (kravspec 6.0): typsnitt, storlek (pt) och stil
  (fet/kursiv/understruken) på tre nivåer – mallstandard, per block och per
  sidhuvud/sidfot-fält, med arv nivå för nivå.
- **Sidhuvud/sidfot i 3×3-matris**: varje fält positioneras
  vänster/mitten/höger × topp/mitt/botten. Konfiguratorn visar en
  live-förhandsgranskning av resultatet.
- **Sparande med återkoppling**: på Chromium desktop används File System
  Access API, i övriga skrivbordsmiljöer klassisk nedladdning – båda med
  bekräftelse-toast. På iPad/iPhone och i inbäddade miljöer (t.ex.
  artifact-visning i iframe) öppnas i stället en spara-dialog där användaren
  väljer **Dela… / Ladda ner / Kopiera text** och varje metod ger synlig
  återkoppling i stället för att misslyckas tyst.
- **Utskrift/PDF** via webbläsarens utskriftsdialog, med bevarad typografi
  och fältpositionering.
- **Extern integration** (kravspec avsnitt 4): `?launch=`-parameter
  (React-editorn) respektive `?mall=&org=&data=` (WASM-editorn).

## Utveckling

```bash
npm install

npm run dev:editor         # Fred Editor på http://localhost:5173
npm run dev:configurator   # Fred Konfigurator på annan port

npm run typecheck          # typkontroll av alla TS-paket
npm run build              # bygger båda React-apparna till apps/*/dist/index.html

# WASM-editorn (engångssteg: rustup target add wasm32-unknown-unknown)
npm run build:editor-wasm  # → apps/editor-wasm/dist/index.html + fred-editor.zip
npm run test:editor-wasm   # motortester i Node
```

## Mallbibliotek

`templates/swedish-government/` innehåller 11 exempelmallar för svenska
myndigheter (inkl. en heltäckande exempel-mall som demonstrerar samtliga
konstruktioner), en organisationsfil och en mallhierarki. Se katalogens
README för detaljer.

Logotyperna i organisationsfilen är för närvarande platshållare.
`scripts/fetch-logos.mjs` hämtar riktiga myndighetslogotyper från Wikimedia
Commons och bäddar in dem – kräver nätverksåtkomst till `wikimedia.org`:

```bash
node scripts/fetch-logos.mjs
```

## Status

Version 1.0.0 täcker kravspecifikationens kärnflöden (V10):

- Konfiguratorn: organisationer, mallhierarki, mallar med sidhuvud/sidfot
  (3×3-positionering + live-förhandsgranskning), typografi på tre nivåer,
  flernivåparametrar, låsta/redigerbara samt fasta/fria block.
- Editorn: mallval via hierarki, JSON-import, global parameteruppdatering,
  frasinfogning, ångra/gör om, autosparning, sök/ersätt, spara/öppna
  dokument med tydlig återkoppling, utskrift/PDF.
- WASM-editorn: samma funktionalitet i Word-liknande utförande med
  Rust-motor; versionsnummer hämtas från motorn och visas på startskärmen,
  i statusfältet och under Arkiv → Info.

Ej implementerat ännu: fullständig sidhuvud/sidfot-repetition per utskriven
sida (renderas en gång per dokument) samt paketering som native
installationsprogram utöver den enskilda `dist/index.html`-filen per app.
