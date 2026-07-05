import { isBlockVisible } from "@fred/shared";
import { useEditorStore } from "../store";

export default function PhraseSidebar() {
  const session = useEditorStore((s) => s.session);
  const mall = useEditorStore((s) => (session ? s.templates[session.templateId] : undefined));
  const insertFreeBlock = useEditorStore((s) => s.insertFreeBlock);

  if (!session || !mall) return null;
  // Fraser vars synlighetsvillkor (kravspec V13) inte är uppfyllt kan inte infogas.
  const freeBlocks = mall.blocks.filter(
    (b) => b.placement === "free" && isBlockVisible(b, session.parameterValues)
  );

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Fraser att infoga</h3>
      {freeBlocks.length === 0 && <p className="muted">Mallen har inga fria fraser.</p>}
      {freeBlocks.map((block) => (
        <div key={block.id} className="template-item" style={{ display: "block" }}>
          <strong>{block.title}</strong>
          <p className="muted" style={{ fontSize: 12, margin: "4px 0" }}>
            {block.content.replace(/<[^>]+>/g, "").slice(0, 80)}
          </p>
          <button onClick={() => insertFreeBlock(block.id)}>+ Infoga</button>
        </div>
      ))}
    </div>
  );
}
