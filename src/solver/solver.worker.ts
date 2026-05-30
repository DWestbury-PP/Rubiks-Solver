// Web Worker: builds the Kociemba pruning tables once, then solves on demand.
// Running off the main thread keeps the UI perfectly smooth during the
// (~a few hundred ms) one-time table initialization.
import Cube from "cubejs";

let ready = false;

function ensureReady() {
  if (!ready) {
    // Builds the move + pruning tables. Expensive, done once.
    (Cube as unknown as { initSolver: () => void }).initSolver();
    ready = true;
  }
}

type InMsg =
  | { type: "init" }
  | { type: "solve"; id: number; facelets: string };

type OutMsg =
  | { type: "ready" }
  | { type: "solved"; id: number; solution: string }
  | { type: "error"; id: number; message: string };

const post = (msg: OutMsg) => (self as unknown as Worker).postMessage(msg);

self.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  if (msg.type === "init") {
    ensureReady();
    post({ type: "ready" });
    return;
  }
  if (msg.type === "solve") {
    try {
      ensureReady();
      const cube = (Cube as unknown as { fromString: (s: string) => { solve: () => string } }).fromString(
        msg.facelets,
      );
      const solution = cube.solve();
      post({ type: "solved", id: msg.id, solution: solution.trim() });
    } catch (err) {
      post({
        type: "error",
        id: msg.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
