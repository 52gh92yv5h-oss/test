# Svenska myndighetsdokumentmallar

Detta katalog innehåller 10 dokumentmallar för Fred-systemet, baserade på vanliga dokumenttyper från svenska myndigheter.

## Exempel-mall (För demonstation av alla möjligheter)

### **EXEMPEL: Omfattande mall - Alla konstruktioner**
- **Fil:** `template-example-comprehensive.json`
- **Användning:** Demonstrerar ALLA möjliga konstruktioner i Fred-systemet
- **Innehål:** Denna mall visar exempel på:
  - **Text-parametrar:** Namn, e-post, telefonnummer
  - **Datum-parametrar:** Ansökningsdatum, födelsedatum, startdatum
  - **Nummer-parametrar:** Inkomst (SEK), utgifter (SEK), procentsats
  - **Boolean-parametrar:** Har familj? Studerar? Godkänner villkor?
  - **List-parametrar:** Utbildningsnivå, ansökningsgrund, civilstatus med valalternativ
  - **Nästlade parametrar:** Familjetyp, barnantal, barnåldrar (visas endast när "hasFamily" är true)
  - **Samma parameter på flera ställen:** `applicantName` återanvänds på 3 olika ställen i dokumentet (sidhuvud, bekräftelse, etc.)
  - **Låsta block:** Informativ text som användaren inte kan redigera
  - **Redigerbara block:** Text som slutanvändaren kan modifiera fritt
  - **Fria block (Fraser):** Block som kan infogas fritt av användaren under arbetet
  - **Sidhuvud:** Logotyp, organisationsnamn och custom text ("EXEMPEL-DOKUMENT")
  - **Sidfot:** Sidnummer och utskriftsdatum
  - **Typografi på tre nivåer (kravspec V9):** Mallens `defaultStyle` (Georgia 11 pt) ärvs av alla delar; introduktionsblocket ersätter storleken (12,5 pt), bekräftelseblocket är kursivt och sidhuvudets/sidfotens fält har egna stilar
  - **3×3-positionering (kravspec V9):** Sidhuvudets fält ligger på topp-raden (logotyp vänster, organisationsnamn mitten, dokumenttyp höger) och sidfotens fält på botten-raden (sidnummer vänster, datum höger)

**Denna mall är perfekt att använda som mall för nya dokument då den visar alla möjligheter!**

---

## Mallar för svenska myndigheter

### 1. **Arbetsförmedlingen - Personlig handlingsplan**
- **Fil:** `template-1-arbetsformedlingen-handlingsplan.json`
- **Användning:** Handlingsplan för arbetssökande som registreras tillsammans med Arbetsförmedlingen
- **Myndighet:** Arbetsförmedlingen
- **Parametrar:** Namn, personnummer, arbetsmarknadsmål, åtgärder, tidplaner

### 2. **Skatteverket - Arbetsgivardeklaration**
- **Fil:** `template-2-skatteverket-arbetsgivardeklaration.json`
- **Användning:** Månatlig rapportering av arbetsgivaravgifter
- **Myndighet:** Skatteverket
- **Parametrar:** Organisationsnummer, anställdas uppgifter, löner, arbetsgivaravgifter

### 3. **Försäkringskassan - Läkarintyg för sjukpenning**
- **Fil:** `template-3-forsaksringskassan-lakarintyg.json`
- **Användning:** Medicinsk bedömning för sjukpenning/sjukskrivning
- **Myndighet:** Försäkringskassan
- **Parametrar:** Diagnos, sjukskrivningsgrad, perioder, arbetsförmåga, behandlingsplan

### 4. **Försäkringskassan - Föräldrapenning ansökan**
- **Fil:** `template-4-forsaksringskassan-foraldrapenning.json`
- **Användning:** Ansökan för graviditets- och föräldrapenning
- **Myndighet:** Försäkringskassan
- **Parametrar:** Ansökares info, barnets info, tidsperiod, typ av föräldrapenning

### 5. **CSN - Studiefinansiering ansökan**
- **Fil:** `template-5-csn-studiestod.json`
- **Användning:** Ansökan om statligt studiestöd och studielån
- **Myndighet:** Centrala studiestödsnämnden (CSN)
- **Parametrar:** Studentinfo, utbildningsprogram, institution, förvändade kostnader

### 6. **Försäkringskassan - Boendebidrags ansökan**
- **Fil:** `template-6-forsaksringskassan-boendebidraget.json`
- **Användning:** Ansökan för ekonomiskt stöd till boende
- **Myndighet:** Försäkringskassan
- **Parametrar:** Ansökares info, bostadsadress, hyra, inkomst, familjemedlemmar

