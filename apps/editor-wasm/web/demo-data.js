// Inbyggd demodata så att Fred Editor fungerar direkt vid första start.
// Egna organisations-, mall- och sessionsfiler kan läsas in via Arkiv → Öppna.
(function () {
  const logoNasby =
    "data:image/svg+xml;base64," +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="14" fill="#185ABD"/><text x="48" y="63" font-family="Georgia,serif" font-size="46" fill="#fff" text-anchor="middle">N</text></svg>'
    );
  const logoVastmark =
    "data:image/svg+xml;base64," +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><circle cx="48" cy="48" r="46" fill="#217346"/><text x="48" y="63" font-family="Georgia,serif" font-size="44" fill="#fff" text-anchor="middle">V</text></svg>'
    );

  const organisations = [
    { id: "org-nasby", name: "Näsby kommun", logoDataUrl: logoNasby },
    { id: "org-vastmark", name: "Region Västmark", logoDataUrl: logoVastmark },
  ];

  const mallFardtjanst = {
    id: "mall-fardtjanst",
    name: "Beslut om färdtjänst",
    description: "Myndighetsbeslut med villkorade textavsnitt och överklagandefraser.",
    categoryId: "kat-beslut",
    orgScope: { mode: "all" },
    // Standardtypografi (kravspec 6.2) — ärvs av block/fält utan egen stil.
    defaultStyle: { fontFamily: "Georgia, 'Times New Roman', serif", fontSizePt: 11 },
    headerFooter: {
      headerFields: [
        { id: "hf-logo", kind: "logo", position: { col: "left", row: "top" } },
        {
          id: "hf-org",
          kind: "organisation",
          position: { col: "center", row: "top" },
          style: { fontSizePt: 14, bold: true },
        },
        {
          id: "hf-dnr",
          kind: "text",
          label: "Diarienummer",
          defaultText: "Dnr FT 2026-0000",
          position: { col: "right", row: "top" },
          style: { italic: true },
        },
      ],
      footerFields: [
        {
          id: "ff-adress",
          kind: "text",
          label: "Kontaktuppgifter",
          defaultText: "Postadress: Box 100, 123 45 Näsby · Telefon: 0123-45 60 00 · E-post: kontakt@kommunen.se",
          position: { col: "center", row: "bottom" },
        },
      ],
    },
    parameters: [
      { id: "sokande", label: "Sökandens namn", type: "text" },
      { id: "personnummer", label: "Personnummer", type: "text" },
      { id: "beslutsdatum", label: "Beslutsdatum", type: "date" },
      { id: "handlaggare", label: "Handläggare", type: "text" },
      {
        id: "beslut",
        label: "Beslut",
        type: "list",
        defaultValue: "bifall",
        options: [
          { value: "bifall", label: "bifall" },
          { value: "delvis", label: "delvis bifall" },
          { value: "avslag", label: "avslag" },
        ],
        children: [
          { id: "giltighetstid", label: "Giltighetstid", type: "list", showWhen: "bifall", defaultValue: "3",
            options: [
              { value: "1", label: "ett år" },
              { value: "3", label: "tre år" },
              { value: "5", label: "fem år" },
            ] },
          { id: "avslagsmotivering", label: "Motivering till avslag", type: "text", showWhen: "avslag" },
        ],
      },
      { id: "antalresor", label: "Antal enkelresor per månad", type: "number", defaultValue: 24 },
      { id: "ledsagare", label: "Rätt till ledsagare", type: "boolean", defaultValue: false },
    ],
    blocks: [
      {
        id: "blk-rubrik",
        title: "Dokumentrubrik",
        type: "locked",
        placement: "fixed",
        order: 0,
        content:
          "<h1>Beslut om färdtjänst</h1><p><strong>Sökande:</strong> {{sokande}}, {{personnummer}}<br><strong>Beslutsdatum:</strong> {{beslutsdatum}}</p>",
      },
      {
        id: "blk-beslut",
        title: "Beslutsmening",
        type: "locked",
        placement: "fixed",
        order: 1,
        content:
          "<h2>Beslut</h2><p>Din ansökan om färdtjänst enligt lagen (1997:736) om färdtjänst har prövats. Ansökan får <strong>{{beslut}}</strong>.</p>",
      },
      {
        id: "blk-omfattning",
        title: "Omfattning",
        type: "editable",
        placement: "fixed",
        order: 2,
        content:
          "<h2>Beslutets omfattning</h2><p>Tillståndet gäller i {{giltighetstid}} från beslutsdatumet och omfattar {{antalresor}} enkelresor per månad inom kommunen. Rätt till ledsagare under resa: {{ledsagare}}.</p><p>Resor beställs hos beställningscentralen senast två timmar före önskad avresetid. Vid regelbundna resor, till exempel arbetsresor, kan stående beställning läggas upp.</p>",
      },
      {
        id: "blk-skal",
        title: "Skäl för beslutet",
        type: "editable",
        placement: "fixed",
        order: 3,
        content:
          "<h2>Skäl för beslutet</h2><p>Av utredningen framgår att {{sokande}} på grund av funktionsnedsättning, som inte endast är tillfällig, har väsentliga svårigheter att förflytta sig på egen hand eller att resa med allmänna kommunikationsmedel. {{avslagsmotivering}}</p><p>Vid bedömningen har hänsyn tagits till inkomna intyg samt de uppgifter som lämnats vid utredningssamtalet.</p>",
      },
      {
        id: "blk-underskrift",
        title: "Underskrift",
        type: "locked",
        placement: "fixed",
        order: 4,
        content:
          "<p>Beslut i detta ärende har fattats av undertecknad handläggare.</p><p><strong>{{handlaggare}}</strong><br>Färdtjänsthandläggare</p>",
      },
      {
        id: "blk-overklaga",
        title: "Hur du överklagar",
        type: "editable",
        placement: "free",
        order: 5,
        content:
          "<h2>Hur du överklagar</h2><p>Om du är missnöjd med beslutet kan du överklaga det till förvaltningsrätten. Överklagandet ska vara skriftligt och ha kommit in till kommunen inom tre veckor från den dag du tog del av beslutet. Ange vilket beslut du överklagar och vilken ändring du vill ha.</p>",
      },
      {
        id: "blk-ledsagarinfo",
        title: "Information om ledsagare",
        type: "editable",
        placement: "free",
        order: 6,
        content:
          "<h2>Information om ledsagare</h2><p>Ledsagare är en person som följer med under själva resan för att du ska kunna genomföra den. Ledsagaren reser utan avgift men måste stiga på och av på samma plats som du.</p>",
      },
      {
        id: "blk-avgifter",
        title: "Avgifter",
        type: "editable",
        placement: "free",
        order: 7,
        content:
          "<h2>Avgifter</h2><p>För resor med färdtjänst betalar du en egenavgift som motsvarar taxan i kollektivtrafiken med ett tillägg om 50 procent. Aktuella avgifter finns på kommunens webbplats.</p>",
      },
    ],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  };

  const mallIntyg = {
    id: "mall-anstallningsintyg",
    name: "Anställningsintyg",
    description: "Enkelt intyg med grunduppgifter och fritt omdöme.",
    categoryId: "kat-intyg",
    orgScope: { mode: "specific", organisationId: "org-nasby" },
    headerFooter: {
      headerFields: [
        { id: "hf-logo", kind: "logo" },
        { id: "hf-org", kind: "organisation" },
      ],
      footerFields: [
        { id: "ff-sida", kind: "text", label: "Sidfotstext", defaultText: "Detta intyg är utfärdat digitalt och gäller utan underskrift." },
      ],
    },
    parameters: [
      { id: "namn", label: "Medarbetarens namn", type: "text" },
      { id: "befattning", label: "Befattning", type: "text" },
      { id: "anstallningsdatum", label: "Anställd sedan", type: "date" },
      { id: "slutdatum", label: "Slutdatum", type: "date" },
      { id: "chef", label: "Närmaste chef", type: "text" },
      {
        id: "anstallningsform",
        label: "Anställningsform",
        type: "list",
        defaultValue: "tillsvidare",
        options: [
          { value: "tillsvidare", label: "tillsvidareanställning" },
          { value: "visstid", label: "allmän visstidsanställning" },
          { value: "vikariat", label: "vikariat" },
        ],
      },
    ],
    blocks: [
      {
        id: "blk-i-rubrik",
        title: "Rubrik",
        type: "locked",
        placement: "fixed",
        order: 0,
        content: "<h1>Anställningsintyg</h1>",
      },
      {
        id: "blk-i-grund",
        title: "Grunduppgifter",
        type: "locked",
        placement: "fixed",
        order: 1,
        content:
          "<p>Härmed intygas att {{namn}} har varit anställd hos oss som {{befattning}} under perioden {{anstallningsdatum}} – {{slutdatum}}. Anställningen har varit en {{anstallningsform}}.</p>",
      },
      {
        id: "blk-i-omdome",
        title: "Omdöme",
        type: "editable",
        placement: "fixed",
        order: 2,
        content:
          "<h2>Vitsord</h2><p>{{namn}} har under sin anställning utfört sina arbetsuppgifter på ett mycket förtjänstfullt sätt och har visat gott omdöme, god samarbetsförmåga och stort engagemang.</p>",
      },
      {
        id: "blk-i-underskrift",
        title: "Underskrift",
        type: "locked",
        placement: "fixed",
        order: 3,
        content: "<p><strong>{{chef}}</strong><br>Närmaste chef</p>",
      },
      {
        id: "blk-i-referens",
        title: "Referens lämnas",
        type: "editable",
        placement: "free",
        order: 4,
        content:
          "<p>Vi lämnar gärna ytterligare referenser på begäran. Kontakta {{chef}} via kommunens växel.</p>",
      },
    ],
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-05-20T08:00:00.000Z",
  };

  const orgExempelbolaget = {
  "id": "org-exempelbolaget",
  "name": "Exempelbolaget AB",
  "logoDataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyMjAgNjQiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzBlNzQ5MCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcng9IjE0IiBmaWxsPSJ1cmwoI2cpIi8+CiAgPHBhdGggZD0iTTIwIDIwaDI2djdIMjl2NmgxNXY3SDI5djZoMTd2N0gyMHoiIGZpbGw9IiNmZmYiLz4KICA8dGV4dCB4PSI3NCIgeT0iMzYiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCAnVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iMjEiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMGYxNzJhIj5FeGVtcGVsYm9sYWdldDwvdGV4dD4KICA8dGV4dCB4PSI3NCIgeT0iNTMiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCAnVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iMTEiIGxldHRlci1zcGFjaW5nPSI0IiBmaWxsPSIjNjQ3NDhiIj5BS1RJRUJPTEFHPC90ZXh0Pgo8L3N2Zz4=",
  "logoSource": "Egendesignad för Fred (fiktivt företag)",
  "logoLicense": "CC0"
};

  const mallExempelbrev = {
  "id": "mall-exempelbolaget-brev",
  "name": "Affärsbrev – Exempelbolaget",
  "description": "Enkel standardmall: affärsbrev från det fiktiva företaget Exempelbolaget AB. Inbyggd i editorn och användbar utan att externa filer läses in.",
  "categoryId": "standard",
  "orgScope": {
    "mode": "specific",
    "organisationId": "org-exempelbolaget"
  },
  "defaultStyle": {
    "fontFamily": "Georgia, 'Times New Roman', serif",
    "fontSizePt": 11
  },
  "headerFooter": {
    "headerFields": [
      {
        "id": "hf-logo",
        "kind": "logo",
        "position": {
          "col": "left",
          "row": "top"
        }
      },
      {
        "id": "hf-adress",
        "kind": "text",
        "label": "Avsändaradress",
        "defaultText": "Storgatan 1 · 111 22 Stockholm",
        "position": {
          "col": "right",
          "row": "top"
        },
        "style": {
          "fontSizePt": 9
        }
      }
    ],
    "footerFields": [
      {
        "id": "ff-info",
        "kind": "text",
        "label": "Företagsuppgifter",
        "defaultText": "Exempelbolaget AB · Org.nr 556000-0000 · info@exempelbolaget.se · www.exempelbolaget.se",
        "position": {
          "col": "center",
          "row": "bottom"
        },
        "style": {
          "fontSizePt": 8
        }
      }
    ]
  },
  "parameters": [
    {
      "id": "mottagareNamn",
      "label": "Mottagarens namn",
      "type": "text"
    },
    {
      "id": "mottagareAdress",
      "label": "Mottagarens adress",
      "type": "text"
    },
    {
      "id": "datum",
      "label": "Datum",
      "type": "date"
    },
    {
      "id": "arende",
      "label": "Ärende",
      "type": "text"
    },
    {
      "id": "avsandareNamn",
      "label": "Avsändarens namn",
      "type": "text",
      "defaultValue": "Anna Andersson"
    },
    {
      "id": "avsandareTitel",
      "label": "Avsändarens titel",
      "type": "text",
      "defaultValue": "VD"
    }
  ],
  "blocks": [
    {
      "id": "b-huvud",
      "title": "Brevhuvud",
      "type": "locked",
      "placement": "fixed",
      "content": "<p>{{datum}}</p><p><strong>{{mottagareNamn}}</strong><br>{{mottagareAdress}}</p>",
      "order": 0
    },
    {
      "id": "b-arende",
      "title": "Ärenderad",
      "type": "locked",
      "placement": "fixed",
      "content": "<h2>Ärende: {{arende}}</h2>",
      "order": 1,
      "style": {
        "fontSizePt": 13,
        "bold": true
      }
    },
    {
      "id": "b-inledning",
      "title": "Inledning",
      "type": "editable",
      "placement": "fixed",
      "content": "<p>Hej {{mottagareNamn}},</p><p>tack för din förfrågan. Här kommer den information du efterfrågat.</p>",
      "order": 2
    },
    {
      "id": "b-brodtext",
      "title": "Brödtext",
      "type": "editable",
      "placement": "fixed",
      "content": "<p>Skriv brevets huvudsakliga innehåll här. Blocket är fritt redigerbart – du kan formatera text, lägga till stycken och rubriker.</p>",
      "order": 3
    },
    {
      "id": "b-halsning",
      "title": "Hälsning",
      "type": "editable",
      "placement": "fixed",
      "content": "<p>Med vänliga hälsningar,</p><p><strong>{{avsandareNamn}}</strong><br>{{avsandareTitel}}, Exempelbolaget AB</p>",
      "order": 4
    },
    {
      "id": "b-bilagor",
      "title": "Bilageförteckning",
      "type": "editable",
      "placement": "free",
      "content": "<h3>Bilagor</h3><p>1. </p>",
      "order": 5
    }
  ],
  "createdAt": "2026-07-04T00:00:00Z",
  "updatedAt": "2026-07-04T00:00:00Z"
};

  // Datum-parametern förifylls med dagens datum vid appstart (kravspec V11).
  const exDatum = mallExempelbrev.parameters.find((p) => p.id === "datum");
  if (exDatum) exDatum.defaultValue = new Date().toISOString().slice(0, 10);

  const hierarchy = {
    id: "kat-rot",
    name: "Mallbibliotek",
    templateIds: [],
    children: [
      { id: "kat-beslut", name: "Beslut", templateIds: ["mall-fardtjanst"], children: [] },
      { id: "kat-intyg", name: "Intyg", templateIds: ["mall-anstallningsintyg"], children: [] },
      { id: "standard", name: "Standard", templateIds: ["mall-exempelbolaget-brev"], children: [] },
    ],
  };

  organisations.push(orgExempelbolaget);
  window.FRED_DEMO = { organisations, mallar: [mallExempelbrev, mallFardtjanst, mallIntyg], hierarchy };
})();
