import { useEffect, useRef, useState } from "react";
import { useCube } from "../state/store.ts";
import { formatSequence } from "../cube/notation.ts";
import type { Move } from "../cube/types.ts";
import { CheckIcon, CloseIcon, CopyIcon } from "./icons.tsx";

function CopyButton({ moves }: { moves: Move[] }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatSequence(moves));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button className="mini-btn" onClick={copy} disabled={moves.length === 0}>
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Sequence({ moves, playhead }: { moves: Move[]; playhead?: number }) {
  return (
    <div className="seq">
      {moves.map((m, i) => {
        let cls = "move-chip";
        if (playhead !== undefined) {
          if (i < playhead) cls += " done";
          else if (i === playhead) cls += " current";
        }
        return (
          <span key={i} className={cls}>
            {m.notation}
          </span>
        );
      })}
    </div>
  );
}

/** The inline "paste a scramble" view that the Moves tile flips into. */
function PasteView({ onClose }: { onClose: () => void }) {
  const applyScrambleText = useCube((s) => s.applyScrambleText);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const apply = () => {
    const n = applyScrambleText(text);
    if (n === 0) {
      setError("No valid moves found — try notation like R U R' U'.");
      return;
    }
    onClose();
  };

  return (
    <aside className="side paste">
      <header>
        <h2>Paste a scramble</h2>
        <button className="icon-btn ghost" title="Cancel" onClick={onClose}>
          <CloseIcon size={16} />
        </button>
      </header>
      <div className="body">
        <textarea
          ref={ref}
          className="paste-area"
          placeholder="e.g.  R U R' U' R' F R2 U' R' U' R U R' F'"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply();
            if (e.key === "Escape") onClose();
          }}
        />
        {error && <div className="paste-error">{error}</div>}
        <p className="empty-note paste-hint">
          <strong>'</strong> = counter-clockwise, <strong>2</strong> = half turn. Supports slices{" "}
          <strong>M E S</strong>, wide <strong>Rw</strong>, and rotations <strong>x y z</strong>.
        </p>
        <div className="paste-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={apply} disabled={!text.trim()}>
            Apply
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MovesPanel({
  pasteMode,
  onClosePaste,
}: {
  pasteMode: boolean;
  onClosePaste: () => void;
}) {
  const scramble = useCube((s) => s.scramble);
  const solution = useCube((s) => s.solution);
  const playhead = useCube((s) => s.solutionPlayhead);
  const busy = useCube((s) => s.active !== null || s.queue.length > 0);
  const moveLog = useCube((s) => s.moveLog);

  if (pasteMode) return <PasteView onClose={onClosePaste} />;

  const hasContent = scramble.length > 0 || solution.length > 0;

  return (
    <aside className="side">
      <header>
        <h2>Moves</h2>
        <span className="empty-note">{moveLog.length} total</span>
      </header>
      <div className="body">
        {solution.length > 0 && (
          <div className="seq-block">
            <div className="seq-head">
              <span>Solution · {solution.length} moves</span>
              <CopyButton moves={solution} />
            </div>
            <Sequence moves={solution} playhead={busy ? playhead : undefined} />
          </div>
        )}

        {scramble.length > 0 && (
          <div className="seq-block">
            <div className="seq-head">
              <span>Scramble · {scramble.length} moves</span>
              <CopyButton moves={scramble} />
            </div>
            <Sequence moves={scramble} />
          </div>
        )}

        {!hasContent && (
          <p className="empty-note">
            Scramble the cube, then press <strong>Solve</strong> for a shortest-path solution.
            <br />
            <br />
            Drag any face to turn it, orbit with the mouse, or use the keyboard:{" "}
            <strong>R U F L D B</strong> (hold <strong>⇧</strong> for prime).
          </p>
        )}
      </div>
    </aside>
  );
}