### 7. **Skatteverket - Anmälan om start av näringsverksamhet**
- **Fil:** `template-7-skatteverket-naring.json`
- **Användning:** Registrering av nystartat företag/eget företagande
- **Myndighet:** Skatteverket
- **Parametrar:** Företagsnamn, verksamhetstyp, startdatum, omsättning, bankinformation

### 8. **Migrationsverket - Uppehållstillstånds ansökan**
- **Fil:** `template-8-migrationsverket-uppehall.json`
- **Användning:** Ansökan för att få uppehållstillstånd i Sverige
- **Myndighet:** Migrationsverket
- **Parametrar:** Personlig info, boendeadress, grund för ansökan, anställningsuppgifter

### 9. **Polismyndigheten - Ansökan om ID-handling**
- **Fil:** `template-9-polismyndigheten-id.json`
- **Användning:** Ansökan för pass eller nationellt ID-kort
- **Myndighet:** Polismyndigheten
- **Parametrar:** Namn, personnummer, typ av handling, giltighet, kontakt

### 10. **Kronofogdemyndigheten - Betalningsplan ansökan**
- **Fil:** `template-10-kronofogden-betalningsplan.json`
- **Användning:** Ansökan för betalningsplan vid skulder
- **Myndighet:** Kronofogdemyndigheten
- **Parametrar:** Gäldenärens info, skulduppgifter, ekonomisk situation, betalningsschema

## Stödjande filer

- **`organisations.json`**: Definitioner av alla 7 svenska myndigheter med logotyper (base64-kodade SVG-bilder)
- **`hierarchy.json`**: Hierarkisk kategorisering av mallarna (arbetsmarknad, skatter, försäkringar, utbildning, migration, skulder)

## Struktur enligt Fred-specifikationen

Varje mall följer Fred-systemets datamodell (kravspecifikation V8):

- **Header/Footer**: Organisationslogotyp, organisationsnamn och sidnummer
- **Parametrar**: Multi-nivå parametrar som kan vara text, datum, nummer, boolean eller listor
- **Innehållsblock**: Låsta (informativa) och redigerbara block som slutanvändaren kan modifiera
- **Fria block (fraser)**: Block som kan infogas fritt av slutanvändaren under arbetet
- **Organisationsomfattning**: Varje mall är kopplad till en specifik myndighet

## Logotyper

Logotyperna lagras som base64-kodade data-URL:er i `organisations.json` och
renderas i dokumentens sidhuvuden i Fred Editor, i konfiguratorns
förhandsgranskning av sidhuvud/sidfot samt vid PDF-export.

**Nuvarande status: riktiga logotyper.** Organisationsfilen innehåller
respektive myndighets riktiga logotyp, hämtad från Wikimedia. Källan
antecknas per organisation i fältet `logoSource`:

| Myndighet | Källa |
|-----------|-------|
| Arbetsförmedlingen | Commons: `File:Arbetsförmedlingen logo.svg` |
| Skatteverket | en.wikipedia: `File:Skatteverket Logo.svg` |
| Försäkringskassan | Commons: `File:Logo Försäkringskassan.svg` |
| CSN | Commons: `File:Centrala Studiestödsnämnden logo.svg` |
| Migrationsverket | Commons: `File:Logotyp för Migrationsverket.svg` |
| Polismyndigheten | Commons: `File:Polisen vapen.svg` (polisens vapen) |
| Kronofogdemyndigheten | Commons: `File:Logo Kronofogdemyndigheten.svg` |

### Uppdatera logotyperna

Kör hämtskriptet från repots rot i en miljö med nätverksåtkomst till
`*.wikimedia.org`/`*.wikipedia.org`:

```bash
NODE_USE_ENV_PROXY=1 node scripts/fetch-logos.mjs
```

(`NODE_USE_ENV_PROXY=1` behövs bara bakom en utgående proxy, t.ex. i
Claude Code-miljöer — Nodes `fetch` följer annars inte `HTTPS_PROXY`.)

Skriptet hämtar en 400 px PNG-thumb av respektive logotyp, bäddar in den
som data-URL i `organisations.json` och uppdaterar `logoSource`. Ingen mall
behöver ändras — mallarna refererar organisationer via id.

**Varumärkesnot:** Myndighetslogotyperna tillhör respektive myndighet och
används i mallarna endast för att återge korrekt avsändare i dokument som
utfärdas i myndighetens namn.

## Använda filformatet

Alla filer använder standardformatet för Fred-systemet:

```json
{
  "marker": "fred-mall",
  "version": 1,
  "mall": { ... }
}
```

Detta möjliggör att filerna direkt kan importeras in i Fred Konfigurator.

## Anpassning

För att anpassa mallarna:

1. Öppna `template-X-....json` i Fred Konfigurator
2. Lägg till eller modifiera parametrar, innehållsblock och sidhuvud/sidfot efter behov
3. Spara den uppdaterade mallen

