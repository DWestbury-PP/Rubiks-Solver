import { useState } from "react";
import { useCube } from "../state/store.ts";

export function ScramblePasteDialog({ onClose }: { onClose: () => void }) {
  const applyScrambleText = useCube((s) => s.applyScrambleText);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const apply = () => {
    const n = applyScrambleText(text);
    if (n === 0) {
      setError("No valid moves found. Use standard notation like R U R' U'.");
      return;
    }
    onClose();
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Paste a scramble</h3>
        <p>
          Enter a sequence in standard cube notation. Supports face turns, slices (M E S), wide turns
          (Rw / lowercase), and rotations (x y z).
        </p>
        <textarea
          autoFocus
          placeholder="e.g.  R U R' U' R' F R2 U' R' U' R U R' F'"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply();
          }}
        />
        {error && <div className="hint" style={{ color: "var(--danger)" }}>{error}</div>}
        <div className="hint">
          Tip: <code>'</code> = counter-clockwise, <code>2</code> = half turn. Press{" "}
          <code>⌘/Ctrl + Enter</code> to apply.
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={apply} disabled={!text.trim()}>
            Apply scramble
          </button>
        </div>
      </div>
    </div>
  );
}
