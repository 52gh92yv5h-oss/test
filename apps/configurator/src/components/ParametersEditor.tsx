import { ParameterDef, ParameterOption, ParameterType, ParameterValue, newId } from "@fred/shared";

interface Props {
  parameters: ParameterDef[];
  onChange: (params: ParameterDef[]) => void;
}

const TYPE_LABELS: Record<ParameterType, string> = {
  text: "Text",
  date: "Datum",
  number: "Numeriskt",
  boolean: "Ja/Nej",
  list: "Lista",
};

function newParameter(): ParameterDef {
  return { id: newId("param"), label: "Ny parameter", type: "text", defaultValue: "" };
}

function updateAt(list: ParameterDef[], index: number, patch: Partial<ParameterDef>): ParameterDef[] {
  return list.map((p, i) => (i === index ? { ...p, ...patch } : p));
}

function moveAt(list: ParameterDef[], index: number, dir: -1 | 1): ParameterDef[] {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function DefaultValueInput({ def, onChange }: { def: ParameterDef; onChange: (v: ParameterValue) => void }) {
  if (def.type === "boolean") {
    return (
      <select value={String(def.defaultValue ?? false)} onChange={(e) => onChange(e.target.value === "true")}>
        <option value="false">Nej</option>
        <option value="true">Ja</option>
      </select>
    );
  }
  if (def.type === "list") {
    return (
      <select value={String(def.defaultValue ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">(inget)</option>
        {(def.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (def.type === "number") {
    return (
      <input
        type="number"
        value={def.defaultValue === null || def.defaultValue === undefined ? "" : Number(def.defaultValue)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }
  if (def.type === "date") {
    return (
      <input
        type="date"
        value={String(def.defaultValue ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input type="text" value={String(def.defaultValue ?? "")} onChange={(e) => onChange(e.target.value)} />
  );
}

function OptionsEditor({ def, onChange }: { def: ParameterDef; onChange: (opts: ParameterOption[]) => void }) {
  const options = def.options ?? [];
  return (
    <div className="col">
      <label>Listalternativ</label>
      {options.map((opt, i) => (
        <div className="row" key={i}>
          <input
            type="text"
            placeholder="värde"
            value={opt.value}
            onChange={(e) => {
              const next = [...options];
              next[i] = { ...opt, value: e.target.value };
              onChange(next);
            }}
            style={{ width: 100 }}
          />
          <input
            type="text"
            placeholder="etikett"
            value={opt.label}
            onChange={(e) => {
              const next = [...options];
              next[i] = { ...opt, label: e.target.value };
              onChange(next);
            }}
            style={{ width: 140 }}
          />
          <button className="danger" onClick={() => onChange(options.filter((_, j) => j !== i))}>
            Ta bort
          </button>
        </div>
      ))}
      <button className="subtle" onClick={() => onChange([...options, { value: "", label: "" }])}>
        + Alternativ
      </button>
    </div>
  );
}

function ParameterNode({
  def,
  index,
  siblings,
  onChangeSiblings,
}: {
  def: ParameterDef;
  index: number;
  siblings: ParameterDef[];
  onChangeSiblings: (list: ParameterDef[]) => void;
}) {
  const patch = (p: Partial<ParameterDef>) => onChangeSiblings(updateAt(siblings, index, p));
  const remove = () => onChangeSiblings(siblings.filter((_, i) => i !== index));
  const move = (dir: -1 | 1) => onChangeSiblings(moveAt(siblings, index, dir));
  const children = def.children ?? [];

  const canHaveConditionalChildren = def.type === "boolean" || def.type === "list";

  return (
    <div className="param-card">
      <div className="row">
        <div className="col">
          <label>Parameter-ID</label>
          <input type="text" value={def.id} readOnly style={{ width: 160, color: "#888" }} />
        </div>
        <div className="col">
          <label>Etikett</label>
          <input type="text" value={def.label} onChange={(e) => patch({ label: e.target.value })} />
        </div>
        <div className="col">
          <label>Datatyp</label>
          <select
            value={def.type}
            onChange={(e) => patch({ type: e.target.value as ParameterType, defaultValue: null })}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <label>Standardvärde</label>
          <DefaultValueInput def={def} onChange={(v) => patch({ defaultValue: v })} />
        </div>
        <button onClick={() => move(-1)} title="Flytta upp">↑</button>
        <button onClick={() => move(1)} title="Flytta ner">↓</button>
        <button className="danger" onClick={remove}>Ta bort</button>
      </div>

      {def.type === "list" && <OptionsEditor def={def} onChange={(options) => patch({ options })} />}

      {children.length > 0 && (
        <div style={{ marginLeft: 24, marginTop: 8, borderLeft: "2px solid #e2e8f0", paddingLeft: 12 }}>
          <p className="muted">Underparametrar (visas villkorat på förälderns värde):</p>
          {children.map((child, i) => (
            <div key={child.id}>
              {canHaveConditionalChildren && (
                <div className="row" style={{ marginBottom: 4 }}>
                  <label style={{ marginRight: 4 }}>Visas när {def.label} =</label>
                  {def.type === "boolean" ? (
                    <select
                      value={String(child.showWhen ?? "")}
                      onChange={(e) => {
                        const next = [...children];
                        next[i] = { ...child, showWhen: e.target.value === "true" };
                        patch({ children: next });
                      }}
                    >
                      <option value="true">Ja</option>
                      <option value="false">Nej</option>
                    </select>
                  ) : (
                    <select
                      value={String(child.showWhen ?? "")}
                      onChange={(e) => {
                        const next = [...children];
                        next[i] = { ...child, showWhen: e.target.value };
                        patch({ children: next });
                      }}
                    >
                      {(def.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <ParameterNode
                def={child}
                index={i}
                siblings={children}
                onChangeSiblings={(list) => patch({ children: list })}
              />
            </div>
          ))}
        </div>
      )}

      <button className="subtle" onClick={() => patch({ children: [...children, newParameter()] })}>
        + Lägg till underparameter
      </button>
    </div>
  );
}

export default function ParametersEditor({ parameters, onChange }: Props) {
  return (
    <div>
      {parameters.map((def, i) => (
        <ParameterNode key={def.id} def={def} index={i} siblings={parameters} onChangeSiblings={onChange} />
      ))}
      <button className="primary" onClick={() => onChange([...parameters, newParameter()])}>
        + Ny parameter
      </button>
    </div>
  );
}
