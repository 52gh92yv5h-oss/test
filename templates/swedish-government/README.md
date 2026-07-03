# Svenska myndighetsdokumentmallar

Detta katalog innehåller 10 dokumentmallar för Fred-systemet, baserade på vanliga dokumenttyper från svenska myndigheter.

## Mallar

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

Logotyperna är skapade som SVG-illustrationer och lagras som base64-kodade data-URLs i organisationsfilen. Varje myndighet har en unik färg:

- **Arbetsförmedlingen**: Mörkblå (#003399)
- **Skatteverket**: Röd (#B22234)
- **Försäkringskassan**: Grön (#00A86B)
- **CSN**: Orange (#FF6B35)
- **Migrationsverket**: Mörkviolett (#4B0082)
- **Polismyndigheten**: Mörkblå (#003366)
- **Kronofogdemyndigheten**: Svart (#1C1C1C)

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
3. I Fred Editor kan användare sedan:
   - Välja en mall baserad på myndighetshierarkin
   - Fylla i parametervärden
   - Redigera innehållet i redigerbara block
   - Infoga fria block (fraser) efter behov
   - Exportera som PDF eller spara dokumentet lokalt
