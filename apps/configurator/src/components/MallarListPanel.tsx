import { useConfiguratorStore } from "../store";

/**
 * Listar konfigurationens samtliga mallar (kravspec V12: allt i en fil).
 * Klick väljer mall för redigering; Ny/Duplicera/Ta bort hanterar listan.
 */
export default function MallarListPanel() {
  const mallar = useConfiguratorStore((s) => s.mallar);
  const selectedMallId = useConfiguratorStore((s) => s.selectedMallId);
  const selectMall = useConfiguratorStore((s) => s.selectMall);
  const addMall = useConfiguratorStore((s) => s.addMall);
  const duplicateMall = useConfiguratorStore((s) => s.duplicateMall);
  const removeMall = useConfiguratorStore((s) => s.removeMall);

  return (
    <div className="panel">
      <h2>Mallar i konfigurationen ({mallar.length})</h2>
      {mallar.length === 0 && (
        <p className="muted">
          Inga mallar ännu. Skapa en ny, öppna en konfigurationsfil eller
          lägg till Sveriges myndighetsmallar via knappen i sidomenyn.
        </p>
      )}
      {mallar.map((m) => (
        <div
          key={m.id}
          className={`template-list-item ${m.id === selectedMallId ? "selected" : ""}`}
          onClick={() => selectMall(m.id)}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{m.name}</strong>
            <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {m.description || m.id}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateMall(m.id);
            }}
            title="Duplicera mallen"
          >
            ⧉
          </button>
          <button
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              removeMall(m.id);
            }}
            title="Ta bort mallen ur konfigurationen"
          >
            ✕
          </button>
        </div>
      ))}
      <button className="primary" onClick={addMall} style={{ marginTop: 8 }}>
        + Ny mall
      </button>
    </div>
  );
}
