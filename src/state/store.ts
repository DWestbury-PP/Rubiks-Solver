import { create } from "zustand";
import { CubeModel } from "../cube/cubeModel.ts";
import { formatSequence, invertMove, parseSequence } from "../cube/notation.ts";
import { randomScramble } from "../cube/scramble.ts";
import type { Move } from "../cube/types.ts";
import { solveFacelets, warmUpSolver } from "../solver/solverClient.ts";

export type MoveSource = "manual" | "scramble" | "solve" | "undo";

export interface QueuedMove {
  move: Move;
  source: MoveSource;
}

export type SolverStatus = "cold" | "warming" | "ready" | "solving";

export interface Settings {
  autoOrbit: boolean; // idle showcase spin + face-follow during moves
  turnMs: number; // duration of one quarter-turn animation
}

interface CubeState {
  model: CubeModel;
  renderKey: number; // bump to re-skin cubies from the model
  queue: QueuedMove[];
  active: QueuedMove | null; // move currently being animated
  playing: boolean; // queue auto-drains while true
  solved: boolean;

  moveLog: Move[]; // canonical applied-move history (manual + scramble + solve)
  scramble: Move[]; // moves of the last scramble (copyable)
  solution: Move[]; // moves of the last solve (copyable)
  solutionPlayhead: number; // how many solution moves have been applied

  solverStatus: SolverStatus;
  status: string; // human-readable status line
  settings: Settings;

  // --- actions ---
  warmSolver: () => void;
  enqueue: (moves: Move[], source: MoveSource) => void;
  startNext: () => QueuedMove | null; // animation layer pulls the next move
  finishActive: () => void; // animation layer reports completion
  setPlaying: (p: boolean) => void;

  doScramble: (length?: number) => void;
  applyScrambleText: (text: string) => number; // returns # of valid moves
  doSolve: () => Promise<void>;
  undo: () => void;
  reset: () => void;
  clearQueue: () => void;
  toggleAutoOrbit: () => void;
  setTurnMs: (ms: number) => void;
}

export const useCube = create<CubeState>((set, get) => ({
  model: new CubeModel(),
  renderKey: 0,
  queue: [],
  active: null,
  playing: false,
  solved: true,

  moveLog: [],
  scramble: [],
  solution: [],
  solutionPlayhead: 0,

  solverStatus: "cold",
  status: "Solved",
  settings: { autoOrbit: true, turnMs: 260 },

  warmSolver: () => {
    if (get().solverStatus !== "cold") return;
    set({ solverStatus: "warming" });
    warmUpSolver().then(() => set({ solverStatus: "ready" }));
  },

  enqueue: (moves, source) => {
    if (moves.length === 0) return;
    const items = moves.map((move) => ({ move, source }));
    set((s) => ({ queue: [...s.queue, ...items], playing: true }));
  },

  startNext: () => {
    const { queue, active } = get();
    if (active || queue.length === 0) return null;
    const [next, ...rest] = queue;
    set({ active: next, queue: rest });
    return next;
  },

  finishActive: () => {
    const { active, model } = get();
    if (!active) return;
    model.applyMove(active.move);
    set((s) => {
      const solution = s.solution;
      let playhead = s.solutionPlayhead;
      if (active.source === "solve") playhead = Math.min(playhead + 1, solution.length);

      let moveLog = s.moveLog;
      if (active.source === "undo") {
        moveLog = s.moveLog.slice(0, -1); // remove the move being undone
      } else {
        moveLog = [...s.moveLog, active.move];
      }

      const solved = model.isSolved();
      const queueEmpty = s.queue.length === 0;
      return {
        active: null,
        renderKey: s.renderKey + 1,
        moveLog,
        solutionPlayhead: playhead,
        solved,
        status: solved && queueEmpty ? "Solved" : s.status,
      };
    });
  },

  setPlaying: (p) => set({ playing: p }),

  doScramble: (length = 25) => {
    const moves = randomScramble(length);
    set({
      scramble: moves,
      solution: [],
      solutionPlayhead: 0,
      status: "Scrambling…",
    });
    get().enqueue(moves, "scramble");
    // warm the solver in the background so the first solve is instant
    get().warmSolver();
  },

  applyScrambleText: (text) => {
    const moves = parseSequence(text);
    if (moves.length === 0) return 0;
    set({
      scramble: moves,
      solution: [],
      solutionPlayhead: 0,
      status: "Applying scramble…",
    });
    get().enqueue(moves, "scramble");
    get().warmSolver();
    return moves.length;
  },

  doSolve: async () => {
    const { model, solverStatus } = get();
    if (model.isSolved()) {
      set({ status: "Already solved" });
      return;
    }
    set({ solverStatus: "solving", status: "Solving…" });
    try {
      if (solverStatus === "cold") await warmUpSolver();
      // Solve from the current *settled* state (queue should be empty when solving).
      const facelets = model.toFaceletString();
      const solutionStr = await solveFacelets(facelets);
      const moves = parseSequence(solutionStr);
      set({
        solution: moves,
        solutionPlayhead: 0,
        scramble: [],
        solverStatus: "ready",
        status: moves.length ? `Solving in ${moves.length} moves` : "Already solved",
      });
      get().enqueue(moves, "solve");
    } catch (err) {
      set({
        solverStatus: "ready",
        status: "Solve failed — is the cube valid?",
      });
      console.error("Solve error:", err);
    }
  },

  undo: () => {
    const { moveLog, active, queue } = get();
    if (active || queue.length > 0 || moveLog.length === 0) return;
    const last = moveLog[moveLog.length - 1];
    get().enqueue([invertMove(last)], "undo");
  },

  reset: () => {
    const model = get().model;
    model.reset();
    set({
      renderKey: get().renderKey + 1,
      queue: [],
      active: null,
      playing: false,
      moveLog: [],
      scramble: [],
      solution: [],
      solutionPlayhead: 0,
      solved: true,
      status: "Solved",
    });
  },

  clearQueue: () => set({ queue: [], playing: false }),

  toggleAutoOrbit: () =>
    set((s) => ({ settings: { ...s.settings, autoOrbit: !s.settings.autoOrbit } })),

  setTurnMs: (ms) => set((s) => ({ settings: { ...s.settings, turnMs: ms } })),
}));

// Convenience selectors / derived helpers used by the UI.
export const scrambleText = (s: CubeState) => formatSequence(s.scramble);
export const solutionText = (s: CubeState) => formatSequence(s.solution);

if (import.meta.env.DEV) {
  (window as unknown as { cube: typeof useCube }).cube = useCube;
}
