import { useEffect } from "react";
import { useEditorStore } from "./store";
import StartScreen from "./components/StartScreen";
import DocumentScreen from "./components/DocumentScreen";

function parseLaunchParam() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("launch");
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function App() {
  const screen = useEditorStore((s) => s.screen);
  const setPendingLaunch = useEditorStore((s) => s.setPendingLaunch);

  useEffect(() => {
    const launch = parseLaunchParam();
    if (launch?.templateId) setPendingLaunch(launch);
  }, [setPendingLaunch]);

  return screen === "start" ? <StartScreen /> : <DocumentScreen />;
}
