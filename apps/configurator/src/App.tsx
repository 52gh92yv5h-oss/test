import { useState } from "react";
import {
  ConfigFile,
  FRED_CONFIG_FILE_MARKER,
  FRED_VERSION,
  openJsonFromLocalFile,
  saveJsonWithFeedback,
  showToast,
} from "@fred/shared";
import { toConfigFile, useConfiguratorStore } from "./store";
import { PREDEFINED_BUNDLE } from "./predefinedBundle";
import OrganisationsPanel from "./components/OrganisationsPanel";
import HierarchyPanel from "./components/HierarchyPanel";
import MallPanel from "./components/MallPanel";

type Tab = "organisationer" | "hierarki" | "mall";

export default function App() {
  const [tab, setTab] = useState<Tab>("mall");
  const organisations = useConfiguratorStore((s) => s.organisations);
  const hierarchy = useConfiguratorStore((s) => s.hierarchy);
  const mallar = useConfiguratorStore((s) => s.mallar);
  const loadConfig = useConfiguratorStore((s) => s.loadConfig);
  const newConfig = useConfiguratorStore((s) => s.newConfig);
  const mergeBundle = useConfiguratorStore((s) => s.mergeBundle);

  const handleOpen = async () => {
    const data = await openJsonFromLocalFile<ConfigFile>();
    if (!data) return;
    if (data.marker !== FRED_CONFIG_FILE_MARKER) {
      showToast("Filen är inte en Fred-konfigurationsfil.", { variant: "error" });
      return;
    }
    loadConfig(data);
    showToast(
      `Konfiguration inläst: ${data.organisations.length} organisationer, ${data.mallar.length} mallar`,
      { variant: "success" },
    );
  };

  const handleSave = () => {
    const payload = toConfigFile({ organisations, hierarchy, mallar });
    void saveJsonWithFeedback(payload, "fred-konfiguration.json", "Konfigurationen");
  };

  const handleAddBundle = () => {
    mergeBundle(PREDEFINED_BUNDLE);
    showToast("Sveriges myndighetsmallar tillagda i konfigurationen", { variant: "success" });
  };

  return (
    <div className="app-shell">
      <nav className="nav">
        <h1>
          Fred Konfigurator <span className="app-version">v{FRED_VERSION}</span>
        </h1>
        <div className="nav-config-actions">
          <button onClick={newConfig}>Ny konfiguration</button>
          <button onClick={handleOpen}>Öppna konfigurationsfil</button>
          <button className="primary-nav" onClick={handleSave}>Spara konfigurationsfil</button>
          <button onClick={handleAddBundle} title="Bakar in de fördefinierade svenska myndighetsmallarna i den aktuella konfigurationen">
            + Sveriges myndighetsmallar
          </button>
        </div>
        <button className={tab === "mall" ? "active" : ""} onClick={() => setTab("mall")}>
          Mallar ({mallar.length})
        </button>
        <button className={tab === "hierarki" ? "active" : ""} onClick={() => setTab("hierarki")}>
          Mallhierarki
        </button>
        <button
          className={tab === "organisationer" ? "active" : ""}
          onClick={() => setTab("organisationer")}
        >
          Organisationer ({organisations.length})
        </button>
      </nav>
      <main className="content">
        {tab === "organisationer" && <OrganisationsPanel />}
        {tab === "hierarki" && <HierarchyPanel />}
        {tab === "mall" && <MallPanel />}
      </main>
    </div>
  );
}
