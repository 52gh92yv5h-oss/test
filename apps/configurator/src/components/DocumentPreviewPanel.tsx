import { useEffect, useRef, useState } from "react";
import {
  ContentBlock,
  HFCol,
  HFRow,
  HeaderFooterField,
  Mall,
  Organisation,
  ParameterDef,
  ParameterValue,
  buildParentMap,
  contentToChipHtml,
  defaultValuesFrom,
  isBlockVisible,
  isParameterVisible,
  newId,
  styleDefToCss,
  updateChipValues,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";

const COLS: HFCol[] = ["left", "center", "right"];
const ROWS: HFRow[] = ["top", "middle", "bottom"];

/** Sidhuvud/sidfot i 3x3-matrisen – samma rendering som Fred Editor. */
function HeaderFooterStrip({
  fields,
  organisation,
  as,
}: {
  fields: HeaderFooterField[];
  organisation: Organisation | undefined;
  as: "header" | "footer";
}) {
  if (fields.length === 0) return null;
  const renderField = (field: HeaderFooterField) => {
    const css = styleDefToCss(field.style);
    if (field.kind === "logo") {
      return organisation?.logoDataUrl ? (
        <img key={field.id} src={organisation.logoDataUrl} alt={organisation.name} />
      ) : (
        <span key={field.id} className="muted">(logotyp saknas)</span>
      );
    }
    if (field.kind === "organisation") {
      return (
        <span key={field.id} style={css}>{organisation?.name ?? "(organisation)"}</span>
      );
    }
    return (
      <span key={field.id} style={css}>{field.defaultText || field.label || "Text"}</span>
    );
  };
  const cellFields = (col: HFCol, row: HFRow) =>
    fields.filter((f) => (f.position?.col ?? "left") === col && (f.position?.row ?? "middle") === row);
  return (
    <div className={`${as === "header" ? "doc-header" : "doc-footer"} hf-grid`}>
      {ROWS.map((row) =>
        COLS.map((col) => (
          <div key={`${row}-${col}`} className={`hf-cell hf-${col}`}>
            {cellFields(col, row).map(renderField)}
          </div>
        )),
      )}
    </div>
  );
}

/** Ett block i dokumentet. Redigerbara block går att skriva i (testläge). */
function PreviewBlock({
  block,
  values,
  parameters,
  onRemove,
}: {
  block: ContentBlock;
  values: Record<string, ParameterValue>;
  parameters: ParameterDef[];
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const blockCss = styleDefToCss(block.style);

  // Samma mönster som editorns BlockView: redigerbara block är okontrollerade
  // (DOM:en sätts vid montering) så att markören inte hoppar vid skrivning;
  // parametervärden speglas in i chipparna när de ändras i testpanelen.
  useEffect(() => {
    if (block.type === "editable" && ref.current) {
      ref.current.innerHTML = contentToChipHtml(block.content, values, parameters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (block.type === "editable" && ref.current) {
      updateChipValues(ref.current, values, parameters);
    }
  }, [values, parameters, block.type]);

  return (
    <div className={`fred-block ${block.type}`}>
      {onRemove && (
        <div className="fred-block-actions">
          <button className="danger" onClick={onRemove} title="Ta bort infogad fras">✕</button>
        </div>
      )}
      <div className="fred-block-label">
        {block.title} {block.type === "locked" && "· låst"}{block.placement === "free" && " · fras"}
      </div>
      {block.type === "locked" ? (
        <div
          className="fred-block-content"
          style={blockCss}
          dangerouslySetInnerHTML={{ __html: contentToChipHtml(block.content, values, parameters) }}
        />
      ) : (
        <div ref={ref} className="fred-block-content" style={blockCss} contentEditable suppressContentEditableWarning />
      )}
    </div>
  );
}

/** Parametrar i testpanelen, med nästlade villkor precis som i editorn. */
function TestParamRow({
  def,
  depth,
  values,
  parentMap,
  onChange,
}: {
  def: ParameterDef;
  depth: number;
  values: Record<string, ParameterValue>;
  parentMap: Map<string, ParameterDef>;
  onChange: (id: string, v: ParameterValue) => void;
}) {
  const parent = parentMap.get(def.id);
  if (!isParameterVisible(def, parent, values)) return null;
  const value = values[def.id] ?? null;
  let input;
  if (def.type === "boolean") {
    input = (
      <select value={String(Boolean(value))} onChange={(e) => onChange(def.id, e.target.value === "true")}>
        <option value="false">Nej</option>
        <option value="true">Ja</option>
      </select>
    );
  } else if (def.type === "list") {
    input = (
      <select value={String(value ?? "")} onChange={(e) => onChange(def.id, e.target.value)}>
        <option value="">(välj)</option>
        {(def.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (def.type === "number") {
    input = (
      <input
        type="number"
        value={value === null ? "" : Number(value)}
        onChange={(e) => onChange(def.id, e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  } else if (def.type === "date") {
    input = <input type="date" value={String(value ?? "")} onChange={(e) => onChange(def.id, e.target.value)} />;
  } else {
    input = <input type="text" value={String(value ?? "")} onChange={(e) => onChange(def.id, e.target.value)} />;
  }
  return (
    <div style={{ marginLeft: depth * 14, marginBottom: 8 }}>
      <label style={{ display: "block" }}>{def.label}</label>
      {input}
      {def.children?.map((child) => (
        <TestParamRow key={child.id} def={child} depth={depth + 1} values={values} parentMap={parentMap} onChange={onChange} />
      ))}
    </div>
  );
}

function orgAllowed(mall: Mall, org: Organisation): boolean {
  const scope = mall.orgScope;
  if (scope.mode === "all") return true;
  if (scope.mode === "specific") return scope.organisationId === org.id;
  return scope.organisationIds.includes(org.id);
}

/**
 * Visuell dokumentvy (WYSIWYG): visar den valda mallen som färdigt dokument
 * och låter administratören testa den – fylla i parametrar (med nästlade
 * villkor), skriva i redigerbara block och infoga fraser – utan att lämna
 * Konfiguratorn. Uppdateras direkt när mallen ändras i Mallar-fliken.
 */
export default function DocumentPreviewPanel() {
  const mall = useConfiguratorStore(
    (s) => s.mallar.find((m) => m.id === s.selectedMallId) ?? null
  );
  const organisations = useConfiguratorStore((s) => s.organisations);

  const [values, setValues] = useState<Record<string, ParameterValue>>({});
  const [freeInstances, setFreeInstances] = useState<{ instanceId: string; blockId: string }[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mallId, setMallId] = useState<string | null>(null);

  // Nollställ testläget när en annan mall väljs.
  useEffect(() => {
    if (!mall || mall.id === mallId) return;
    setMallId(mall.id);
    setValues(defaultValuesFrom(mall.parameters));
    setFreeInstances([]);
    setOrgId(null);
  }, [mall, mallId]);

  if (!mall) {
    return (
      <div className="panel">
        <h2>Dokumentvy</h2>
        <p className="muted">Välj eller skapa en mall i fliken Mallar för att se och testa den här.</p>
      </div>
    );
  }

  const eligible = organisations.filter((o) => orgAllowed(mall, o));
  const organisation = eligible.find((o) => o.id === orgId) ?? eligible[0];
  const parentMap = buildParentMap(mall.parameters);

  // Villkor mellan block (kravspec V13): block och fraser vars villkor inte
  // uppfylls av testvärdena döljs – precis som i Fred Editor.
  const fixedBlocks = mall.blocks
    .filter((b) => b.placement === "fixed" && isBlockVisible(b, values))
    .sort((a, b) => a.order - b.order);
  const freeBlocks = mall.blocks.filter((b) => b.placement === "free" && isBlockVisible(b, values));

  const reset = () => {
    setValues(defaultValuesFrom(mall.parameters));
    setFreeInstances([]);
  };

  const setValue = (id: string, v: ParameterValue) => setValues((s) => ({ ...s, [id]: v }));

  return (
    <div className="doc-preview-layout">
      <div className="doc-preview-scroll">
        {/* Nyckeln gör att dokumentet ritas om från mallen vid varje
            mall-ändring – testvärdena behålls i panelen intill. */}
        <div className="document-page" style={styleDefToCss(mall.defaultStyle)} key={`${mall.id}:${mall.updatedAt}`}>
          <HeaderFooterStrip fields={mall.headerFooter.headerFields} organisation={organisation} as="header" />
          {fixedBlocks.map((block) => (
            <PreviewBlock key={block.id} block={block} values={values} parameters={mall.parameters} />
          ))}
          {freeInstances.map(({ instanceId, blockId }) => {
            const block = mall.blocks.find((b) => b.id === blockId);
            if (!block || !isBlockVisible(block, values)) return null;
            return (
              <PreviewBlock
                key={instanceId}
                block={block}
                values={values}
                parameters={mall.parameters}
                onRemove={() => setFreeInstances((s) => s.filter((f) => f.instanceId !== instanceId))}
              />
            );
          })}
          {fixedBlocks.length === 0 && freeInstances.length === 0 && (
            <p className="muted">Mallen har inga fasta block ännu. Lägg till block i fliken Mallar.</p>
          )}
          <HeaderFooterStrip fields={mall.headerFooter.footerFields} organisation={organisation} as="footer" />
        </div>
      </div>

      <div className="doc-preview-side">
        <div className="panel">
          <h2>Testa mallen</h2>
          <p className="muted">
            Så här ser dokumentet ut i Fred Editor. Fyll i parametrar, skriv i
            redigerbara block och infoga fraser – testet påverkar inte mallen.
          </p>
          <button onClick={reset}>↺ Återställ test</button>
        </div>

        {eligible.length > 0 && (
          <div className="panel">
            <h2>Organisation</h2>
            <select value={organisation?.id ?? ""} onChange={(e) => setOrgId(e.target.value)}>
              {eligible.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="panel">
          <h2>Parametrar</h2>
          {mall.parameters.map((def) => (
            <TestParamRow key={def.id} def={def} depth={0} values={values} parentMap={parentMap} onChange={setValue} />
          ))}
          {mall.parameters.length === 0 && <p className="muted">Mallen har inga parametrar.</p>}
        </div>

        <div className="panel">
          <h2>Fraser (fria block)</h2>
          {freeBlocks.map((block) => (
            <button
              key={block.id}
              style={{ display: "block", marginBottom: 6 }}
              onClick={() => setFreeInstances((s) => [...s, { instanceId: newId("test"), blockId: block.id }])}
            >
              + {block.title}
            </button>
          ))}
          {freeBlocks.length === 0 && <p className="muted">Mallen har inga fria block.</p>}
        </div>
      </div>
    </div>
  );
}
