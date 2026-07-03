import { useState } from "react";
import {
  HFCol,
  HFRow,
  HeaderFooterField,
  Mall,
  Organisation,
  styleDefToCss,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";

const COLS: HFCol[] = ["left", "center", "right"];
const ROWS: HFRow[] = ["top", "middle", "bottom"];

/** Samma organisationsfilter som editorn använder vid mallval. */
function orgAllowedForMall(mall: Mall, org: Organisation): boolean {
  if (mall.orgScope.mode === "all") return true;
  if (mall.orgScope.mode === "specific") return mall.orgScope.organisationId === org.id;
  return mall.orgScope.organisationIds.includes(org.id);
}

function PreviewStrip({
  fields,
  organisation,
  mall,
  as,
}: {
  fields: HeaderFooterField[];
  organisation: Organisation | undefined;
  mall: Mall;
  as: "header" | "footer";
}) {
  const renderField = (field: HeaderFooterField) => {
    // Fältets stil med mallens standard som fallback – exakt som editorn
    // renderar dokumentet (arv enligt kravspec 6.0).
    const css = styleDefToCss(field.style, mall.defaultStyle);
    if (field.kind === "logo") {
      return organisation?.logoDataUrl ? (
        <img key={field.id} src={organisation.logoDataUrl} alt={organisation.name} />
      ) : (
        <span key={field.id} className="hf-preview-placeholder">(logotyp)</span>
      );
    }
    if (field.kind === "organisation") {
      return (
        <span key={field.id} style={css}>
          {organisation?.name ?? "(organisationsnamn)"}
        </span>
      );
    }
    return field.defaultText ? (
      <span key={field.id} style={css}>{field.defaultText}</span>
    ) : (
      <span key={field.id} className="hf-preview-placeholder" style={css}>
        {field.label || "Textfält"}
      </span>
    );
  };

  const cellFields = (col: HFCol, row: HFRow) =>
    fields.filter(
      (f) => (f.position?.col ?? "left") === col && (f.position?.row ?? "middle") === row,
    );

  return (
    <div className={`hf-grid hf-preview-${as}`}>
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

/**
 * Visar live hur sidhuvud och sidfot kommer att se ut i det färdiga
 * dokumentet: 3x3-matrisen, logotyp, organisationsnamn och typografi.
 * Uppdateras direkt när fält, positioner eller stilar ändras.
 */
export default function HeaderFooterPreview() {
  const mall = useConfiguratorStore((s) => s.mall);
  const organisations = useConfiguratorStore((s) => s.organisations);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const eligible = organisations.filter((o) => orgAllowedForMall(mall, o));
  const organisation =
    eligible.find((o) => o.id === selectedOrgId) ?? eligible[0];

  const hasFields =
    mall.headerFooter.headerFields.length > 0 || mall.headerFooter.footerFields.length > 0;

  return (
    <div className="hf-preview">
      <div className="row" style={{ alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontWeight: 600 }}>Förhandsgranskning</label>
        {eligible.length > 1 && (
          <select
            value={organisation?.id ?? ""}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            title="Organisation som förhandsgranskningen visar"
          >
            {eligible.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        {eligible.length === 0 && (
          <span className="muted">Skapa en organisation för att se logotyp och namn.</span>
        )}
      </div>
      {hasFields ? (
        <div className="hf-preview-page">
          <PreviewStrip
            fields={mall.headerFooter.headerFields}
            organisation={organisation}
            mall={mall}
            as="header"
          />
          <div className="hf-preview-body" style={styleDefToCss(mall.defaultStyle)}>
            <p>Dokumentets innehåll …</p>
            <p>Så här placeras sidhuvudets och sidfotens fält i 3×3-matrisen, med mallens typografi.</p>
          </div>
          <PreviewStrip
            fields={mall.headerFooter.footerFields}
            organisation={organisation}
            mall={mall}
            as="footer"
          />
        </div>
      ) : (
        <p className="muted">Lägg till fält i sidhuvud eller sidfot för att se förhandsgranskningen.</p>
      )}
    </div>
  );
}
