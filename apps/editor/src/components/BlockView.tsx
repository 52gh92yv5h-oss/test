import { useEffect, useRef } from "react";
import { ContentBlock, ParameterValue, contentToChipHtml, styleDefToCss, updateChipValues } from "@fred/shared";
import { useEditorStore } from "../store";

function ToolbarButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EditableToolbar({ onInsertPageBreak }: { onInsertPageBreak: () => void }) {
  const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);
  return (
    <div className="fred-block-toolbar">
      <ToolbarButton label="B" title="Fet" onClick={() => exec("bold")} />
      <ToolbarButton label="I" title="Kursiv" onClick={() => exec("italic")} />
      <ToolbarButton label="U" title="Understruken" onClick={() => exec("underline")} />
      <ToolbarButton label="H2" title="Rubrik" onClick={() => exec("formatBlock", "H2")} />
      <ToolbarButton label="H3" title="Underrubrik" onClick={() => exec("formatBlock", "H3")} />
      <ToolbarButton label="¶" title="Brödtext" onClick={() => exec("formatBlock", "P")} />
      <ToolbarButton label="• Lista" title="Punktlista" onClick={() => exec("insertUnorderedList")} />
      <ToolbarButton label="⤓ Sidbrytning" title="Infoga sidbrytning" onClick={onInsertPageBreak} />
    </div>
  );
}

export default function BlockView({
  instanceId,
  block,
  isFirst,
  isLast,
}: {
  instanceId: string;
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
}) {
  const parameters = useEditorStore((s) => s.templates[s.session?.templateId ?? ""]?.parameters ?? []);
  const parameterValues = useEditorStore((s) => s.session?.parameterValues ?? ({} as Record<string, ParameterValue>));
  const setUserContent = useEditorStore((s) => s.setUserContent);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const removeUsedBlock = useEditorStore((s) => s.removeUsedBlock);
  const moveUsedBlock = useEditorStore((s) => s.moveUsedBlock);
  const ref = useRef<HTMLDivElement>(null);
  const committedForCurrentEdit = useRef(false);

  // Redigerbara block är medvetet "okontrollerade": DOM:en sätts en gång vid
  // montering och äger sedan sig själv, annars nollställer varje omrendering
  // markörens position mitt i inmatning (kända React+contentEditable-problemet).
  useEffect(() => {
    if (block.type === "editable" && ref.current) {
      ref.current.innerHTML = useEditorStore.getState().session?.userContent[instanceId] ?? "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, block.type]);

  useEffect(() => {
    if (block.type === "editable" && ref.current) {
      updateChipValues(ref.current, parameterValues, parameters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameterValues, parameters, block.type]);

  const handleInput = () => {
    if (!ref.current) return;
    if (!committedForCurrentEdit.current) {
      commitHistory();
      committedForCurrentEdit.current = true;
    }
    setUserContent(instanceId, ref.current.innerHTML);
  };

  const handleBlur = () => {
    committedForCurrentEdit.current = false;
  };

  const insertPageBreak = () => {
    document.execCommand(
      "insertHTML",
      false,
      '<div class="page-break" contenteditable="false">&nbsp;</div><p><br></p>'
    );
    handleInput();
  };

  const canRemove = block.placement === "free";

  // Blockets typografi; oangivna attribut ärvs via CSS från dokumentets
  // defaultStyle (satt på .document-page). Användarens inline-formatering
  // (execCommand) ligger i inner-HTML och vinner över detta.
  const blockCss = styleDefToCss(block.style);

  return (
    <div className={`fred-block ${block.type}`}>
      <div className="fred-block-actions">
        {!isFirst && <button onClick={() => moveUsedBlock(instanceId, -1)} title="Flytta upp">↑</button>}
        {!isLast && <button onClick={() => moveUsedBlock(instanceId, 1)} title="Flytta ner">↓</button>}
        {canRemove && (
          <button className="danger" onClick={() => removeUsedBlock(instanceId)} title="Ta bort">
            ✕
          </button>
        )}
      </div>
      <div className="fred-block-label">
        {block.title} {block.type === "locked" && "· låst"}
      </div>
      {block.type === "locked" ? (
        <div
          className="fred-block-content"
          style={blockCss}
          // Chips även i låsta block så att inline-parameterläget kan
          // redigera värden överallt i dokumentet (kravspec 2.2, V11).
          dangerouslySetInnerHTML={{ __html: contentToChipHtml(block.content, parameterValues, parameters) }}
        />
      ) : (
        <>
          <EditableToolbar onInsertPageBreak={insertPageBreak} />
          <div
            ref={ref}
            className="fred-block-content"
            style={blockCss}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={handleBlur}
          />
        </>
      )}
    </div>
  );
}
