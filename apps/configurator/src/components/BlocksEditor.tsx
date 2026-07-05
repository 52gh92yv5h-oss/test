import {
  BlockPlacement,
  BlockType,
  ContentBlock,
  ParameterDef,
  ParameterValue,
  flattenParameters,
  newId,
} from "@fred/shared";
import StyleEditor from "./StyleEditor";

/**
 * Villkor mellan block (kravspec V13): blocket visas bara när den valda
 * parameterns värde matchar. Värdeväljaren anpassas efter parametertypen.
 */
function BlockConditionEditor({
  block,
  parameters,
  onPatch,
}: {
  block: ContentBlock;
  parameters: ParameterDef[];
  onPatch: (p: Partial<ContentBlock>) => void;
}) {
  const defs = flattenParameters(parameters);
  const cond = block.visibleWhen;
  const def = cond ? defs.find((d) => d.id === cond.parameterId) : undefined;

  const setEquals = (equals: ParameterValue) =>
    cond && onPatch({ visibleWhen: { ...cond, equals } });

  return (
    <div className="row" style={{ alignItems: "center" }}>
      <label style={{ fontWeight: 400 }}>Visas endast när:</label>
      <select
        value={cond?.parameterId ?? ""}
        onChange={(e) => {
          const parameterId = e.target.value;
          if (!parameterId) {
            // "visibleWhen: undefined" i patchen tar bort villkoret.
            onPatch({ visibleWhen: undefined });
            return;
          }
          const d = defs.find((x) => x.id === parameterId);
          const equals: ParameterValue =
            d?.type === "boolean" ? true : d?.type === "list" ? d.options?.[0]?.value ?? "" : "";
          onPatch({ visibleWhen: { parameterId, equals } });
        }}
      >
        <option value="">(visas alltid)</option>
        {defs.map((d) => (
          <option key={d.id} value={d.id}>{d.label}</option>
        ))}
      </select>
      {cond && def?.type === "boolean" && (
        <select value={String(cond.equals === true)} onChange={(e) => setEquals(e.target.value === "true")}>
          <option value="true">= Ja</option>
          <option value="false">= Nej</option>
        </select>
      )}
      {cond && def?.type === "list" && (
        <select value={String(cond.equals ?? "")} onChange={(e) => setEquals(e.target.value)}>
          {(def.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>= {o.label}</option>
          ))}
        </select>
      )}
      {cond && def && def.type !== "boolean" && def.type !== "list" && (
        <input
          type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"}
          placeholder="värde"
          value={cond.equals === null ? "" : String(cond.equals)}
          onChange={(e) =>
            setEquals(
              e.target.value === "" ? null : def.type === "number" ? Number(e.target.value) : e.target.value
            )
          }
        />
      )}
      {cond && !def && <span className="muted">Parametern finns inte längre – villkoret uppfylls aldrig.</span>}
    </div>
  );
}

interface Props {
  blocks: ContentBlock[];
  parameters: ParameterDef[];
  onChange: (blocks: ContentBlock[]) => void;
}

function newBlock(order: number): ContentBlock {
  return {
    id: newId("block"),
    title: "Nytt block",
    type: "editable",
    placement: "fixed",
    content: "",
    order,
  };
}

export default function BlocksEditor({ blocks, parameters, onChange }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const paramIds = flattenParameters(parameters).map((p) => p.id);

  const patch = (id: string, p: Partial<ContentBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[targetIdx];
    onChange(blocks.map((blk) => {
      if (blk.id === a.id) return { ...blk, order: b.order };
      if (blk.id === b.id) return { ...blk, order: a.order };
      return blk;
    }));
  };

  return (
    <div>
      {paramIds.length > 0 && (
        <p className="muted">
          Platshållare i innehållet: {paramIds.map((id) => `{{${id}}}`).join(", ")}
        </p>
      )}
      {sorted.map((block) => (
        <div className="block-card" key={block.id}>
          <div className="row">
            <div className="col">
              <label>Titel</label>
              <input type="text" value={block.title} onChange={(e) => patch(block.id, { title: e.target.value })} />
            </div>
            <div className="col">
              <label>Blocktyp</label>
              <select
                value={block.type}
                onChange={(e) => patch(block.id, { type: e.target.value as BlockType })}
              >
                <option value="editable">Redigerbart</option>
                <option value="locked">Låst</option>
              </select>
            </div>
            <div className="col">
              <label>Placering</label>
              <select
                value={block.placement}
                onChange={(e) => patch(block.id, { placement: e.target.value as BlockPlacement })}
              >
                <option value="fixed">Fast (i mallen från start)</option>
                <option value="free">Fri (fras, infogas av användaren)</option>
              </select>
            </div>
            <span className={`badge ${block.type}`}>{block.type === "locked" ? "Låst" : "Redigerbart"}</span>
            <span className={`badge ${block.placement === "free" ? "free" : ""}`}>
              {block.placement === "free" ? "Fri fras" : "Fast"}
            </span>
            {block.visibleWhen && <span className="badge">Villkorat</span>}
            {block.placement === "fixed" && (
              <>
                <button onClick={() => move(block.id, -1)} title="Flytta upp">↑</button>
                <button onClick={() => move(block.id, 1)} title="Flytta ner">↓</button>
              </>
            )}
            <button className="danger" onClick={() => remove(block.id)}>Ta bort</button>
          </div>
          <BlockConditionEditor
            block={block}
            parameters={parameters}
            onPatch={(p) => patch(block.id, p)}
          />
          <div className="col">
            <label>Typografi (ersätter mallens standard)</label>
            <StyleEditor
              value={block.style}
              onChange={(style) => patch(block.id, { style })}
              inheritLabel="(ärver mallens standard)"
            />
          </div>
          <div className="col">
            <label>Förhandsinnehåll</label>
            <textarea
              rows={4}
              value={block.content}
              onChange={(e) => patch(block.id, { content: e.target.value })}
            />
          </div>
        </div>
      ))}
      <button className="primary" onClick={() => onChange([...blocks, newBlock(blocks.length)])}>
        + Nytt block
      </button>
    </div>
  );
}
