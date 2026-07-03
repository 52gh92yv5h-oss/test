import { HFCol, HFRow, HeaderFooterField, Organisation, styleDefToCss } from "@fred/shared";
import { useEditorStore } from "../store";

const COLS: HFCol[] = ["left", "center", "right"];
const ROWS: HFRow[] = ["top", "middle", "bottom"];

export default function HeaderFooterView({
  fields,
  organisation,
  as,
}: {
  fields: HeaderFooterField[];
  organisation: Organisation | undefined;
  as: "header" | "footer";
}) {
  const values = useEditorStore((s) => s.session?.headerFooterValues ?? {});
  const setHeaderFooterText = useEditorStore((s) => s.setHeaderFooterText);

  if (fields.length === 0) return null;

  const renderField = (field: HeaderFooterField) => {
    // Fältets egen stil; oangivna attribut ärvs via CSS från dokumentets
    // defaultStyle (satt på .document-page).
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
        <span key={field.id} style={css}>
          {organisation?.name ?? "(organisation)"}
        </span>
      );
    }
    return (
      <input
        key={field.id}
        type="text"
        style={css}
        placeholder={field.label ?? "Text"}
        value={values[field.id] ?? ""}
        onChange={(e) => setHeaderFooterText(field.id, e.target.value)}
      />
    );
  };

  // 3x3-matris enligt kravspec 2.1: fält utan position hamnar i vänster/mitt,
  // fält i samma cell staplas i listordning.
  const cellFields = (col: HFCol, row: HFRow) =>
    fields.filter(
      (f) => (f.position?.col ?? "left") === col && (f.position?.row ?? "middle") === row,
    );

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
