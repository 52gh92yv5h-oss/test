import {
  ImportParametersFile,
  ParameterDef,
  ParameterValue,
  buildParentMap,
  isParameterVisible,
  openJsonFromLocalFile,
} from "@fred/shared";
import { useEditorStore } from "../store";

function ParamInput({ def, value, onChange }: { def: ParameterDef; value: ParameterValue; onChange: (v: ParameterValue) => void }) {
  if (def.type === "boolean") {
    return (
      <select value={String(Boolean(value))} onChange={(e) => onChange(e.target.value === "true")}>
        <option value="false">Nej</option>
        <option value="true">Ja</option>
      </select>
    );
  }
  if (def.type === "list") {
    return (
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">(välj)</option>
        {(def.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (def.type === "number") {
    return (
      <input
        type="number"
        value={value === null || value === undefined ? "" : Number(value)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }
  if (def.type === "date") {
    return <input type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input type="text" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
}

function ParamRow({
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

  return (
    <div style={{ marginLeft: depth * 14, marginBottom: 8 }}>
      <label style={{ display: "block" }}>{def.label}</label>
      <ParamInput def={def} value={values[def.id] ?? null} onChange={(v) => onChange(def.id, v)} />
      {def.children?.map((child) => (
        <ParamRow
          key={child.id}
          def={child}
          depth={depth + 1}
          values={values}
          parentMap={parentMap}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export default function ParameterPanel() {
  const session = useEditorStore((s) => s.session);
  const mall = useEditorStore((s) => (session ? s.templates[session.templateId] : undefined));
  const updateParameterValue = useEditorStore((s) => s.updateParameterValue);

  if (!session || !mall) return null;
  const parentMap = buildParentMap(mall.parameters);

  const handleImport = async () => {
    const data = await openJsonFromLocalFile<ImportParametersFile>();
    if (!data?.values) return;
    for (const [id, value] of Object.entries(data.values)) {
      updateParameterValue(id, value);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Parametrar</h3>
      <button className="subtle" onClick={handleImport}>Importera JSON-fil med värden</button>
      <hr />
      {mall.parameters.map((def) => (
        <ParamRow
          key={def.id}
          def={def}
          depth={0}
          values={session.parameterValues}
          parentMap={parentMap}
          onChange={updateParameterValue}
        />
      ))}
      {mall.parameters.length === 0 && <p className="muted">Mallen har inga parametrar.</p>}
    </div>
  );
}
