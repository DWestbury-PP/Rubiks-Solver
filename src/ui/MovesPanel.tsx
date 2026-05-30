import { useState } from "react";
import { useCube } from "../state/store.ts";
import { formatSequence } from "../cube/notation.ts";
import type { Move } from "../cube/types.ts";
import { CheckIcon, CopyIcon } from "./icons.tsx";

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

export function MovesPanel() {
  const scramble = useCube((s) => s.scramble);
  const solution = useCube((s) => s.solution);
  const playhead = useCube((s) => s.solutionPlayhead);
  const busy = useCube((s) => s.active !== null || s.queue.length > 0);
  const moveLog = useCube((s) => s.moveLog);

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
              <span>
                Solution · {solution.length} moves
              </span>
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
