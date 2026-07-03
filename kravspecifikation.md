# Kravspecifikation: Fred (Fras-EDitor) (V10)

Detta dokument sammanställer kraven för utvecklingen av Fred (Fras-EDitor) – ett fristående, helt isolerat ordbehandlingssystem baserat på lokala JSON-konfigurationer. Systemet ska köras i en webbläsarmiljö och består av två separata applikationer: en Editor för slutanvändare och en Konfiguratör för administratörer.

## 1. Övergripande syfte & Arkitektur

* **Exekvering i webbläsare:** Fred ska köras och fungera i en webbläsare.
* **Inga externa anrop (Offline):** Fred ska fungera helt offline utan internetanslutning. Inga anrop till externa tjänster eller API:er får göras. Allt ska hanteras helt lokalt på användarens dator.
* **Fristående applikationer:** Fred ska bestå av två separata, fristående appar:
  * **Fred Editor (slutanvändare)** – för att skapa och redigera dokument.
  * **Fred Konfiguratör (administratör)** – för att skapa och underhålla mallar.
* **Lokal filhantering:** Fred ska inte använda någon central databas eller molnsynk. All konfiguration, dataimport och sessionssparande sker via lokala filer.
* **Standardiserat dataformat:** JSON ska användas som format för import, konfiguration och strukturering av mallparametrar.
* **Flera organisationer:** Fred ska ha stöd för flera olika organisationer (vanligtvis runt 2–3 stycken).

---

## 2. Funktionella krav: Fred Editor (Ordbehandlingsprogrammet)

Fred Editor är verktyget där användaren väljer mall, fyller i uppgifter, redigerar text och genererar dokument.

### 2.1 Textredigering & Dokumentstruktur
* **Grundmallar:** Ett dokument måste alltid baseras på en mall. Användaren väljer mall innan dokumentet skapas, och mallen kan inte bytas i efterhand. Fred Editor laddar malldokumentet med en stor mängd fördefinierad text från start.
* **Dokumentstorlek:** Dokumenten är normalt 1–5 sidor långa.
* **Sidhuvud och Sidfot:** Stöd för att producera dokument som har sidhuvud och sidfot. Följande specifika fält ska kunna definieras till sidhuvud och sidfot:
  * En logotyp (kopplad till den organisation som utfärdar dokumentet).
  * Den organisation som har utfärdat dokumentet.
  * Valfri text samt ytterligare textfält definierade av administratören.
* **Sidhuvud/sidfot-layout (3×3-matris):** Varje fält i sidhuvud och sidfot ska kunna placeras i en 3×3-matris: kolumn *vänster/mitten/höger* kombinerat med rad *topp/mitt/botten*. Flera fält kan dela samma cell och staplas då i den ordning de är definierade i mallen. Fält som saknar angiven position placeras i cellen vänster/mitt.
* **Typografi från mallen:** Dokumentets typsnitt, textstorlek och stil (fet, kursiv, understruken) definieras i mallen och tillämpas automatiskt när dokumentet öppnas i Fred Editor. Typografi kan anges som en standard för hela dokumentet samt överstyras per innehållsblock och per sidhuvud/sidfot-fält (se avsnitt 3 och 6).

### 2.2 Dataimport & Parameterstyrning
* **JSON-import:** Fred Editor ska kunna ta emot en lokal importfil i JSON-format innehållandes namn, organisation och andra uppgifter som automatiskt infogas på rätt platser i mallen.
* **Multi-nivå parametrar:** Parametrarna som ges till mallarna ska kunna vara på flera nivåer (nästlade val). Det ska finnas ett system för texterna och hur de ska infogas baserat på dessa val.
* **Global uppdatering:** En parameter anges en gång och uppdateras direkt på alla förekomster globalt i dokumentet när värdet ändras.
* **Parametertyper:** Parametrar ska kunna vara text, datum, numeriska värden, ja/nej samt listor. Ingen strikt validering krävs för inmatning.

### 2.3 Redigeringsfunktioner och Gränssnitt
* **Generell upplevelse:** Fred Editor ska upplevas som en modern ordbehandlare likt Microsoft Word, fast med reducerad funktionalitet.
* **Redigerbara och låsta block:** Dokumentet består av innehållsblock definierade i mallen. Användaren styrs av om blocket är:
  * *Redigerbart:* Användaren kan skriva/redigera text fritt, skapa/ta bort stycken, infoga rubriker, infoga sidbrytningar samt flytta, ändra formatering, lägga till eller ta bort innehåll inom blocket.
  * *Låst:* Användaren kan se innehållet men inte ändra text eller formatering.
* **Infogning av fraser (Fria block):** Användaren ska i gränssnittet fritt kunna välja bland de fördefinierade fria blocken (fraserna) som är kopplade till mallen och infoga dessa i dokumentet under pågående arbete.
* **Inbyggda funktioner:**
  * Undo / Redo
  * Autosparning
  * Sök (Ctrl+F)
  * Sök och ersätt
* **Funktioner som INTE krävs:** Tabeller, bilder (utöver logotyp i sidhuvud/sidfot), bilagor samt dokumentegenskaper utöver innehåll stöds inte.

