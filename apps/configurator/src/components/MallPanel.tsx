import {
  FRED_MALL_FILE_MARKER,
  HeaderFooterField,
  MallFile,
  OrgScope,
  addTemplateToNode,
  flattenCategories,
  newId,
  openJsonFromLocalFile,
  saveJsonToLocalFile,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";
import ParametersEditor from "./ParametersEditor";
import BlocksEditor from "./BlocksEditor";

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
      {fields.map((f, i) => (
        <div className="row" key={f.id}>
          <select
            value={f.kind}
            onChange={(e) => {
              const next = [...fields];
              next[i] = { ...f, kind: e.target.value as HeaderFooterField["kind"] };
              onChange(next);
            }}
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
                onChange={(e) => {
                  const next = [...fields];
                  next[i] = { ...f, label: e.target.value };
                  onChange(next);
                }}
              />
              <input
                type="text"
                placeholder="Standardtext"
                value={f.defaultText ?? ""}
                onChange={(e) => {
                  const next = [...fields];
                  next[i] = { ...f, defaultText: e.target.value };
                  onChange(next);
                }}
              />
            </>
          )}
          <button className="danger" onClick={() => onChange(fields.filter((_, j) => j !== i))}>
            Ta bort
          </button>
        </div>
      ))}
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
    void saveJsonToLocalFile(payload, `${mall.id}.json`);
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
