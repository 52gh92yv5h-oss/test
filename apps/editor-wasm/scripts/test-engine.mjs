// Funktionstest av fred-engine.wasm via samma ABI som webbläsaren använder.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(here, "../engine/target/wasm32-unknown-unknown/release/fred_engine.wasm");
const { instance } = await WebAssembly.instantiate(readFileSync(wasmPath), {});
const { memory, fred_alloc, fred_free, fred_cmd } = instance.exports;

const enc = new TextEncoder();
const dec = new TextDecoder();

function fred(req) {
  const bytes = enc.encode(JSON.stringify(req));
  const inPtr = fred_alloc(bytes.length);
  new Uint8Array(memory.buffer, inPtr, bytes.length).set(bytes);
  const outPtr = fred_cmd(inPtr, bytes.length);
  fred_free(inPtr, bytes.length);
  const len = new DataView(memory.buffer).getUint32(outPtr, true);
  const json = dec.decode(new Uint8Array(memory.buffer, outPtr + 4, len));
  fred_free(outPtr, 4 + len);
  return JSON.parse(json);
}

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}`, extra ?? "");
  }
}

const mall = {
  id: "mall-test",
  name: "Testmall",
  description: "",
  categoryId: null,
  orgScope: { mode: "all" },
  headerFooter: {
    headerFields: [
      { id: "hf-logo", kind: "logo" },
      { id: "hf-org", kind: "organisation" },
      { id: "hf-dnr", kind: "text", label: "Diarienummer", defaultText: "Dnr " },
    ],
    footerFields: [{ id: "ff-1", kind: "text", label: "Sidfot", defaultText: "Utskrivet från Fred" }],
  },
  parameters: [
    { id: "namn", label: "Namn", type: "text", defaultValue: null },
    { id: "datum", label: "Datum", type: "date" },
    {
      id: "beslut",
      label: "Beslut",
      type: "list",
      defaultValue: "bifall",
      options: [
        { value: "bifall", label: "Bifall" },
        { value: "avslag", label: "Avslag" },
      ],
      children: [{ id: "motiv", label: "Motivering vid avslag", type: "text", showWhen: "avslag" }],
    },
    { id: "brådskande", label: "Brådskande", type: "boolean", defaultValue: false },
  ],
  blocks: [
    { id: "b1", title: "Inledning", type: "locked", placement: "fixed", content: "<p>Beslut för {{namn}} den {{datum}}: {{beslut}}.</p>", order: 0 },
    { id: "b2", title: "Brödtext", type: "editable", placement: "fixed", content: "<p>Hej {{namn}}, ditt ärende är {{beslut}}. {{motiv}}</p>", order: 1 },
    { id: "b3", title: "Fras: Överklagan", type: "editable", placement: "free", content: "<p>Du kan överklaga, {{namn}}.</p>", order: 2 },
  ],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const orgs = [{ id: "org-1", name: "Testkommunen", logoDataUrl: "data:image/svg+xml;base64,PHN2Zy8+" }];

// --- ping & laddning ---
check("ping", fred({ cmd: "ping" }).ok);
check("load_organisations", fred({ cmd: "load_organisations", organisations: orgs }).ok);

// --- ny session ---
let r = fred({ cmd: "new_session", mall, organisationId: "org-1", now: "2026-07-03T10:00:00Z", seed: 12345, values: { namn: "Anna Andersson" } });
check("new_session ok", r.ok, r.error);
check("organisation löst", r.doc.organisation.name === "Testkommunen");
check("2 fasta block", r.doc.blocks.length === 2);
check("fras i fraslistan", r.doc.freePhrases.length === 1 && r.doc.freePhrases[0].blockId === "b3");
check("initialvärde från extern app", r.doc.params.find((p) => p.id === "namn").value === "Anna Andersson");
check("låst block innehåller inline-fält", r.doc.blocks[0].html.includes('data-param-id="namn"'));
check("redigerbart block innehåller inline-fält", r.doc.blocks[1].html.includes('data-param-id="beslut"'));
check("nästlad param dold (bifall)", r.doc.params.find((p) => p.id === "motiv").visible === false);
check("listvärde visas som etikett", r.doc.blocks[0].html.includes(">Bifall<"));
check("header: logo + org + text", r.doc.header.length === 3 && r.doc.header[1].text === "Testkommunen");

// --- global parameteruppdatering ---
r = fred({ cmd: "set_param", id: "beslut", value: "avslag", now: "2026-07-03T10:01:00Z" });
check("set_param ok", r.ok, r.error);
check("nästlad param synlig efter avslag", r.doc.params.find((p) => p.id === "motiv").visible === true);
check("låst block uppdaterat globalt", r.doc.blocks[0].html.includes(">Avslag<"));
check("canUndo", r.doc.canUndo === true);

// --- boolean-formatering ---
r = fred({ cmd: "set_param", id: "brådskande", value: true, now: "2026-07-03T10:02:00Z" });
check("boolean → Ja", r.doc.params.find((p) => p.id === "brådskande").display === "Ja");

// --- undo/redo ---
r = fred({ cmd: "undo" });
check("undo återställer boolean", r.doc.params.find((p) => p.id === "brådskande").value === false);
r = fred({ cmd: "redo" });
check("redo", r.doc.params.find((p) => p.id === "brådskande").value === true);

// --- infoga fras ---
r = fred({ cmd: "insert_free_block", blockId: "b3", now: "2026-07-03T10:03:00Z" });
check("fras infogad", r.ok && r.doc.blocks.length === 3, r.error);
check("insertedInstanceId", typeof r.insertedInstanceId === "string");
const frasId = r.insertedInstanceId;
check("frasens html har param", r.doc.blocks[2].html.includes('data-param-id="namn"'));

// --- flytta och ta bort ---
r = fred({ cmd: "move_block", instanceId: frasId, dir: -1, now: "2026-07-03T10:04:00Z" });
check("flyttad upp", r.doc.blocks[1].instanceId === frasId);
r = fred({ cmd: "remove_block", instanceId: frasId, now: "2026-07-03T10:05:00Z" });
check("borttagen", r.doc.blocks.length === 2);

// --- användartext + ersätt ---
const instans = r.doc.blocks[1].instanceId;
fred({ cmd: "set_user_content", instanceId: instans, html: '<p>Hej <span class="fred-cc" data-param-id="namn" contenteditable="false">Anna Andersson</span>, ditt ärende handläggs skyndsamt. Ärendet är viktigt.</p>', now: "2026-07-03T10:06:00Z" });
r = fred({ cmd: "replace_all", search: "ärende", replace: "mål", now: "2026-07-03T10:07:00Z" });
check("replace_all antal = 2", r.replacedCount === 2, r.replacedCount);
check("ersatt i text", r.doc.blocks[1].html.includes("mål"));
check("fältinnehåll orört av ersätt", r.doc.blocks[1].html.includes(">Anna Andersson<"));

// --- spara & återöppna ---
r = fred({ cmd: "save_session" });
check("save_session marker", r.file.marker === "fred-session" && r.file.version === 1);
check("session har parameterValues", r.file.session.parameterValues.beslut === "avslag");
const saved = r.file.session;
r = fred({ cmd: "open_session", mall, session: saved, seed: 999 });
check("open_session", r.ok && r.doc.blocks.length === 2, r.error);
check("värden kvar efter öppning", r.doc.params.find((p) => p.id === "namn").value === "Anna Andersson");

// --- felhantering ---
r = fred({ cmd: "open_session", mall, session: { ...saved, templateId: "annan" } });
check("fel mall avvisas", r.ok === false);
r = fred({ cmd: "nonsens" });
check("okänt kommando", r.ok === false);

console.log(failures === 0 ? "\nAlla motortester gick igenom." : `\n${failures} test misslyckades.`);
process.exit(failures ? 1 : 0);
