import { useState } from "react";
import {
  CategoryNode,
  FRED_HIERARCHY_FILE_MARKER,
  HierarchyFile,
  addChildCategory,
  newId,
  openJsonFromLocalFile,
  removeCategory,
  renameCategory,
  saveJsonToLocalFile,
} from "@fred/shared";
import { useConfiguratorStore } from "../store";

function Node({ node, depth }: { node: CategoryNode; depth: number }) {
  const hierarchy = useConfiguratorStore((s) => s.hierarchy);
  const setHierarchy = useConfiguratorStore((s) => s.setHierarchy);
  const [childName, setChildName] = useState("");

  return (
    <div className="tree-node" style={{ marginLeft: depth === 0 ? 0 : 18 }}>
      <div className="row">
        <input
          type="text"
          value={node.name}
          onChange={(e) => setHierarchy(renameCategory(hierarchy, node.id, e.target.value))}
        />
        <span className="muted">{node.templateIds.length} mall(ar) placerade här</span>
        {node.id !== "root" && (
          <button
            className="danger"
            disabled={node.children.length > 0 || node.templateIds.length > 0}
            title="Kan bara tas bort om den är tom"
            onClick={() => setHierarchy(removeCategory(hierarchy, node.id))}
          >
            Ta bort
          </button>
        )}
      </div>
      <div className="row" style={{ marginLeft: 18 }}>
        <input
          type="text"
          placeholder="Ny underkategori"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
        />
        <button
          onClick={() => {
            if (!childName.trim()) return;
            setHierarchy(
              addChildCategory(hierarchy, node.id, {
                id: newId("cat"),
                name: childName.trim(),
                children: [],
                templateIds: [],
              })
            );
            setChildName("");
          }}
        >
          + Lägg till underkategori
        </button>
      </div>
      {node.children.map((child) => (
        <Node key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function HierarchyPanel() {
  const hierarchy = useConfiguratorStore((s) => s.hierarchy);
  const setHierarchy = useConfiguratorStore((s) => s.setHierarchy);

  const handleSave = () => {
    const payload: HierarchyFile = { marker: FRED_HIERARCHY_FILE_MARKER, version: 1, root: hierarchy };
    void saveJsonToLocalFile(payload, "hierarki.json");
  };

  const handleOpen = async () => {
    const data = await openJsonFromLocalFile<HierarchyFile>();
    if (data?.marker === FRED_HIERARCHY_FILE_MARKER) {
      setHierarchy(data.root);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={handleOpen}>Öppna hierarki.json</button>
        <button onClick={handleSave}>Spara hierarki.json</button>
      </div>
      <div className="panel">
        <h2>Mallhierarki</h2>
        <p className="muted">
          Hierarkin används enbart för navigering och val av mall i Fred Editor. Den påverkar
          inte dokumentets innehåll. En mall kan bara ligga på en plats i hierarkin (styrs i
          mall-fliken).
        </p>
        <Node node={hierarchy} depth={0} />
      </div>
    </div>
  );
}