### 2.4 Export och Sessionshantering
* **Utskrift & PDF-export:** Fred Editor ska kunna skriva ut och spara information i PDF-form. Den exporterade PDF-filen ska motsvara dokumentets visuella innehåll i editorn. Detta inkluderar mallens typografi (typsnitt, storlek, stil) samt sidhuvud/sidfot-fältens positioner i 3×3-matrisen.
* **Spara pågående arbete:** Man ska kunna spara ett ifyllt dokument som en lokal fil och återöppna det för att redigera vidare vid ett annat tillfälle.
* **Återkoppling vid sparande:** Varje spara-åtgärd ska ge synlig återkoppling om utfallet (t.ex. en avisering om att filen sparats, laddats ner eller skickats till delning). I miljöer där webbläsaren inte tillåter tyst filsparning (t.ex. iOS/iPadOS eller när appen körs inbäddad i en annan sida) ska en spara-dialog visas där användaren själv väljer metod – *Dela*, *Ladda ner* eller *Kopiera text* – och där misslyckade metoder redovisas synligt i stället för att falla tyst.

---

## 3. Funktionella krav: Fred Konfiguratör (Administratörsverktyget)

Ett separat verktyg dedikerat till administratörer för att skapa, konfigurera och underhålla mallbiblioteket på enklaste sätt.

* **Fristående konfigurationsapp:** En helt fristående app som administratören använder för att konfigurera mallarna.
* **Malluppbyggnad:** En mall byggs upp av innehållsblock (redigerbara eller låsta), parametrar samt definitioner för sidhuvud/sidfot.
* **Typografistyrning:** Administratören ska kunna ange typsnittsinformation (typsnitt, storlek i punkter samt stil: fet, kursiv, understruken) på tre nivåer:
  * *Mallnivå:* En standardstil (`defaultStyle`) som gäller för hela dokumentet.
  * *Blocknivå:* En valfri stil (`style`) per innehållsblock som ersätter mallens standard för det blocket.
  * *Sidhuvud/sidfot-nivå:* En valfri stil (`style`) per fält i sidhuvud och sidfot.
  * *Arvsregel:* Om ingen stil anges på block- eller fältnivå ärvs mallens standardstil. Om mallen saknar standardstil används systemets grundstil. Varje enskilt stilattribut ärvs separat (t.ex. kan ett block ange endast storlek och ärva typsnittet).
* **Sidhuvud/sidfot-layout:** Administratören ska för varje fält i sidhuvud och sidfot kunna ange en position i 3×3-matrisen (kolumn: vänster/mitten/höger, rad: topp/mitt/botten).
* **Förhandsgranskning av sidhuvud/sidfot:** Konfiguratören ska visa en visuell förhandsgranskning av hur sidhuvud och sidfot kommer att se ut i det färdiga dokumentet – med fältens positioner i 3×3-matrisen, organisationens logotyp och namn samt tillämpad typografi. Förhandsgranskningen ska uppdateras direkt när fält, positioner eller stilar ändras, och administratören ska kunna välja vilken organisation som förhandsgranskningen visar.
* **Enkel JSON-konfiguration:** Formatet på konfigurationen ska vara JSON. Mallarna ska sparas och konfigureras som lokala JSON-filer.
* **Förhandsinnehåll & Ordning:** Administratören bestämmer ordningen på alla fasta block i mallen och kan fylla i fördefinierad text i blocken.
* **Definition av fria block (Fraser):** Administratören ska kunna markera valda block i mallen som "fria" (fraser), vilket innebär dataladdning att de inte har en fast plats från start utan lämnas tillgängliga för slutanvändaren att infoga fritt via Fred Editor.
* **Hantering av parameternivåer:** Administratören ska kunna konfigurera mallarna och parametrarna på several nivåer samt definiera standardvärden.
* **Mallhierarki:** Mallar organiseras i en hierarkisk struktur (t.ex. i kategorier) som enbart används för enkel navigering och val av mall i Fred Editor. Hierarkin påverkar inte dokumentets innehåll. En mall kan endast ligga på en plats i hierarkin.
* **Mallversioner:** Varje mall existerar endast i en version. Tidigare versioner sparas inte som separata mallar i systemet. Om en mall ändras i efterhand krävs dataladdning eller att användaren skapar ett nytt dokument för att ta del av ändringarna.
* **Organisationsstyrning per mall:** I verktyget ska administratören för varje enskild mall kunna ange om mallen ska gälla för en specifik organisation, för vissa utvalda organisationer, eller vara tillgänglig för alla organisationer.
* **Strukturering av mallinnehåll:** Administratören ska kunna dela upp och definiera mallens innehåll i:
  * *Redigerbart innehåll:* Textavsnitt och block som slutanvändaren ska kunna editera eller skriva fritt i.
  * *Fasta fält:* Specifika fält som har fördefinierade värden och val. Dessa ska kunna ges programmatiskt och sparas till filen.

---

## 4. Integration med externa applikationer

