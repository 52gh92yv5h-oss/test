# Svenska myndighetsdokumentmallar

Denna katalog innehåller **en enhetlig konfigurationsfil**, `config.json`, med ett mallbibliotek av svensk myndighetstyp: mallhierarkin, 11 mallar — 10 myndighetsmallar plus en omfattande exempel-mall — samt den **fiktiva** utfärdande myndigheten *Myndigheten för överklagande av dåligt väder* (med egendesignad logotyp, CC0). Mallarna är inspirerade av vanliga dokumenttyper hos svenska myndigheter, men ingen riktig myndighet förekommer i biblioteket. Filen följer Fred-systemets konfigurationsformat (markör `fred-konfiguration`, kravspecifikation V13 avsnitt 6.1).

Samma innehåll är även inbakat i Fred Konfigurator som den fördefinierade mallbunten bakom knappen *"+ Sveriges myndighetsmallar"* (`apps/configurator/src/predefinedBundle.ts`, genererad med `node scripts/generate-config-bundles.mjs`).

## Exempel-mall (För demonstation av alla möjligheter)

### **EXEMPEL: Omfattande mall - Alla konstruktioner**
- **Mall-ID:** `mall-comprehensive-example`
- **Användning:** Demonstrerar ALLA möjliga konstruktioner i Fred-systemet
- **Innehål:** Denna mall visar exempel på:
  - **Text-parametrar:** Namn, e-post, telefonnummer
  - **Datum-parametrar:** Ansökningsdatum, födelsedatum, startdatum
  - **Nummer-parametrar:** Inkomst (SEK), utgifter (SEK), procentsats
  - **Boolean-parametrar:** Har familj? Studerar? Godkänner villkor?
  - **List-parametrar:** Utbildningsnivå, ansökningsgrund, civilstatus med valalternativ
  - **Nästlade parametrar:** Familjetyp, barnantal, barnåldrar (visas endast när `hasFamily` är true); institution och utbildningsprogram (visas endast när `isStudent` är true)
  - **Villkor mellan block (kravspec V13):** blocket *Familjesituation* visas endast när `hasFamily` = Ja, och blocket *Bekräftelse* endast när `agreeToTerms` = Ja (`visibleWhen` på blocket)
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
- **Mall-ID:** `mall-arb-handlingsplan`
- **Användning:** Handlingsplan för arbetssökande som registreras tillsammans med Arbetsförmedlingen
- **Förlaga (dokumenttyp):** Arbetsförmedlingen
- **Parametrar:** Namn, personnummer, arbetsmarknadsmål, åtgärder, tidplaner

### 2. **Skatteverket - Arbetsgivardeklaration**
- **Mall-ID:** `mall-skatt-agdekl`
- **Användning:** Månatlig rapportering av arbetsgivaravgifter
- **Förlaga (dokumenttyp):** Skatteverket
- **Parametrar:** Organisationsnummer, anställdas uppgifter, löner, arbetsgivaravgifter

### 3. **Försäkringskassan - Läkarintyg för sjukpenning**
- **Mall-ID:** `mall-fk-lakarintyg`
- **Användning:** Medicinsk bedömning för sjukpenning/sjukskrivning
- **Förlaga (dokumenttyp):** Försäkringskassan
- **Parametrar:** Diagnos, sjukskrivningsgrad, perioder, arbetsförmåga, behandlingsplan

### 4. **Försäkringskassan - Föräldrapenning ansökan**
- **Mall-ID:** `mall-fk-foraldrapenning`
- **Användning:** Ansökan för graviditets- och föräldrapenning
- **Förlaga (dokumenttyp):** Försäkringskassan
- **Parametrar:** Ansökares info, barnets info, tidsperiod, typ av föräldrapenning

### 5. **CSN - Studiefinansiering ansökan**
- **Mall-ID:** `mall-csn-studielan`
- **Användning:** Ansökan om statligt studiestöd och studielån
- **Förlaga (dokumenttyp):** Centrala studiestödsnämnden (CSN)
- **Parametrar:** Studentinfo, utbildningsprogram, institution, förvändade kostnader

### 6. **Försäkringskassan - Boendebidrags ansökan**
- **Mall-ID:** `mall-fk-boendebidraget`
- **Användning:** Ansökan för ekonomiskt stöd till boende
- **Förlaga (dokumenttyp):** Försäkringskassan
- **Parametrar:** Ansökares info, bostadsadress, hyra, inkomst, familjemedlemmar

### 7. **Skatteverket - Anmälan om start av näringsverksamhet**
- **Mall-ID:** `mall-skatt-anmalan-naring`
- **Användning:** Registrering av nystartat företag/eget företagande
- **Förlaga (dokumenttyp):** Skatteverket
- **Parametrar:** Företagsnamn, verksamhetstyp, startdatum, omsättning, bankinformation

