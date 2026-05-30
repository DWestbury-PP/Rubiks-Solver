import { useCube } from "../state/store.ts";
import { FACE_COLOR } from "../cube/types.ts";

const LOGO_COLORS = ["R", "U", "F", "D", "L", "B", "F", "R", "U"] as const;

export function TopBar() {
  const status = useCube((s) => s.status);
  const solved = useCube((s) => s.solved);
  const busy = useCube((s) => s.active !== null || s.queue.length > 0);
  const solverStatus = useCube((s) => s.solverStatus);

  const text = solverStatus === "warming" ? "Preparing solver…" : status;
  const dotClass = busy || solverStatus === "warming" ? "busy" : solved ? "solved" : "";

  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo">
          {LOGO_COLORS.map((c, i) => (
            <i key={i} style={{ background: FACE_COLOR[c] }} />
          ))}
        </div>
        <div>
          <h1>CubeLab</h1>
          <p>Studio 3D Rubik's Cube · Kociemba solver</p>
        </div>
      </div>

      <div className="status-pill">
        <span className={`dot ${dotClass}`} />
        {text}
      </div>
    </div>
  );
}
