// Inbyggd standardmall (kravspec V11): affärsbrev från det fiktiva
// företaget Exempelbolaget AB, tillgänglig utan att externa filer läses in.
// Logotypen är egendesignad för Fred (CC0). Genererad fil – uppdatera via
// scratchpad-skriptet eller redigera templates/standard/*.json parallellt.
import { Mall, Organisation } from "@fred/shared";

export const BUILTIN_ORGANISATION: Organisation = {
  "id": "org-exempelbolaget",
  "name": "Exempelbolaget AB",
  "logoDataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMjAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyMjAgNjQiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzBlNzQ5MCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNTYzZWIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcng9IjE0IiBmaWxsPSJ1cmwoI2cpIi8+CiAgPHBhdGggZD0iTTIwIDIwaDI2djdIMjl2NmgxNXY3SDI5djZoMTd2N0gyMHoiIGZpbGw9IiNmZmYiLz4KICA8dGV4dCB4PSI3NCIgeT0iMzYiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCAnVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iMjEiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMGYxNzJhIj5FeGVtcGVsYm9sYWdldDwvdGV4dD4KICA8dGV4dCB4PSI3NCIgeT0iNTMiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCAnVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iMTEiIGxldHRlci1zcGFjaW5nPSI0IiBmaWxsPSIjNjQ3NDhiIj5BS1RJRUJPTEFHPC90ZXh0Pgo8L3N2Zz4=",
  "logoSource": "Egendesignad för Fred (fiktivt företag)",
  "logoLicense": "CC0"
};

export const BUILTIN_MALL: Mall = {
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
} as unknown as Mall;

// Datum-parametern förifylls med dagens datum vid appstart.
const datumDef = BUILTIN_MALL.parameters.find((p) => p.id === "datum");
if (datumDef) datumDef.defaultValue = new Date().toISOString().slice(0, 10);