* **Start från extern applikation:** Det ska vara möjligt för en extern applikation på datorn att starta igång Fred Editor.
* **Programmatisk initiering:** Vid start från ett externt program ska detta program kunna skicka med parametrar som anger:
  * Vilken specifik mall som ska öppnas.
  * Initiala värden och förvalda värden för mallens parametrar, så att Fred Editor laddas med denna information direkt vid uppstart och sparar ner till den lokala filen.

---

## 5. Installation & Distribution

* **Enkel installation:** Det ska vara enkelt att installera både Fred Editor och Fred Konfiguratör. Ingen serverinstallation krävs.
* **Katalogbaserad körning:** Det ska finnas en installationsfil eller "run-fil" per app, så att man enkelt kan lägga applikationen i en lokal katalog och köra den därifrån.
* **Synligt versionsnummer:** Varje applikation ska visa sitt versionsnummer i gränssnittet (t.ex. på startskärmen och i statusfält/verktygsfält), så att användare och support enkelt kan avgöra vilken version som körs.

---

## 6. Informationsmodell

Det lokala och filbaserade systemets informationsobjekt och dataobjekt definieras enligt följande struktur:

### 6.0 Stildefinition (gemensam struktur)
En återanvändbar struktur för typsnittsinformation som refereras från Mall, Innehållsblock och Sidhuvud/Sidfot-fält. Samtliga attribut är valfria; ett utelämnat attribut ärvs från nivån ovanför (fält/block → mallens standardtypografi → systemets grundstil).
* **Typsnitt** (`fontFamily`, textsträng, t.ex. `"Georgia, 'Times New Roman', serif"`)
* **Storlek** (`fontSizePt`, numeriskt värde i punkter)
* **Fet** (`bold`, ja/nej)
* **Kursiv** (`italic`, ja/nej)
* **Understruken** (`underline`, ja/nej)

*Bakåtkompatibilitet:* Befintliga mallfiler utan stilfält förblir giltiga; avsaknad av stilfält innebär att systemets grundstil används.

### 6.1 Organisation
Informationsobjekt som hanterar Freds organisationer.
* **Organisations-ID** (Unik identifierare)
* **Organisationsnamn** (Textsträng)
* **Logotyp** (Referens/sökväg till lokal bildfil)

### 6.2 Mall (Konfiguration)
Informationsobjekt för de lokala JSON-filer som skapas i Fred Konfiguratör.
* **Mall-ID** (Unik identifierare)
* **Namn & Beskrivning** (Textsträngar)
* **Hierarkiplacering** (Referens till kategori/nod i navigeringsstrukturen)
* **Organisationstillhörighet** (Definition om mallen gäller för en specifik organisation, ett urval eller alla)
* **Standardtypografi** (`defaultStyle`, valfri Stildefinition enligt 6.0 som gäller hela dokumentet)
* **Sidhuvud & Sidfot-definition** (Layoutinställningar samt textfält definierade av administratör)
  * Fält-ID och fälttyp (*Logotyp, Organisation eller Text*)
  * Position i 3×3-matrisen (`position`, valfri: `col` = *left/center/right*, `row` = *top/middle/bottom*; fält utan position placeras i vänster/mitt, fält i samma cell staplas i listordning)
  * Typografi (`style`, valfri Stildefinition enligt 6.0)
* **Parametrar** (Lista med metadata per parameter)
  * Parameter-ID
  * Datatyp (*Text, Datum, Numerisk, Ja/Nej, Lista*)
  * Standardvärde / Förvalda värden (kan tilldelas programmatiskt)
  * Nivåstruktur (*Logiska villkor för nästlade parametrar*)
* **Innehållsblock & Fraser** (Lista i mallen)
  * Block-ID
  * Blocktyp (*Låst* eller *Redigerbart*)
  * Placeringsstatus (*Fast* eller *Fri/Fras*)
  * Förhandsinnehåll (Grundtext med platshållare för parametrar)
  * Typografi (`style`, valfri Stildefinition enligt 6.0 som ersätter mallens standardtypografi för blocket)

### 6.3 Dokument / Session (Sparfil)
Informationsobjekt för den lokala fil som sparas i Fred Editor för fortsatt redigering.
* **Dokument-ID** (Unik identifierare)
* **Mall-referens** (ID till ursprunglig mall – låst efter skapande)
* **Vald Organisation** (Referens till den organisation som utfärdat gällande dokument)
* **Parametervärden** (Lista som mappar Parameter-ID till användarens faktiska eller programmatiskt tilldelade värden)
* **Struktur av använda block:** En lista över de block som faktiskt ingår i dokumentet (inklusive de specifika fraser som användaren har valt att infoga och deras placering).
* **Användargenererad text** (De ändringar, formateringar och fritexter som användaren lagt till i de redigerbara blocken)

### 6.4 Mallhierarki
Struktur som används för att organisera mallbiblioteket i Fred Editors gränssnitt.
* **Kategori-ID** (Unik identifierare)
* **Kategorinamn** (Textsträng)
* **Relationer** (Referenser till underkategorier eller kopplade Mall-ID:n)
