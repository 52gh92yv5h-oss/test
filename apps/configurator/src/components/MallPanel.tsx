import {
  FRED_MALL_FILE_MARKER,
  HFCol,
  HFRow,
  HeaderFooterField,
  MallFile,
  OrgScope,
  addTemplateToNode,
  flattenCategories,
  newId,
  openJsonFromLocalFile,
  saveJsonWithFeedback,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";
import ParametersEditor from "./ParametersEditor";
import BlocksEditor from "./BlocksEditor";
import StyleEditor from "./StyleEditor";
import HeaderFooterPreview from "./HeaderFooterPreview";

const HF_COLS: { value: HFCol; label: string }[] = [
  { value: "left", label: "Vänster" },
  { value: "center", label: "Mitten" },
  { value: "right", label: "Höger" },
];

const HF_ROWS: { value: HFRow; label: string }[] = [
  { value: "top", label: "Topp" },
  { value: "middle", label: "Mitt" },
  { value: "bottom", label: "Botten" },
];

function HeaderFooterFieldsEditor({
  title,
  fields,
  onChange,
}: {
  title: string;
  fields: HeaderFooterField[];
  onChange: (fields: HeaderFooterField[]) => void;
}) {
  return (
    <div className="col">
      <label>{title}</label>
      {fields.map((f, i) => {
        const patchField = (p: Partial<HeaderFooterField>) => {
          const next = [...fields];
          next[i] = { ...f, ...p };
          onChange(next);
        };
        return (
          <div className="block-card" key={f.id}>
            <div className="row">
              <select
                value={f.kind}
                onChange={(e) => patchField({ kind: e.target.value as HeaderFooterField["kind"] })}
              >
                <option value="logo">Logotyp (organisation)</option>
                <option value="organisation">Organisationsnamn</option>
                <option value="text">Valfri text</option>
              </select>
              {f.kind === "text" && (
                <>
                  <input
                    type="text"
                    placeholder="Etikett"
                    value={f.label ?? ""}
                    onChange={(e) => patchField({ label: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Standardtext"
                    value={f.defaultText ?? ""}
                    onChange={(e) => patchField({ defaultText: e.target.value })}
                  />
                </>
              )}
              <button className="danger" onClick={() => onChange(fields.filter((_, j) => j !== i))}>
                Ta bort
              </button>
            </div>
            <div className="row" style={{ alignItems: "center" }}>
              <label style={{ fontWeight: 400 }}>Position:</label>
              <select
                value={f.position?.col ?? "left"}
                title="Kolumn i 3x3-matrisen"
                onChange={(e) =>
                  patchField({
                    position: { col: e.target.value as HFCol, row: f.position?.row ?? "middle" },
                  })
                }
              >
                {HF_COLS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={f.position?.row ?? "middle"}
                title="Rad i 3x3-matrisen"
                onChange={(e) =>
                  patchField({
                    position: { col: f.position?.col ?? "left", row: e.target.value as HFRow },
                  })
                }
              >
                {HF_ROWS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <StyleEditor
                value={f.style}
                onChange={(style) => patchField({ style })}
                inheritLabel="(ärver mallens standard)"
              />
            </div>
          </div>
        );
      })}
      <button
        className="subtle"
        onClick={() => onChange([...fields, { id: newId("field"), kind: "text" }])}
      >
        + Fält
      </button>
    </div>
  );
}

export default function MallPanel() {
  const mall = useConfiguratorStore((s) => s.mall);
  const updateMall = useConfiguratorStore((s) => s.updateMall);
  const setMall = useConfiguratorStore((s) => s.setMall);
  const resetMall = useConfiguratorStore((s) => s.resetMall);
  const organisations = useConfiguratorStore((s) => s.organisations);
  const hierarchy = useConfiguratorStore((s) => s.hierarchy);
  const setHierarchy = useConfiguratorStore((s) => s.setHierarchy);

  const categories = flattenCategories(hierarchy);

  const handleSave = () => {
    const payload: MallFile = { marker: FRED_MALL_FILE_MARKER, version: 1, mall };
    void saveJsonWithFeedback(payload, `${mall.id}.json`, "Mallen");
  };

  const handleOpen = async () => {
    const data = await openJsonFromLocalFile<MallFile>();
    if (data?.marker === FRED_MALL_FILE_MARKER) {
      setMall(data.mall);
    }
  };

  const orgScope: OrgScope = mall.orgScope;

  return (
    <div>
      <div className="toolbar">
        <button onClick={resetMall}>+ Ny mall</button>
        <button onClick={handleOpen}>Öppna mall.json</button>
        <button className="primary" onClick={handleSave}>Spara mall.json</button>
      </div>

      <div className="panel">
        <h2>Grunduppgifter</h2>
        <div className="row">
          <div className="col">
            <label>Mall-ID</label>
            <input type="text" value={mall.id} readOnly style={{ width: 220, color: "#888" }} />
          </div>
          <div className="col">
            <label>Namn</label>
            <input type="text" value={mall.name} onChange={(e) => updateMall({ name: e.target.value })} />
          </div>
        </div>
        <div className="col">
          <label>Beskrivning</label>
          <textarea
            rows={2}
            value={mall.description}
            onChange={(e) => updateMall({ description: e.target.value })}
          />
        </div>
        <div className="row">
          <div className="col">
            <label>Plats i hierarkin</label>
            <select
              value={mall.categoryId ?? ""}
              onChange={(e) => {
                const categoryId = e.target.value || null;
                updateMall({ categoryId });
                if (categoryId) {
                  setHierarchy(addTemplateToNode(hierarchy, categoryId, mall.id));
                }
              }}
            >
              <option value="">(ej placerad)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"  ".repeat(c.depth)}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col">
            <label>Organisationstillhörighet</label>
            <select
              value={orgScope.mode}
              onChange={(e) => {
                const mode = e.target.value as OrgScope["mode"];
                if (mode === "all") updateMall({ orgScope: { mode: "all" } });
                else if (mode === "specific")
                  updateMall({ orgScope: { mode: "specific", organisationId: organisations[0]?.id ?? "" } });
                else updateMall({ orgScope: { mode: "selected", organisationIds: [] } });
              }}
            >
              <option value="all">Alla organisationer</option>
              <option value="specific">En specifik organisation</option>
              <option value="selected">Utvalda organisationer</option>
            </select>
          </div>
          {orgScope.mode === "specific" && (
            <select
              value={orgScope.organisationId}
              onChange={(e) => updateMall({ orgScope: { mode: "specific", organisationId: e.target.value } })}
            >
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          {orgScope.mode === "selected" && (
            <div className="row">
              {organisations.map((o) => {
                const checked = orgScope.organisationIds.includes(o.id);
                return (
                  <label key={o.id} style={{ fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...orgScope.organisationIds, o.id]
                          : orgScope.organisationIds.filter((id) => id !== o.id);
                        updateMall({ orgScope: { mode: "selected", organisationIds: ids } });
                      }}
                    />
                    {o.name}
                  </label>
                );
              })}
              {organisations.length === 0 && <span className="muted">Skapa organisationer först.</span>}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>Typografi (standard för hela dokumentet)</h2>
        <p className="muted">
          Standardstil som ärvs av alla block och sidhuvud/sidfot-fält om de inte anger en egen stil.
        </p>
        <StyleEditor
          value={mall.defaultStyle}
          onChange={(defaultStyle) => updateMall({ defaultStyle })}
          inheritLabel="(systemets grundstil)"
        />
      </div>

      <div className="panel">
        <h2>Sidhuvud &amp; Sidfot</h2>
        <div className="row">
          <HeaderFooterFieldsEditor
            title="Sidhuvud"
            fields={mall.headerFooter.headerFields}
            onChange={(headerFields) =>
              updateMall({ headerFooter: { ...mall.headerFooter, headerFields } })
            }
          />
          <HeaderFooterFieldsEditor
            title="Sidfot"
            fields={mall.headerFooter.footerFields}
            onChange={(footerFields) =>
              updateMall({ headerFooter: { ...mall.headerFooter, footerFields } })
            }
          />
        </div>
        <HeaderFooterPreview />
      </div>

      <div className="panel">
        <h2>Parametrar</h2>
        <ParametersEditor
          parameters={mall.parameters}
          onChange={(parameters) => updateMall({ parameters })}
        />
      </div>

      <div className="panel">
        <h2>Innehållsblock &amp; Fraser</h2>
        <BlocksEditor
          blocks={mall.blocks}
          parameters={mall.parameters}
          onChange={(blocks) => updateMall({ blocks })}
        />
      </div>
    </div>
  );
}
