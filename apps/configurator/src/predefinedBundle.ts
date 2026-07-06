// Fördefinierad mallbunt (kravspec V12): Sveriges myndighetsmallar,
// tillgänglig i Konfiguratorn via knappen "Lägg till Sveriges
// myndighetsmallar". Bakas in offline - inget nätverksanrop krävs.
//
// Genererad fil - regenerera via
// node scripts/generate-config-bundles.mjs från
// templates/swedish-government/config.json. Redigera inte för hand.
import { ConfigFile } from "@fred/shared";

export const PREDEFINED_BUNDLE: ConfigFile = {
  "marker": "fred-konfiguration",
  "version": 1,
  "organisations": [
    {
      "id": "org-overklagande-vader",
      "name": "Myndigheten för överklagande av dåligt väder",
      "logoDataUrl": "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E %3C%21-- Myndigheten f%C3%B6r %C3%B6verklagande av d%C3%A5ligt v%C3%A4der (fiktiv) - emblem: paraply (skyddet), paragraftecken (%C3%B6verklagandet), regn och blixt (klagom%C3%A5lsf%C3%B6rem%C3%A5len). Egen design, CC0. --%3E %3Ccircle cx=%2260%22 cy=%2260%22 r=%2258%22 fill=%22%231F4E79%22/%3E %3Ccircle cx=%2260%22 cy=%2260%22 r=%2252%22 fill=%22none%22 stroke=%22%23FFFFFF%22 stroke-opacity=%220.55%22 stroke-width=%222%22/%3E %3Cg stroke=%22%239FC4E8%22 stroke-width=%223%22 stroke-linecap=%22round%22%3E %3Cline x1=%2232%22 y1=%2216%22 x2=%2228%22 y2=%2226%22/%3E %3Cline x1=%2248%22 y1=%2211%22 x2=%2244%22 y2=%2221%22/%3E %3Cline x1=%2276%22 y1=%2212%22 x2=%2272%22 y2=%2222%22/%3E %3Cline x1=%2297%22 y1=%2234%22 x2=%2293%22 y2=%2244%22/%3E %3Cline x1=%22102%22 y1=%2252%22 x2=%2298%22 y2=%2262%22/%3E %3C/g%3E %3Cpolygon points=%2230,64 20,80 26,80 16,96%22 fill=%22%23FFD23F%22/%3E %3Cpath d=%22M20 62 A40 40 0 0 1 100 62 L100 62 A6.7 5 0 0 0 86.6 62 A6.7 5 0 0 0 73.3 62 A6.7 5 0 0 0 60 62 A6.7 5 0 0 0 46.7 62 A6.7 5 0 0 0 33.4 62 A6.7 5 0 0 0 20 62 Z%22 fill=%22%23FFFFFF%22/%3E %3Cline x1=%2260%22 y1=%2216%22 x2=%2260%22 y2=%2224%22 stroke=%22%23FFFFFF%22 stroke-width=%223%22 stroke-linecap=%22round%22/%3E %3Cpath d=%22M60 62 V90 A8 8 0 0 1 44 90%22 fill=%22none%22 stroke=%22%23FFFFFF%22 stroke-width=%224.5%22 stroke-linecap=%22round%22/%3E %3Ctext x=%2260%22 y=%2252%22 text-anchor=%22middle%22 font-family=%22Georgia, 'Times New Roman', serif%22 font-size=%2220%22 font-weight=%22bold%22 fill=%22%231F4E79%22%3E%C2%A7%3C/text%3E %3Ctext x=%2260%22 y=%22108%22 text-anchor=%22middle%22 font-family=%22Georgia, 'Times New Roman', serif%22 font-size=%2213%22 letter-spacing=%222%22 fill=%22%23FFFFFF%22%3EM%C3%96DV%3C/text%3E %3C/svg%3E",
      "logoSource": "Egendesignad för Fred (fiktiv myndighet)",
      "logoLicense": "CC0"
    }
  ],
  "hierarchy": {
    "id": "root",
    "name": "Svenska myndighetsdokument",
    "children": [
      {
        "id": "examples",
        "name": "Exempel och dokumentation",
        "children": [],
        "templateIds": [
          "mall-comprehensive-example"
        ]
      },
      {
        "id": "swedish-government",
        "name": "Svenska myndigheter",
        "children": [
          {
            "id": "arbetsmarknaden",
            "name": "Arbetsmarknad",
            "children": [],
            "templateIds": [
              "mall-handlingsplan"
            ]
          },
          {
            "id": "skatter-och-naringsverksamhet",
            "name": "Skatter och näringsverksamhet",
            "children": [],
            "templateIds": [
              "mall-arbetsgivardeklaration",
              "mall-naringsanmalan"
            ]
          },
          {
            "id": "forsaksring",
            "name": "Försäkringar och social trygghet",
            "children": [],
            "templateIds": [
              "mall-lakarintyg",
              "mall-foraldrapenning",
              "mall-boendebidrag"
            ]
          },
          {
            "id": "utbildning",
            "name": "Utbildning",
            "children": [],
            "templateIds": [
              "mall-studiestod"
            ]
          },
          {
            "id": "migration",
            "name": "Migration och id-handlingar",
            "children": [],
            "templateIds": [
              "mall-uppehallstillstand",
              "mall-id-handling"
            ]
          },
          {
            "id": "skulder",
            "name": "Skulder och betalning",
            "children": [],
            "templateIds": [
              "mall-betalningsplan"
            ]
          }
        ],
        "templateIds": []
      }
    ],
    "templateIds": []
  },
  "mallar": [
    {
      "id": "mall-handlingsplan",
      "name": "Personlig handlingsplan",
      "description": "Handlingsplan för arbetssökande",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "personalName",
          "label": "Personens namn",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "personalNumber",
          "label": "Personnummer (YYYYMMDD-XXXX)",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "date",
          "label": "Datum för handlingsplanen",
          "type": "date",
          "defaultValue": "2026-07-03"
        },
        {
          "id": "employmentGoal",
          "label": "Arbetsmarknadsmål",
          "type": "list",
          "options": [
            {
              "value": "anstallning",
              "label": "Anställning på öppen arbetsmarknad"
            },
            {
              "value": "egenforetagare",
              "label": "Etablera eget företag"
            },
            {
              "value": "utbildning",
              "label": "Genomgå yrkesutbildning"
            }
          ]
        },
        {
          "id": "action",
          "label": "Specifik åtgärd",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "timeline",
          "label": "Tidsplan för åtgärd",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "supportOffered",
          "label": "Stödåtgärd från AF",
          "type": "text",
          "defaultValue": "Arbetsmarknadsutbildning, jobbcoachning eller praktikplats"
        }
      ],
      "blocks": [
        {
          "id": "block-intro",
          "title": "Introduktion",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Personlig handlingsplan</h2><p>Denna handlingsplan upprättas tillsammans med myndigheten för att stödja dina möjligheter på arbetsmarknaden.</p>",
          "order": 1
        },
        {
          "id": "block-info",
          "title": "Personlig information",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{personalName}}<br/><strong>Personnummer:</strong> {{personalNumber}}<br/><strong>Datum:</strong> {{date}}</p>",
          "order": 2
        },
        {
          "id": "block-goal",
          "title": "Arbetsmarknadsmål",
          "type": "editable",
          "placement": "fixed",
          "content": "<p>Ditt primära mål är att {{employmentGoal}}. Detta kommer att uppnås genom följande åtgärder:</p>",
          "order": 3
        },
        {
          "id": "block-actions",
          "title": "Åtgärder",
          "type": "editable",
          "placement": "free",
          "content": "<p>Åtgärd: {{action}}</p><p>Tidsplan: {{timeline}}</p>",
          "order": 4
        },
        {
          "id": "block-support",
          "title": "Stöd från myndigheten",
          "type": "locked",
          "placement": "fixed",
          "content": "<p>Myndigheten erbjuder följande stöd: {{supportOffered}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482730Z",
      "updatedAt": "2026-07-03T11:52:39.482730Z"
    },
    {
      "id": "mall-arbetsgivardeklaration",
      "name": "Arbetsgivardeklaration",
      "description": "Månatlig rapportering av arbetsgivaravgifter",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "reportingMonth",
          "label": "Rapporterings månad (YYYY-MM)",
          "type": "text",
          "defaultValue": "2026-07"
        },
        {
          "id": "orgNumber",
          "label": "Organisationsnummer",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "companyName",
          "label": "Företagsnamn",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "employeeName",
          "label": "Anställds namn",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "employeeId",
          "label": "Personnummer",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "salary",
          "label": "Månadslön (SEK)",
          "type": "number",
          "defaultValue": 0
        },
        {
          "id": "avgift",
          "label": "Arbetsgivaravgift (SEK)",
          "type": "number",
          "defaultValue": 0
        },
        {
          "id": "totalSalaries",
          "label": "Totala löner för månad",
          "type": "number",
          "defaultValue": 0
        },
        {
          "id": "totalAvgift",
          "label": "Total arbetsgivaravgift",
          "type": "number",
          "defaultValue": 0
        }
      ],
      "blocks": [
        {
          "id": "block-header",
          "title": "Arbetsgivardeklaration",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Arbetsgivardeklaration för {{reportingMonth}}</h2>",
          "order": 1
        },
        {
          "id": "block-employer-info",
          "title": "Arbetsgivarinformation",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Organisationsnummer:</strong> {{orgNumber}}<br/><strong>Företagsnamn:</strong> {{companyName}}<br/><strong>Rapporterings månad:</strong> {{reportingMonth}}</p>",
          "order": 2
        },
        {
          "id": "block-employees",
          "title": "Anställdas information",
          "type": "editable",
          "placement": "free",
          "content": "<p><strong>Namn:</strong> {{employeeName}}<br/><strong>Personnummer:</strong> {{employeeId}}<br/><strong>Lön:</strong> {{salary}} SEK<br/><strong>Arbetsgivaravgift:</strong> {{avgift}} SEK</p>",
          "order": 3
        },
        {
          "id": "block-total",
          "title": "Totalt",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Totala utgifter för löner:</strong> {{totalSalaries}} SEK<br/><strong>Total arbetsgivaravgift:</strong> {{totalAvgift}} SEK</p>",
          "order": 4
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482752Z",
      "updatedAt": "2026-07-03T11:52:39.482752Z"
    },
    {
      "id": "mall-lakarintyg",
      "name": "Läkarintyg för sjukpenning",
      "description": "Medicinsk bedömning för sjukpenning",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "patientName",
          "label": "Patientens namn",
          "type": "text"
        },
        {
          "id": "patientNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "examinationDate",
          "label": "Datum för läkarundersökning",
          "type": "date"
        },
        {
          "id": "diagnosis",
          "label": "Diagnos (ICD-kod)",
          "type": "text"
        },
        {
          "id": "sickLeavePercent",
          "label": "Sjukskrivnings grad (%)",
          "type": "number",
          "defaultValue": 100,
          "options": [
            {
              "value": "25",
              "label": "25%"
            },
            {
              "value": "50",
              "label": "50%"
            },
            {
              "value": "75",
              "label": "75%"
            },
            {
              "value": "100",
              "label": "100%"
            }
          ]
        },
        {
          "id": "startDate",
          "label": "Sjukskrivningens startdatum",
          "type": "date"
        },
        {
          "id": "endDate",
          "label": "Sjukskrivningens slutdatum",
          "type": "date"
        },
        {
          "id": "workabilityDescription",
          "label": "Beskrivning av arbetsförmåga",
          "type": "text"
        },
        {
          "id": "treatmentPlan",
          "label": "Planerad behandling och uppföljning",
          "type": "text"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Läkarintyg",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Läkarintyg för sjukpenning</h2>",
          "order": 1
        },
        {
          "id": "block-patient",
          "title": "Patientinformation",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{patientName}}<br/><strong>Personnummer:</strong> {{patientNumber}}<br/><strong>Datum för underlag:</strong> {{examinationDate}}</p>",
          "order": 2
        },
        {
          "id": "block-diagnosis",
          "title": "Diagnos och medicinsk bedömning",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Diagnos:</strong> {{diagnosis}}<br/><strong>Sjukskrivnings grad:</strong> {{sickLeavePercent}}%<br/><strong>Sjukskrivningsperiod:</strong> Från {{startDate}} till {{endDate}}</p>",
          "order": 3
        },
        {
          "id": "block-workability",
          "title": "Arbetsförmåga",
          "type": "editable",
          "placement": "fixed",
          "content": "<p>{{workabilityDescription}}</p>",
          "order": 4
        },
        {
          "id": "block-treatment",
          "title": "Planerad behandling",
          "type": "editable",
          "placement": "fixed",
          "content": "<p>{{treatmentPlan}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482756Z",
      "updatedAt": "2026-07-03T11:52:39.482756Z"
    },
    {
      "id": "mall-foraldrapenning",
      "name": "Ansökan om föräldrapenning",
      "description": "Ansökan för graviditets- och föräldrapenning",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "applicantName",
          "label": "Ansökares namn",
          "type": "text"
        },
        {
          "id": "applicantNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "phone",
          "label": "Telefonnummer",
          "type": "text"
        },
        {
          "id": "email",
          "label": "E-postadress",
          "type": "text"
        },
        {
          "id": "childName",
          "label": "Barnets namn",
          "type": "text"
        },
        {
          "id": "childNumber",
          "label": "Barnets personnummer",
          "type": "text"
        },
        {
          "id": "birthDate",
          "label": "Barnets födelsedatum",
          "type": "date"
        },
        {
          "id": "startPeriod",
          "label": "Föräldrapenningens startdatum",
          "type": "date"
        },
        {
          "id": "endPeriod",
          "label": "Föräldrapenningens slutdatum",
          "type": "date"
        },
        {
          "id": "numberOfDays",
          "label": "Antal dagar föräldrapenning",
          "type": "number"
        },
        {
          "id": "leaveType",
          "label": "Typ av föräldrapenning",
          "type": "list",
          "options": [
            {
              "value": "graviditet",
              "label": "Graviditetspenning"
            },
            {
              "value": "foraldrapenning",
              "label": "Föräldrapenning"
            },
            {
              "value": "foraldrapenning-delad",
              "label": "Föräldrapenning - delad"
            }
          ]
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om föräldrapenning",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om föräldrapenning</h2>",
          "order": 1
        },
        {
          "id": "block-applicant",
          "title": "Ansökares information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{applicantName}}<br/><strong>Personnummer:</strong> {{applicantNumber}}<br/><strong>Telefon:</strong> {{phone}}<br/><strong>E-post:</strong> {{email}}</p>",
          "order": 2
        },
        {
          "id": "block-child",
          "title": "Barnets information",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Barnets namn:</strong> {{childName}}<br/><strong>Personnummer:</strong> {{childNumber}}<br/><strong>Född:</strong> {{birthDate}}</p>",
          "order": 3
        },
        {
          "id": "block-period",
          "title": "Tidsperiod för föräldrapenning",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Från och med:</strong> {{startPeriod}}<br/><strong>Till och med:</strong> {{endPeriod}}<br/><strong>Antal dagar:</strong> {{numberOfDays}}</p>",
          "order": 4
        },
        {
          "id": "block-type",
          "title": "Typ av föräldrapenning",
          "type": "locked",
          "placement": "fixed",
          "content": "<p>Jag ansöker om: {{leaveType}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482763Z",
      "updatedAt": "2026-07-03T11:52:39.482763Z"
    },
    {
      "id": "mall-studiestod",
      "name": "Ansökan om statligt studiestöd",
      "description": "Ansökan om studiestöd och studielån",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "studentName",
          "label": "Studentens namn",
          "type": "text"
        },
        {
          "id": "studentNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "citizenship",
          "label": "Medborgskap",
          "type": "text",
          "defaultValue": "Sverige"
        },
        {
          "id": "educationProgram",
          "label": "Utbildningsprogram",
          "type": "text"
        },
        {
          "id": "institution",
          "label": "Högskola/Universitet",
          "type": "text"
        },
        {
          "id": "studyStartDate",
          "label": "Studiernas startdatum",
          "type": "date"
        },
        {
          "id": "studyEndDate",
          "label": "Studiernas slutdatum",
          "type": "date"
        },
        {
          "id": "supportType",
          "label": "Typ av studiestöd",
          "type": "list",
          "options": [
            {
              "value": "stipendium",
              "label": "Stipendium"
            },
            {
              "value": "studielan",
              "label": "Studielån"
            },
            {
              "value": "bada",
              "label": "Både stipendium och studielån"
            }
          ]
        },
        {
          "id": "housingCost",
          "label": "Månadlig hyra/bostad (SEK)",
          "type": "number"
        },
        {
          "id": "livingCost",
          "label": "Övriga levnadskostnader (SEK)",
          "type": "number"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om statligt studiestöd",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om statligt studiestöd</h2><p>Myndigheten för överklagande av dåligt väder</p>",
          "order": 1
        },
        {
          "id": "block-student",
          "title": "Studentens information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{studentName}}<br/><strong>Personnummer:</strong> {{studentNumber}}<br/><strong>Medborgskap:</strong> {{citizenship}}</p>",
          "order": 2
        },
        {
          "id": "block-studies",
          "title": "Studieuppgifter",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Utbildning:</strong> {{educationProgram}}<br/><strong>Högskola/Universitet:</strong> {{institution}}<br/><strong>Startdatum:</strong> {{studyStartDate}}<br/><strong>Slutdatum:</strong> {{studyEndDate}}</p>",
          "order": 3
        },
        {
          "id": "block-support-type",
          "title": "Typ av studiestöd",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Önskad studiestöd:</strong> {{supportType}}</p>",
          "order": 4
        },
        {
          "id": "block-costs",
          "title": "Förväntade kostnader",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Hyra/Bostad:</strong> {{housingCost}} SEK<br/><strong>Övriga levnadskostnader:</strong> {{livingCost}} SEK</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482768Z",
      "updatedAt": "2026-07-03T11:52:39.482768Z"
    },
    {
      "id": "mall-boendebidrag",
      "name": "Ansökan om boendebidraget",
      "description": "Ansökan för ekonomiskt stöd till boende",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "applicantName",
          "label": "Ansökares namn",
          "type": "text"
        },
        {
          "id": "applicantNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "familyStatus",
          "label": "Familjeförhållande",
          "type": "list",
          "options": [
            {
              "value": "single",
              "label": "Ensam"
            },
            {
              "value": "gift",
              "label": "Gift/Samboende"
            },
            {
              "value": "forelder",
              "label": "Ensamstående förälder"
            }
          ]
        },
        {
          "id": "address",
          "label": "Bostadsadress",
          "type": "text"
        },
        {
          "id": "rentCost",
          "label": "Månadlig hyra (SEK)",
          "type": "number"
        },
        {
          "id": "housingStartDate",
          "label": "När började du bo på denna adress?",
          "type": "date"
        },
        {
          "id": "monthlyIncome",
          "label": "Total månadsinkomst (SEK)",
          "type": "number"
        },
        {
          "id": "otherCosts",
          "label": "Övriga månadskostnader (SEK)",
          "type": "number"
        },
        {
          "id": "familyMemberName",
          "label": "Familjemedlems namn",
          "type": "text"
        },
        {
          "id": "relation",
          "label": "Relation till ansökare",
          "type": "text"
        },
        {
          "id": "age",
          "label": "Ålder",
          "type": "number"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om boendebidraget",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om boendebidraget</h2>",
          "order": 1
        },
        {
          "id": "block-applicant",
          "title": "Ansökares information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{applicantName}}<br/><strong>Personnummer:</strong> {{applicantNumber}}<br/><strong>Familjeförhållande:</strong> {{familyStatus}}</p>",
          "order": 2
        },
        {
          "id": "block-housing",
          "title": "Bostadsinformation",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Bostadsadress:</strong> {{address}}<br/><strong>Hyra:</strong> {{rentCost}} SEK/månad<br/><strong>Bostad från och med:</strong> {{housingStartDate}}</p>",
          "order": 3
        },
        {
          "id": "block-income",
          "title": "Inkomst- och utgiftsinformation",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Månadsinkomst:</strong> {{monthlyIncome}} SEK<br/><strong>Övriga utgifter:</strong> {{otherCosts}} SEK</p>",
          "order": 4
        },
        {
          "id": "block-family",
          "title": "Familjemedlemmar",
          "type": "editable",
          "placement": "free",
          "content": "<p><strong>Namn:</strong> {{familyMemberName}}<br/><strong>Relation:</strong> {{relation}}<br/><strong>Ålder:</strong> {{age}} år</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482774Z",
      "updatedAt": "2026-07-03T11:52:39.482774Z"
    },
    {
      "id": "mall-naringsanmalan",
      "name": "Anmälan om start av näringsverksamhet",
      "description": "Registrering av nystartat företag",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "applicantName",
          "label": "Ansökares namn",
          "type": "text"
        },
        {
          "id": "applicantNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "applicantAddress",
          "label": "Personlig adress",
          "type": "text"
        },
        {
          "id": "businessName",
          "label": "Företagsnamn",
          "type": "text"
        },
        {
          "id": "businessType",
          "label": "Verksamhetstyp",
          "type": "list",
          "options": [
            {
              "value": "enskild",
              "label": "Enskild näringsidkare"
            },
            {
              "value": "aktiebolag",
              "label": "Aktiebolag"
            },
            {
              "value": "kommanditbolag",
              "label": "Kommanditbolag"
            },
            {
              "value": "osa",
              "label": "Ekonomisk förening"
            }
          ]
        },
        {
          "id": "startDate",
          "label": "Startdatum för verksamheten",
          "type": "date"
        },
        {
          "id": "businessDescription",
          "label": "Beskrivning av verksamhet",
          "type": "text"
        },
        {
          "id": "expectedRevenue",
          "label": "Förväntad årlig omsättning (SEK)",
          "type": "number"
        },
        {
          "id": "bankName",
          "label": "Banknamn",
          "type": "text"
        },
        {
          "id": "accountNumber",
          "label": "Bankkontonummer",
          "type": "text"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Anmälan om start av näringsverksamhet",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Anmälan om start av näringsverksamhet</h2>",
          "order": 1
        },
        {
          "id": "block-applicant",
          "title": "Andöares information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{applicantName}}<br/><strong>Personnummer:</strong> {{applicantNumber}}<br/><strong>Adress:</strong> {{applicantAddress}}</p>",
          "order": 2
        },
        {
          "id": "block-business",
          "title": "Företagsinformation",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Företagsnamn:</strong> {{businessName}}<br/><strong>Verksamhetstyp:</strong> {{businessType}}<br/><strong>Startdatum:</strong> {{startDate}}</p>",
          "order": 3
        },
        {
          "id": "block-business-details",
          "title": "Verksamhetsuppgifter",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Beskrivning av verksamhet:</strong> {{businessDescription}}<br/><strong>Förväntad årlig omsättning:</strong> {{expectedRevenue}} SEK</p>",
          "order": 4
        },
        {
          "id": "block-bank",
          "title": "Bankkontouppgifter",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Banknamn:</strong> {{bankName}}<br/><strong>Kontonummer:</strong> {{accountNumber}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482779Z",
      "updatedAt": "2026-07-03T11:52:39.482779Z"
    },
    {
      "id": "mall-uppehallstillstand",
      "name": "Ansökan om uppehållstillstånd",
      "description": "Ansökan för att få stanna i Sverige",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "fullName",
          "label": "Fullständigt namn",
          "type": "text"
        },
        {
          "id": "dateOfBirth",
          "label": "Födelsedatum",
          "type": "date"
        },
        {
          "id": "nationality",
          "label": "Medborgarskap/Nationalitet",
          "type": "text"
        },
        {
          "id": "residenceAddress",
          "label": "Aktuell boendeadress i Sverige",
          "type": "text"
        },
        {
          "id": "postalCode",
          "label": "Postnummer",
          "type": "text"
        },
        {
          "id": "applicationReason",
          "label": "Grund för uppehållstillstånds ansökan",
          "type": "list",
          "options": [
            {
              "value": "anstallning",
              "label": "Anställning"
            },
            {
              "value": "studier",
              "label": "Studier"
            },
            {
              "value": "familj",
              "label": "Familjesammanförning"
            },
            {
              "value": "egetyrelserott",
              "label": "Egna medel"
            }
          ]
        },
        {
          "id": "employer",
          "label": "Namn på arbetsgivare",
          "type": "text"
        },
        {
          "id": "position",
          "label": "Befattning",
          "type": "text"
        },
        {
          "id": "employmentProof",
          "label": "Anställningsbevis bifogat",
          "type": "boolean",
          "defaultValue": false
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om uppehållstillstånd",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om uppehållstillstånd</h2>",
          "order": 1
        },
        {
          "id": "block-personal",
          "title": "Personlig information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{fullName}}<br/><strong>Födelsedatum:</strong> {{dateOfBirth}}<br/><strong>Medborgarskap:</strong> {{nationality}}</p>",
          "order": 2
        },
        {
          "id": "block-residence",
          "title": "Aktuell boendeadress",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Adress i Sverige:</strong> {{residenceAddress}}<br/><strong>Postnummer:</strong> {{postalCode}}</p>",
          "order": 3
        },
        {
          "id": "block-reason",
          "title": "Grund för ansökan",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Grund:</strong> {{applicationReason}}</p>",
          "order": 4
        },
        {
          "id": "block-employment",
          "title": "Anställningsuppgifter (om tillämpligt)",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Arbetsgivare:</strong> {{employer}}<br/><strong>Befattning:</strong> {{position}}<br/><strong>Anställningsbevis bifogat:</strong> {{employmentProof}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482785Z",
      "updatedAt": "2026-07-03T11:52:39.482785Z"
    },
    {
      "id": "mall-id-handling",
      "name": "Ansökan om ID-handling",
      "description": "Ansökan för pass eller nationellt ID-kort",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "applicantName",
          "label": "Ansökares namn",
          "type": "text"
        },
        {
          "id": "personalNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "birthplace",
          "label": "Födelseort",
          "type": "text"
        },
        {
          "id": "idType",
          "label": "Typ av ID-handling",
          "type": "list",
          "options": [
            {
              "value": "pass",
              "label": "Pass"
            },
            {
              "value": "idkort",
              "label": "Nationellt ID-kort"
            },
            {
              "value": "byte",
              "label": "Byte av befintlig handling"
            }
          ]
        },
        {
          "id": "validity",
          "label": "Giltighetstid (år)",
          "type": "number",
          "defaultValue": 10
        },
        {
          "id": "phone",
          "label": "Telefonnummer",
          "type": "text"
        },
        {
          "id": "email",
          "label": "E-postadress",
          "type": "text"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om ID-handling",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om ID-handling</h2>",
          "order": 1
        },
        {
          "id": "block-applicant",
          "title": "Ansökares information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{applicantName}}<br/><strong>Personnummer:</strong> {{personalNumber}}<br/><strong>Födelseort:</strong> {{birthplace}}</p>",
          "order": 2
        },
        {
          "id": "block-id-type",
          "title": "Typ av ID-handling",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Önskad handling:</strong> {{idType}}</p>",
          "order": 3
        },
        {
          "id": "block-validity",
          "title": "Giltighet",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Önskad giltighetstid:</strong> {{validity}} år</p>",
          "order": 4
        },
        {
          "id": "block-contact",
          "title": "Kontaktuppgifter",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Telefon:</strong> {{phone}}<br/><strong>E-post:</strong> {{email}}</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482792Z",
      "updatedAt": "2026-07-03T11:52:39.482792Z"
    },
    {
      "id": "mall-betalningsplan",
      "name": "Ansökan om betalningsplan",
      "description": "Ansökan för betalningsplan för skulder",
      "categoryId": "swedish-government",
      "orgScope": {
        "mode": "specific",
        "organisationId": "org-overklagande-vader"
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp"
          },
          {
            "id": "header-org",
            "kind": "organisation"
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}"
          }
        ]
      },
      "parameters": [
        {
          "id": "debtorName",
          "label": "Gäldenärens namn",
          "type": "text"
        },
        {
          "id": "personalNumber",
          "label": "Personnummer",
          "type": "text"
        },
        {
          "id": "address",
          "label": "Adress",
          "type": "text"
        },
        {
          "id": "debtAmount",
          "label": "Skuldbelopp (SEK)",
          "type": "number"
        },
        {
          "id": "debtReason",
          "label": "Orsakskategori för skulden",
          "type": "list",
          "options": [
            {
              "value": "bosta",
              "label": "Bostadshyra"
            },
            {
              "value": "skatter",
              "label": "Skatter och avgifter"
            },
            {
              "value": "ovriga",
              "label": "Övriga skulder"
            }
          ]
        },
        {
          "id": "dueDate",
          "label": "Förfallodag",
          "type": "date"
        },
        {
          "id": "monthlyIncome",
          "label": "Månadsinkomst (SEK)",
          "type": "number"
        },
        {
          "id": "monthlyExpenses",
          "label": "Månadskostnader (SEK)",
          "type": "number"
        },
        {
          "id": "disposableIncome",
          "label": "Disponibel inkomst (SEK)",
          "type": "number"
        },
        {
          "id": "monthlyPayment",
          "label": "Föreslagen månatlig betalning (SEK)",
          "type": "number"
        },
        {
          "id": "repaymentPeriod",
          "label": "Förväntad återbetalningstid (månader)",
          "type": "number"
        }
      ],
      "blocks": [
        {
          "id": "block-title",
          "title": "Ansökan om betalningsplan",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Ansökan om betalningsplan för skuld</h2>",
          "order": 1
        },
        {
          "id": "block-debtor",
          "title": "Gäldenärens information",
          "type": "locked",
          "placement": "fixed",
          "content": "<p><strong>Namn:</strong> {{debtorName}}<br/><strong>Personnummer:</strong> {{personalNumber}}<br/><strong>Adress:</strong> {{address}}</p>",
          "order": 2
        },
        {
          "id": "block-debt",
          "title": "Skulduppgifter",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Skuldbeloppet:</strong> {{debtAmount}} SEK<br/><strong>Skuldens ursprung:</strong> {{debtReason}}<br/><strong>Förfallodag:</strong> {{dueDate}}</p>",
          "order": 3
        },
        {
          "id": "block-financial",
          "title": "Ekonomisk situation",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Månadsinkomst:</strong> {{monthlyIncome}} SEK<br/><strong>Månadskostnader:</strong> {{monthlyExpenses}} SEK<br/><strong>Disponibel inkomst:</strong> {{disposableIncome}} SEK</p>",
          "order": 4
        },
        {
          "id": "block-plan",
          "title": "Föreslaget betalningsschema",
          "type": "editable",
          "placement": "fixed",
          "content": "<p><strong>Betalning per månad:</strong> {{monthlyPayment}} SEK<br/><strong>Förväntad återbetalningstid:</strong> {{repaymentPeriod}} månader</p>",
          "order": 5
        }
      ],
      "createdAt": "2026-07-03T11:52:39.482795Z",
      "updatedAt": "2026-07-03T11:52:39.482795Z"
    },
    {
      "id": "mall-comprehensive-example",
      "name": "Omfattande exempel-mall (Alla konstruktioner)",
      "description": "Denna mall demonstrerar ALLA möjliga konstruktioner i Fred-systemet: text, datum, nummer, boolean, listor, nästlade parametrar, samma parameter på flera ställen, låsta/redigerbara block, fria block, sidhuvud/sidfot med 3x3-positionering samt typografi på tre nivåer (mall-standard, block och fält).",
      "categoryId": "examples",
      "orgScope": {
        "mode": "all"
      },
      "defaultStyle": {
        "fontFamily": "Georgia, 'Times New Roman', serif",
        "fontSizePt": 11
      },
      "headerFooter": {
        "headerFields": [
          {
            "id": "header-logo",
            "kind": "logo",
            "label": "Organisationslogotyp",
            "position": {
              "col": "left",
              "row": "top"
            }
          },
          {
            "id": "header-org",
            "kind": "organisation",
            "position": {
              "col": "center",
              "row": "top"
            },
            "style": {
              "fontSizePt": 14,
              "bold": true
            }
          },
          {
            "id": "header-custom",
            "kind": "text",
            "label": "Dokumenttyp",
            "defaultText": "EXEMPEL-DOKUMENT",
            "position": {
              "col": "right",
              "row": "top"
            },
            "style": {
              "bold": true,
              "fontSizePt": 9
            }
          }
        ],
        "footerFields": [
          {
            "id": "footer-page",
            "kind": "text",
            "label": "Sidnummer",
            "defaultText": "Sida {{page}}/{{totalPages}}",
            "position": {
              "col": "left",
              "row": "bottom"
            },
            "style": {
              "fontSizePt": 8
            }
          },
          {
            "id": "footer-date",
            "kind": "text",
            "label": "Datum",
            "defaultText": "Utskriftsdag: {{printDate}}",
            "position": {
              "col": "right",
              "row": "bottom"
            },
            "style": {
              "fontSizePt": 8,
              "italic": true
            }
          }
        ]
      },
      "parameters": [
        {
          "id": "applicantName",
          "label": "Namn på ansökare",
          "type": "text",
          "defaultValue": "John Doe"
        },
        {
          "id": "applicantEmail",
          "label": "E-postadress",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "applicantPhone",
          "label": "Telefonnummer",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "applicationDate",
          "label": "Ansökningsdatum",
          "type": "date",
          "defaultValue": "2026-07-03"
        },
        {
          "id": "birthDate",
          "label": "Födelsedatum",
          "type": "date",
          "defaultValue": ""
        },
        {
          "id": "startDate",
          "label": "Startdatum",
          "type": "date",
          "defaultValue": ""
        },
        {
          "id": "personalNumber",
          "label": "Personnummer (YYYYMMDD-XXXX)",
          "type": "text",
          "defaultValue": ""
        },
        {
          "id": "income",
          "label": "Månadsinkomst (SEK)",
          "type": "number",
          "defaultValue": 0
        },
        {
          "id": "expenses",
          "label": "Månadskostnader (SEK)",
          "type": "number",
          "defaultValue": 0
        },
        {
          "id": "percentage",
          "label": "Procentsats (%)",
          "type": "number",
          "defaultValue": 100
        },
        {
          "id": "hasFamily",
          "label": "Har barn/familj?",
          "type": "boolean",
          "defaultValue": false,
          "children": [
            {
              "id": "familyType",
              "label": "Typ av familj",
              "type": "list",
              "options": [
                {
                  "value": "barn",
                  "label": "Barn"
                },
                {
                  "value": "adopterad",
                  "label": "Adopterat barn"
                },
                {
                  "value": "styvbarn",
                  "label": "Styvbarn"
                }
              ],
              "showWhen": true
            },
            {
              "id": "numberOfChildren",
              "label": "Antal barn",
              "type": "number",
              "defaultValue": 0,
              "showWhen": true
            },
            {
              "id": "childrenAges",
              "label": "Barnens åldrar (kommaseparerat)",
              "type": "text",
              "defaultValue": "",
              "showWhen": true
            }
          ]
        },
        {
          "id": "isStudent",
          "label": "Studerar du?",
          "type": "boolean",
          "defaultValue": false,
          "children": [
            {
              "id": "studentInstitution",
              "label": "Utbildningsinstitution",
              "type": "text",
              "defaultValue": "",
              "showWhen": true
            },
            {
              "id": "studyProgram",
              "label": "Utbildningsprogram",
              "type": "text",
              "defaultValue": "",
              "showWhen": true
            }
          ]
        },
        {
          "id": "agreeToTerms",
          "label": "Godkänner villkoren?",
          "type": "boolean",
          "defaultValue": false
        },
        {
          "id": "educationLevel",
          "label": "Utbildningsnivå",
          "type": "list",
          "options": [
            {
              "value": "grundskola",
              "label": "Grundskola"
            },
            {
              "value": "gymnasium",
              "label": "Gymnasium"
            },
            {
              "value": "universitet",
              "label": "Universitet/Högskola"
            },
            {
              "value": "forskargrad",
              "label": "Forskargrad"
            }
          ],
          "defaultValue": "gymnasium"
        },
        {
          "id": "applicationReason",
          "label": "Ansökningsgrund",
          "type": "list",
          "options": [
            {
              "value": "ekonomi",
              "label": "Ekonomisk svårighet"
            },
            {
              "value": "arbete",
              "label": "Arbetslös"
            },
            {
              "value": "sjuk",
              "label": "Sjuk/arbetsoförmögen"
            },
            {
              "value": "familj",
              "label": "Familjesjäl"
            }
          ],
          "defaultValue": ""
        },
        {
          "id": "maritalStatus",
          "label": "Civilstatus",
          "type": "list",
          "options": [
            {
              "value": "ensam",
              "label": "Ensam"
            },
            {
              "value": "gift",
              "label": "Gift/Sambo"
            },
            {
              "value": "skild",
              "label": "Skild"
            }
          ],
          "defaultValue": "ensam"
        }
      ],
      "blocks": [
        {
          "id": "block-intro",
          "title": "Introduktion",
          "type": "locked",
          "placement": "fixed",
          "content": "<h1>Omfattande exempel-mall för Fred-systemet</h1><p>Detta är ett <strong>låst block</strong> som användaren <em>inte kan redigera</em>. Det innehåller introduktiv text från administratören. Blocket har en egen typografi (12,5 pt) som ersätter mallens standard (Georgia 11 pt).</p>",
          "order": 1,
          "style": {
            "fontSizePt": 12.5
          }
        },
        {
          "id": "block-personal-info",
          "title": "Personlig information",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Personlig information</h2>\n<p><strong>Namn:</strong> {{applicantName}}</p>\n<p><strong>Personnummer:</strong> {{personalNumber}}</p>\n<p><strong>Födelsedatum:</strong> {{birthDate}}</p>\n<p><strong>E-post:</strong> {{applicantEmail}}</p>\n<p><strong>Telefon:</strong> {{applicantPhone}}</p>\n<p><strong>Civilstatus:</strong> {{maritalStatus}}</p>",
          "order": 2
        },
        {
          "id": "block-education",
          "title": "Utbildning",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Utbildning och kompetens</h2>\n<p><strong>Utbildningsnivå:</strong> {{educationLevel}}</p>\n<p><strong>Studerar för närvarande:</strong> {{isStudent}}</p>\n<p><strong>Institution:</strong> {{studentInstitution}}</p>\n<p><strong>Utbildningsprogram:</strong> {{studyProgram}}</p>",
          "order": 3
        },
        {
          "id": "block-family",
          "title": "Familjesituation",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Familjesituation</h2>\n<p><strong>Har familj:</strong> {{hasFamily}}</p>\n<p><strong>Familjetyp:</strong> {{familyType}}</p>\n<p><strong>Antal barn:</strong> {{numberOfChildren}}</p>\n<p><strong>Barnens åldrar:</strong> {{childrenAges}}</p>",
          "order": 4,
          "visibleWhen": {
            "parameterId": "hasFamily",
            "equals": true
          }
        },
        {
          "id": "block-economy",
          "title": "Ekonomisk situation",
          "type": "editable",
          "placement": "fixed",
          "content": "<h2>Ekonomisk situation</h2>\n<p><strong>Månadsinkomst:</strong> {{income}} SEK</p>\n<p><strong>Månadskostnader:</strong> {{expenses}} SEK</p>\n<p><strong>Disponibel inkomst:</strong> {{disposableIncome}} SEK</p>\n<p>Beskriv din ekonomiska situation i detalj:</p>\n<p>{{economicDescription}}</p>",
          "order": 5
        },
        {
          "id": "block-reason",
          "title": "Ansökningsgrund",
          "type": "editable",
          "placement": "fixed",
          "content": "<h2>Grund för ansökan</h2>\n<p><strong>Ansökningsgrund:</strong> {{applicationReason}}</p>\n<p><strong>Ansökningsdatum:</strong> {{applicationDate}}</p>\n<p><strong>Startdatum:</strong> {{startDate}}</p>\n<p>Beskriv varför du ansöker:</p>\n<p>{{reasonDescription}}</p>",
          "order": 6
        },
        {
          "id": "block-documents",
          "title": "Bifogade dokument",
          "type": "editable",
          "placement": "free",
          "content": "<h3>Bifogat dokument</h3>\n<p><strong>Dokumenttyp:</strong> {{documentType}}</p>\n<p><strong>Beskrivning:</strong> {{documentDescription}}</p>",
          "order": 7
        },
        {
          "id": "block-additional",
          "title": "Ytterligare information",
          "type": "editable",
          "placement": "free",
          "content": "<h3>Tilläggsinformation</h3>\n<p>{{additionalInfo}}</p>",
          "order": 8
        },
        {
          "id": "block-confirmation",
          "title": "Bekräftelse",
          "type": "locked",
          "placement": "fixed",
          "content": "<h2>Bekräftelse</h2>\n<p><strong>Namn:</strong> {{applicantName}}</p>\n<p><strong>Godkänner villkoren:</strong> {{agreeToTerms}}</p>\n<p>Jag bekräftar att all information i denna ansökan är korrekt och sanningsenlig. Detta block är kursivt via blockets egen Stildefinition.</p>\n<p>Ansökan inlämnad: {{applicationDate}}</p>",
          "order": 9,
          "style": {
            "italic": true
          },
          "visibleWhen": {
            "parameterId": "agreeToTerms",
            "equals": true
          }
        }
      ],
      "createdAt": "2026-07-03T12:16:05.102537Z",
      "updatedAt": "2026-07-03T12:16:05.102537Z"
    }
  ]
} as unknown as ConfigFile;
