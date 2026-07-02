import { BlockPlacement, BlockType, ContentBlock, ParameterDef, flattenParameters, newId } from "@fred/shared";

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
            {block.placement === "fixed" && (
              <>
                <button onClick={() => move(block.id, -1)} title="Flytta upp">↑</button>
                <button onClick={() => move(block.id, 1)} title="Flytta ner">↓</button>
              </>
            )}
            <button className="danger" onClick={() => remove(block.id)}>Ta bort</button>
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
