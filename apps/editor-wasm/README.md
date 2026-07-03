# Fred Editor (WebAssembly)

Omskrivning av Fred Editor där all dokumentlogik körs i en **WebAssembly-motor
skriven i Rust**, med ett gränssnitt som efterliknar Microsoft Word.
Parametrarna redigeras **direkt i löptexten** som Words innehållskontroller –
det finns ingen sidopanel, utan känslan är att man skriver i ett vanligt
Word-dokument.

## Arkitektur

```
apps/editor-wasm/
├── engine/            Rust-crate → fred_engine.wasm (ingen bindgen, rå ABI)
│   └── src/lib.rs     Dokumentmodell, global parametersubstitution,
│                      undo/redo, sök & ersätt, sessionsfiler (JSON in/ut)
├── web/               Skal utan ramverk: index.html + styles.css + app.js
│   └── demo-data.js   Inbyggda demoorganisationer och demomallar
├── scripts/
│   ├── build.mjs      Bygger dist/index.html (WASM inbäddad som base64)
│   └── test-engine.mjs Funktionstester av motorn via Node
└── dist/index.html    Fristående "run-fil" – öppnas direkt från disk, helt offline
```

**Ansvarsfördelning:** JavaScript-skalet ritar bara gränssnittet och skickar
varje redigering som ett JSON-kommando till motorn (`fred_cmd`). Motorn äger
sessionstillståndet: parametervärden, blockstruktur, historik (ångra/gör om),
sök & ersätt samt in-/utläsning av sessionsfiler. Rendermodellen som motorn
returnerar innehåller färdig HTML där `{{parameterId}}` ersatts med
inline-fält (`<span class="fred-cc">`).

## Word-upplevelsen

* Namnlist med Autospara, snabbåtkomst (Spara/Ångra/Gör om) och sökruta.
* Menyflikar: Arkiv (backstage), Start, Infoga, Granska, Visa.
* A4-sida med linjal, Calibri 11 pt som grundstil, rubrikstilar i Word-blått.
* Statusfält med sidräkning, ordantal, språk, **versionsnummer** och
  zoomreglage. Versionen hämtas från Rust-motorn (`ping`-kommandot, som
  läser `engine/Cargo.toml`) och visas även på startskärmen och under
  Arkiv → Info.
* Parametrar är innehållskontroller i texten: tomma fält visar grå
  platshållare, klick gör fältet skrivbart på plats (text/nummer) eller
  öppnar en dropdown (lista/ja–nej/datum). Alla förekomster av samma
  parameter uppdateras medan man skriver (global uppdatering).
* Låsta block kan inte redigeras, men deras parameterfält går att fylla i.
* Fraser (fria block) infogas via Infoga → Fras (snabbdelar).

## Typografi & sidhuvud/sidfot (kravspec V10)

* Mallens `defaultStyle` (typsnitt, storlek i pt, fet/kursiv/understruken)
  appliceras på hela sidan; block och sidhuvud/sidfot-fält kan ha egna
  `style`-definitioner som ersätter standarden attribut för attribut.
  Motorn konverterar stilarna till CSS (`styleCss` i rendermodellen).
* Sidhuvud och sidfot renderas som en **3×3-matris**: varje fält har en
  `position` (kolumn vänster/mitten/höger × rad topp/mitt/botten); fält utan
  position hamnar i vänster/mitt och fält i samma cell staplas i listordning.

## Sparande

* På skrivbordswebbläsare sparas dokument via klassisk nedladdning, med
  bekräftelse-toast.
* På iOS/iPadOS och i inbäddade miljöer (iframe, t.ex. artifact-visning)
  öppnas i stället en **spara-dialog** med tre metoder – *Dela…* (spara till
  appen Filer via delningsarket), *Ladda ner* och *Kopiera text* – där varje
  metod ger synlig återkoppling och misslyckanden visas i dialogen i stället
  för att falla tyst.
* Autosparning sker fortlöpande till `localStorage` ("✓ Sparat" i
  statusfältet) och dokumenten kan återupptas från startskärmens
  Senaste-lista.

## Bygga & testa

```bash
rustup target add wasm32-unknown-unknown   # engångssteg
npm run build -w apps/editor-wasm          # → dist/index.html
npm run test  -w apps/editor-wasm          # motortester i Node
```

Under utveckling kan `web/index.html` serveras direkt (t.ex.
`python3 -m http.server`) – då läses WASM-filen från `engine/target/…`.

## Distribution

Bygget skapar två artefakter i `dist/`:

* **`fred-editor.zip`** – rekommenderat format att skicka via e-post.
  Innehåller `index.html` + `LASMIG.txt` i mappen `fred-editor/`.
* **`index.html`** – själva enfilsappen, för direkt användning.

**Skicka inte den råa HTML-filen som e-postbilaga.** En HTML-fil med inbäddad
WebAssembly-binär liknar tekniken "HTML smuggling" som skadlig kod använder,
och virusskannrar (t.ex. Gmails) kan därför falskflagga den. Bygget minimerar
signaturmönstren (WASM-datan ligger i ett icke-exekverbart `<template>`-element
och läses in som en vanlig resurs), men heuristiken går inte att styra helt.

Om zip-filen ändå flaggas: dela via länk i stället – t.ex. GitHub-repot,
Google Drive, OneDrive eller ett internt nätverksdelat utrymme. Länkar
genomgår inte bilageskanning.

## Filformat

Samma JSON-format som övriga Fred: mallfiler (`fred-mall`),
organisationsfiler (`fred-organisationer`), sessionsfiler (`fred-session`)
och importfiler (`{ organisationId?, values }`). Filer skapade i
Fred Konfiguratör kan läsas in via startskärmen eller Arkiv → Öppna.

## Start från extern applikation

`index.html?mall=<mall-id>&org=<organisations-id>&data=<URL-kodad JSON med parametervärden>`
öppnar editorn direkt med angiven mall och förifyllda värden
(kravspecifikationen avsnitt 4).
