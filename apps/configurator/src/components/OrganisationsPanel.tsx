import { useRef } from "react";
import {
  Organisation,
  fileToDataUrl,
  newId,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";

export default function OrganisationsPanel() {
  const organisations = useConfiguratorStore((s) => s.organisations);
  const addOrganisation = useConfiguratorStore((s) => s.addOrganisation);
  const updateOrganisation = useConfiguratorStore((s) => s.updateOrganisation);
  const removeOrganisation = useConfiguratorStore((s) => s.removeOrganisation);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleLogoChange = async (org: Organisation, file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateOrganisation(org.id, { logoDataUrl: dataUrl });
  };

  return (
    <div>
      <div className="toolbar">
        <button className="primary" onClick={() => addOrganisation({ id: newId("org"), name: "Ny organisation" })}>
          + Ny organisation
        </button>
      </div>

      <div className="panel">
        <h2>Organisationer ({organisations.length})</h2>
        <p className="muted">
          Fred stödjer flera organisationer. Varje organisation har ett namn och en valfri
          logotyp som kan användas i sidhuvud/sidfot.
        </p>
        {organisations.map((org) => (
          <div key={org.id} className="block-card">
            <div className="row">
              <div className="col">
                <label>Organisations-ID</label>
                <input type="text" value={org.id} readOnly style={{ width: 220, color: "#888" }} />
              </div>
              <div className="col">
                <label>Namn</label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => updateOrganisation(org.id, { name: e.target.value })}
                />
              </div>
              <div className="col">
                <label>Logotyp</label>
                <input
                  ref={(el) => { fileInputs.current[org.id] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoChange(org, e.target.files?.[0])}
                />
              </div>
              {org.logoDataUrl && <img className="logo-preview" src={org.logoDataUrl} alt={org.name} />}
              <button className="danger" onClick={() => removeOrganisation(org.id)}>
                Ta bort
              </button>
            </div>
          </div>
        ))}
        {organisations.length === 0 && <p className="muted">Inga organisationer ännu.</p>}
      </div>
    </div>
  );
}
