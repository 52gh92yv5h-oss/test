import { StyleDef } from "@fred/shared";

export const FONT_STACKS: { label: string; value: string }[] = [
  { label: "Segoe UI (system)", value: '"Segoe UI", system-ui, -apple-system, sans-serif' },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

interface Props {
  value: StyleDef | undefined;
  onChange: (style: StyleDef | undefined) => void;
  /** Text som visas för tomt val, t.ex. "(ärver mallens standard)". */
  inheritLabel?: string;
}

/**
 * Redigerar en Stildefinition (kravspec 6.0): typsnitt, storlek (pt) samt
 * fet/kursiv/understruken. Tomt värde = ärvs från nivån ovanför.
 */
export default function StyleEditor({ value, onChange, inheritLabel }: Props) {
  const style = value ?? {};

  const patch = (p: Partial<StyleDef>) => {
    const next: StyleDef = { ...style, ...p };
    (Object.keys(next) as (keyof StyleDef)[]).forEach((k) => {
      if (next[k] === undefined) delete next[k];
    });
    onChange(Object.keys(next).length > 0 ? next : undefined);
  };

  return (
    <div className="row" style={{ alignItems: "center", gap: 8 }}>
      <select
        value={style.fontFamily ?? ""}
        onChange={(e) => patch({ fontFamily: e.target.value || undefined })}
        title="Typsnitt"
      >
        <option value="">{inheritLabel ?? "(ärvt typsnitt)"}</option>
        {FONT_STACKS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={6}
        max={72}
        step={0.5}
        style={{ width: 70 }}
        placeholder="pt"
        title="Storlek i punkter"
        value={style.fontSizePt ?? ""}
        onChange={(e) =>
          patch({ fontSizePt: e.target.value === "" ? undefined : Number(e.target.value) })
        }
      />
      <label style={{ fontWeight: 700 }} title="Fet">
        <input
          type="checkbox"
          checked={style.bold === true}
          onChange={(e) => patch({ bold: e.target.checked ? true : undefined })}
        />
        F
      </label>
      <label style={{ fontStyle: "italic" }} title="Kursiv">
        <input
          type="checkbox"
          checked={style.italic === true}
          onChange={(e) => patch({ italic: e.target.checked ? true : undefined })}
        />
        K
      </label>
      <label style={{ textDecoration: "underline" }} title="Understruken">
        <input
          type="checkbox"
          checked={style.underline === true}
          onChange={(e) => patch({ underline: e.target.checked ? true : undefined })}
        />
        U
      </label>
    </div>
  );
}