## Användning i Fred Editor

1. Ladda organisationsfilen och hierarkin i Fred Konfigurator
2. Importera mallarna
3. I Fred Editor kan användaren sedan:
   - Välja en mall baserad på myndighetshierarkin
   - Fylla i parametervärden
   - Redigera innehållet i redigerbara block
   - Infoga fria block (fraser) efter behov
   - Exportera som PDF eller spara dokumentet lokalt

---

## Detaljerad beskrivning av den omfattande exempel-mallen

### Syfte
`template-example-comprehensive.json` är inte en verklig myndighetsmall utan en **referensmall för utvecklare och administratörer** som visar alla möjligheter i Fred-systemet.

### Parametrar som demonstreras

#### Text-parametrar
- `applicantName`: Personens namn (återanvänds på 3 ställen)
- `applicantEmail`: E-postadress
- `applicantPhone`: Telefonnummer

#### Datum-parametrar
- `applicationDate`: Ansökningsdatum
- `birthDate`: Födelsedatum
- `startDate`: Startdatum

#### Nummer-parametrar
- `income`: Månadsinkomst (SEK)
- `expenses`: Månadskostnader (SEK)
- `percentage`: Procentsats (%)

#### Boolean-parametrar
- `hasFamily`: Har barn/familj? (true/false)
- `isStudent`: Studerar du? (true/false)
- `agreeToTerms`: Godkänner du villkoren? (true/false)

#### List-parametrar (med valalternativ)
- `educationLevel`: Grundskola, Gymnasium, Universitet, Forskargrad
- `applicationReason`: Ekonomisk svårighet, Arbetslös, Sjuk, Familjesjäl
- `maritalStatus`: Ensam, Gift/Sambo, Skild

#### Nästlade parametrar (Conditional)
Dessa visas bara när `hasFamily` eller `isStudent` är true:
- `familyType`: Typ av familj (Barn, Adopterat barn, Styvbarn)
- `numberOfChildren`: Antal barn
- `childrenAges`: Barnens åldrar
- `studentInstitution`: Utbildningsinstitution
- `studyProgram`: Utbildningsprogram

### Innehållsblock

1. **Introduktion** (Låst block) - Informativ text från administratör
2. **Personlig information** (Låst block med parametrar) - Visa personuppgifter
3. **Utbildning** (Låst block med parametrar) - Utbildningsnivå, studiestatus
4. **Familjesituation** (Låst block med parametrar) - Familjeuppgifter (nästlade)
5. **Ekonomisk situation** (Redigerbart block) - Inkomst, utgifter + fri text
6. **Grund för ansökan** (Redigerbart block) - Ansökningsgrund + fri text
7. **Bifogade dokument** (Fritt block/Phrase) - Kan infogas flera gånger
8. **Ytterligare information** (Fritt block/Phrase) - Kan infogas flera gånger
9. **Bekräftelse** (Låst block) - Slutlig bekräftelse med namn och datum

### Sidhuvud och Sidfot

#### Sidhuvud innehåller:
- Organisationslogotyp
- Organisationsnamn
- Custom text: "EXEMPEL-DOKUMENT"

#### Sidfot innehåller:
- Sidnummer (Sida X/Y)
- Utskriftsdatum

### Globala uppdateringar

Parametern `applicantName` demonstrerar **globala uppdateringar** - samma parameter visas på flera ställen:
1. Under "Personlig information"
2. Under "Bekräftelse" (överst)
3. Under "Bekräftelse" (där det säger "Jag bekräftar...")

Om användaren ändrar namnet på ett ställe, uppdateras det automatiskt på alla tre ställen.

### Typografi och 3×3-layout (kravspec V9)

Mallformatet stödjer typsnittsinformation på tre nivåer med arv:

```json
{
  "mall": {
    "defaultStyle": { "fontFamily": "Georgia, 'Times New Roman', serif", "fontSizePt": 11 },
    "blocks": [
      { "id": "block-intro", "style": { "fontSizePt": 12.5 } }
    ],
    "headerFooter": {
      "headerFields": [
        {
          "id": "header-org",
          "kind": "organisation",
          "position": { "col": "center", "row": "top" },
          "style": { "fontSizePt": 14, "bold": true }
        }
      ]
    }
  }
}
```

- **Stildefinition** (`style`/`defaultStyle`): `fontFamily`, `fontSizePt`, `bold`, `italic`, `underline` — alla valfria; utelämnat attribut ärvs (fält/block → mallens standard → systemets grundstil).
- **Position** (`position`): `col` = `left`/`center`/`right`, `row` = `top`/`middle`/`bottom`. Fält utan position hamnar i vänster/mitt-cellen; fält i samma cell staplas i listordning.
- Alla fält är bakåtkompatibla — mallar utan dem fortsätter fungera.
