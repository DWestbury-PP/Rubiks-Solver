import { useState } from "react";
import { useCube } from "../state/store.ts";
import { captureCubeImage } from "../three/exportImage.ts";
import {
  CameraIcon,
  GearIcon,
  PasteIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  ShuffleIcon,
  UndoIcon,
  WandIcon,
} from "./icons.tsx";

export function ControlDock({
  onPaste,
  pasteActive,
  onSnapshot,
}: {
  onPaste: () => void;
  pasteActive: boolean;
  onSnapshot: (dataUrl: string) => void;
}) {
  const busy = useCube((s) => s.active !== null || s.queue.length > 0);
  const playing = useCube((s) => s.playing);
  const solved = useCube((s) => s.solved);
  const moveLogLen = useCube((s) => s.moveLog.length);
  const solverStatus = useCube((s) => s.solverStatus);

  const doScramble = useCube((s) => s.doScramble);
  const doSolve = useCube((s) => s.doSolve);
  const undo = useCube((s) => s.undo);
  const reset = useCube((s) => s.reset);
  const setPlaying = useCube((s) => s.setPlaying);

  const [showSettings, setShowSettings] = useState(false);

  const solving = solverStatus === "solving";

  const onSnap = () => {
    const url = captureCubeImage();
    if (url) onSnapshot(url);
  };

  return (
    <div className="dock-wrap">
      <div className="dock">
        <button className="btn" onClick={() => doScramble(25)} disabled={busy}>
          <ShuffleIcon />
          <span className="label">Scramble</span>
        </button>

        <button
          className="btn success"
          onClick={() => doSolve()}
          disabled={busy || solved || solving}
        >
          <WandIcon />
          <span className="label">{solving ? "Solving…" : "Solve"}</span>
        </button>

        <div className="sep" />

        <button
          className="icon-btn"
          title={playing ? "Pause" : "Play"}
          onClick={() => setPlaying(!playing)}
          disabled={!busy}
        >
          {busy && playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button className="icon-btn" title="Undo" onClick={undo} disabled={busy || moveLogLen === 0}>
          <UndoIcon />
        </button>

        <button className="icon-btn" title="Reset to solved" onClick={reset}>
          <ResetIcon />
        </button>

        <div className="sep" />

        <button
          className={`icon-btn ${pasteActive ? "active" : ""}`}
          title="Paste a scramble"
          onClick={onPaste}
          disabled={busy}
        >
          <PasteIcon />
        </button>

        <button className="icon-btn" title="Take a snapshot" onClick={onSnap}>
          <CameraIcon />
        </button>

        <div className="settings-anchor">
          <button
            className={`icon-btn ${showSettings ? "active" : ""}`}
            title="Settings"
            onClick={() => setShowSettings((v) => !v)}
          >
            <GearIcon />
          </button>
          {showSettings && <SettingsPopover onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </div>
  );
}

function SettingsPopover({ onClose }: { onClose: () => void }) {
  const autoOrbit = useCube((s) => s.settings.autoOrbit);
  const turnMs = useCube((s) => s.settings.turnMs);
  const toggleAutoOrbit = useCube((s) => s.toggleAutoOrbit);
  const setTurnMs = useCube((s) => s.setTurnMs);

  return (
    <>
      {/* click-away catcher */}
      <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={onClose} />
      <div className="popover" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <div>
            <label>Auto-orbit</label>
            <div className="sub">Reveal the active face &amp; idle spin</div>
          </div>
          <button
            className={`switch ${autoOrbit ? "on" : ""}`}
            onClick={toggleAutoOrbit}
            aria-pressed={autoOrbit}
          />
        </div>
        <div className="row">
          <div>
            <label>Turn speed</label>
            <div className="sub">Slow → Fast</div>
          </div>
          <input
            type="range"
            min={80}
            max={520}
            step={20}
            value={600 - turnMs}
            onChange={(e) => setTurnMs(600 - Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}
