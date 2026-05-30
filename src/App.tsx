import { useEffect, useState } from "react";
import { CubeScene } from "./three/CubeScene.tsx";
import { TopBar } from "./ui/TopBar.tsx";
import { ControlDock } from "./ui/ControlDock.tsx";
import { MovesPanel } from "./ui/MovesPanel.tsx";
import { SnapshotDialog } from "./ui/SnapshotDialog.tsx";
import { parseToken } from "./cube/notation.ts";
import { useCube } from "./state/store.ts";

const MOVE_KEYS = new Set(["u", "d", "l", "r", "f", "b", "m", "e", "s", "x", "y", "z"]);

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " ") {
        e.preventDefault();
        const s = useCube.getState();
        if (s.active || s.queue.length) s.setPlaying(!s.playing);
        return;
      }

      const lower = e.key.toLowerCase();
      if (!MOVE_KEYS.has(lower)) return;
      const isRotation = lower === "x" || lower === "y" || lower === "z";
      let token = isRotation ? lower : lower.toUpperCase();
      if (e.shiftKey) token += "'";
      const move = parseToken(token);
      if (move) useCube.getState().enqueue([move], "manual");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export default function App() {
  const [pasteMode, setPasteMode] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  useKeyboard();

  return (
    <>
      <div id="scene">
        <CubeScene />
      </div>

      <div className="overlay">
        <TopBar />
        <ControlDock
          onPaste={() => setPasteMode((v) => !v)}
          pasteActive={pasteMode}
          onSnapshot={setSnapshot}
        />
      </div>

      <MovesPanel pasteMode={pasteMode} onClosePaste={() => setPasteMode(false)} />

      <div className="hint-toast">Drag a face to turn · drag the background to orbit · scroll to zoom</div>

      {snapshot && <SnapshotDialog dataUrl={snapshot} onClose={() => setSnapshot(null)} />}
    </>
  );
}
