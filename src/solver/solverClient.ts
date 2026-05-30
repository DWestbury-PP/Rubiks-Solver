// Main-thread client for the solver worker. Lazily spawns the worker, warms up
// the tables, and exposes a promise-based solve().

type OutMsg =
  | { type: "ready" }
  | { type: "solved"; id: number; solution: string }
  | { type: "error"; id: number; message: string };

let worker: Worker | null = null;
let nextId = 1;
let readyPromise: Promise<void> | null = null;
const pending = new Map<number, { resolve: (s: string) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<OutMsg>) => {
      const msg = e.data;
      if (msg.type === "solved") {
        pending.get(msg.id)?.resolve(msg.solution);
        pending.delete(msg.id);
      } else if (msg.type === "error") {
        pending.get(msg.id)?.reject(new Error(msg.message));
        pending.delete(msg.id);
      }
    };
  }
  return worker;
}

/** Warm up the worker and build solver tables ahead of the first solve. */
export function warmUpSolver(): Promise<void> {
  if (!readyPromise) {
    readyPromise = new Promise<void>((resolve) => {
      const w = getWorker();
      const onReady = (e: MessageEvent<OutMsg>) => {
        if (e.data.type === "ready") {
          w.removeEventListener("message", onReady);
          resolve();
        }
      };
      w.addEventListener("message", onReady);
      w.postMessage({ type: "init" });
    });
  }
  return readyPromise;
}

/** Solve a cube given its 54-char facelet string. Resolves with a notation string. */
export function solveFacelets(facelets: string): Promise<string> {
  const w = getWorker();
  const id = nextId++;
  return new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "solve", id, facelets });
  });
}