### 8. **Migrationsverket - Uppehållstillstånds ansökan**
- **Mall-ID:** `mall-migrationsverket-uppehall`
- **Användning:** Ansökan för att få uppehållstillstånd i Sverige
- **Förlaga (dokumenttyp):** Migrationsverket
- **Parametrar:** Personlig info, boendeadress, grund för ansökan, anställningsuppgifter

### 9. **Polismyndigheten - Ansökan om ID-handling**
- **Mall-ID:** `mall-polis-id-handling`
- **Användning:** Ansökan för pass eller nationellt ID-kort
- **Förlaga (dokumenttyp):** Polismyndigheten
- **Parametrar:** Namn, personnummer, typ av handling, giltighet, kontakt

### 10. **Kronofogdemyndigheten - Betalningsplan ansökan**
- **Mall-ID:** `mall-kronofogden-betalningsplan`
- **Användning:** Ansökan för betalningsplan vid skulder
- **Förlaga (dokumenttyp):** Kronofogdemyndigheten
- **Parametrar:** Gäldenärens info, skulduppgifter, ekonomisk situation, betalningsschema

## Filens innehåll

`config.json` innehåller allt i ett:

- **`organisations`**: Den fiktiva myndigheten *Myndigheten för överklagande av dåligt väder* med egendesignad logotyp (inbäddad som data-URL)
- **`hierarchy`**: Hierarkisk kategorisering av mallarna (arbetsmarknad, skatter, försäkringar, utbildning, migration, skulder)
- **`mallar`**: De 11 mallarna ovan

## Struktur enligt Fred-specifikationen

Varje mall följer Fred-systemets datamodell (kravspecifikation V13):

- **Header/Footer**: Organisationslogotyp, organisationsnamn och sidnummer
- **Parametrar**: Multi-nivå parametrar som kan vara text, datum, nummer, boolean eller listor
- **Innehållsblock**: Låsta (informativa) och redigerbara block som slutanvändaren kan modifiera
- **Fria block (fraser)**: Block som kan infogas fritt av slutanvändaren under arbetet
- **Organisationsomfattning**: Myndighetsmallarna är kopplade till den fiktiva myndigheten; exempel-mallen gäller alla organisationer

## Logotyp

Den fiktiva myndighetens logotyp — ett paraply med paragraftecken, regn
och blixt — är egendesignad för Fred (CC0) och lagras som en inbäddad
SVG-data-URL i `config.json` (`logoDataUrl`), med källa och licens i
fälten `logoSource`/`logoLicense`. Den renderas i dokumentens sidhuvuden
i Fred Editor, i konfiguratorns förhandsgranskning och vid PDF-export.

Biblioteket innehåller inga riktiga myndigheter eller
tredjepartsvarumärken. (Tidigare versioner använde riktiga logotyper
från Wikimedia; de är borttagna tillsammans med hämtskriptet.)

## Använda filformatet

Filen använder Fred-systemets enhetliga konfigurationsformat:

```json
{
  "marker": "fred-konfiguration",
  "version": 1,
  "organisations": [ ... ],
  "hierarchy": { ... },
  "mallar": [ ... ]
}
```

Detta gör att filen direkt kan öppnas i både Fred Konfigurator och Fred
Editor ("Öppna konfigurationsfil").

## Anpassning

För att anpassa mallarna:

1. Öppna `config.json` i Fred Konfigurator ("Öppna konfigurationsfil") —
   eller klicka *"+ Sveriges myndighetsmallar"* för att hämta samma
   innehåll ur den inbakade bunten
2. Välj mall i mallistan och modifiera parametrar, innehållsblock och
   sidhuvud/sidfot efter behov
3. Spara konfigurationsfilen

## Användning i Fred Editor

1. Öppna konfigurationsfilen i Fred Editor ("Öppna konfigurationsfil") —
   eller låt editorn läsa in den automatiskt via den delade lokala
   lagringen om Konfiguratorn körs från samma webbursprung
2. I Fred Editor kan användaren sedan:
   - Välja en mall baserad på myndighetshierarkin
   - Fylla i parametervärden
   - Redigera innehållet i redigerbara block
   - Infoga fria block (fraser) efter behov
   - Exportera som PDF eller spara dokumentet lokalt

---

## Detaljerad beskrivning av den omfattande exempel-mallen

### Syfte
Mallen `mall-comprehensive-example` är inte en verklig myndighetsmall utan en **referensmall för utvecklare och administratörer** som visar alla möjligheter i Fred-systemet.

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
4. **Familjesituation** (Låst block med parametrar, **villkorat**: visas endast när `hasFamily` = Ja) - Familjeuppgifter (nästlade)
5. **Ekonomisk situation** (Redigerbart block) - Inkomst, utgifter + fri text
6. **Grund för ansökan** (Redigerbart block) - Ansökningsgrund + fri text
7. **Bifogade dokument** (Fritt block/Phrase) - Kan infogas flera gånger
8. **Ytterligare information** (Fritt block/Phrase) - Kan infogas flera gånger
9. **Bekräftelse** (Låst block, **villkorat**: visas endast när `agreeToTerms` = Ja) - Slutlig bekräftelse med namn och datum

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
