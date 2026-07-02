import { HeaderFooterField, Organisation } from "@fred/shared";
import { useEditorStore } from "../store";

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

  return (
    <div className={as === "header" ? "doc-header" : "doc-footer"}>
      {fields.map((field) => {
        if (field.kind === "logo") {
          return organisation?.logoDataUrl ? (
            <img key={field.id} src={organisation.logoDataUrl} alt={organisation.name} />
          ) : (
            <span key={field.id} className="muted">(logotyp saknas)</span>
          );
        }
        if (field.kind === "organisation") {
          return <span key={field.id}>{organisation?.name ?? "(organisation)"}</span>;
        }
        return (
          <input
            key={field.id}
            type="text"
            placeholder={field.label ?? "Text"}
            value={values[field.id] ?? ""}
            onChange={(e) => setHeaderFooterText(field.id, e.target.value)}
          />
        );
      })}
    </div>
  );
}
