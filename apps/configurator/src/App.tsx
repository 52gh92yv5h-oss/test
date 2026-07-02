import { useState } from "react";
import OrganisationsPanel from "./components/OrganisationsPanel";
import HierarchyPanel from "./components/HierarchyPanel";
import MallPanel from "./components/MallPanel";

type Tab = "organisationer" | "hierarki" | "mall";

export default function App() {
  const [tab, setTab] = useState<Tab>("mall");

  return (
    <div className="app-shell">
      <nav className="nav">
        <h1>Fred Konfigurator</h1>
        <button className={tab === "mall" ? "active" : ""} onClick={() => setTab("mall")}>
          Mall
        </button>
        <button className={tab === "hierarki" ? "active" : ""} onClick={() => setTab("hierarki")}>
          Mallhierarki
        </button>
        <button
          className={tab === "organisationer" ? "active" : ""}
          onClick={() => setTab("organisationer")}
        >
          Organisationer
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
