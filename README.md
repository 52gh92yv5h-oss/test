# Fred (Fras-EDitor)

Fred är ett fristående, helt offline ordbehandlingssystem baserat på lokala
JSON-konfigurationer. Systemet består av två separata webbappar:

- **Fred Editor** (`apps/editor`) – för slutanvändare som skapar och
  redigerar dokument utifrån en mall.
- **Fred Konfigurator** (`apps/configurator`) – för administratörer som
  bygger och underhåller mallbiblioteket.

Gemensam domänmodell, JSON-filhantering och parametersubstitution ligger i
`packages/shared` och delas av båda apparna.

Se `kravspecifikation.md` för den fullständiga kravspecifikationen (V8).

## Arkitektur

- React + TypeScript, byggt med Vite.
- Ingen server, ingen databas, inga externa nätverksanrop. All data läses
  och sparas som lokala JSON-filer (via File System Access API, med
  fallback till klassisk nedladdning/filuppladdning i äldre webbläsare).
- Varje app byggs till en enda fristående `dist/index.html` (via
  `vite-plugin-singlefile`) som kan köras direkt från en lokal katalog,
  även med `file://`, utan installation eller webbserver.

## Utveckling

```bash
npm install

npm run dev:editor         # startar Fred Editor på http://localhost:5173
npm run dev:configurator   # startar Fred Konfigurator på en annan port

npm run typecheck          # typkontroll av alla paket
npm run build               # bygger båda apparna till apps/*/dist/index.html
```

## Status

Detta är en första fungerande version (MVP) som täcker kravspecifikationens
kärnflöden:

- Konfiguratör: organisationer, mallhierarki, mallar med sidhuvud/sidfot,
  flernivåparametrar, låsta/redigerbara block samt fasta/fria block (fraser).
- Editor: mallval via hierarki, JSON-import av parametervärden, global
  parameteruppdatering, infogning av fraser, ångra/gör om, autosparning,
  sök/ersätt, spara/öppna dokument som lokal fil, samt utskrift/PDF-export
  via webbläsarens skriv ut-dialog.
- Extern integration (avsnitt 4) stöds via en `?launch=`-parameter med
  base64-kodad JSON (mall-id, organisation och initiala parametervärden).

Ej implementerat ännu: fullständig sidhuvud/sidfot-repetition per utskriven
sida (headern/footern renderas en gång per dokument i denna version) samt
paketering som native installationsprogram utöver den enskilda
`dist/index.html`-filen per app.
