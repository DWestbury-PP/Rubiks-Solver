import type { Axis, Move } from "./types.ts";

interface BaseSpec {
  axis: Axis;
  layers: number[];
  base: number; // base clockwise turn count (right-hand rule about +axis)
}

// Single outer-face turns. "+side" faces (R,U,F) turn -90° about their +axis
// when viewed clockwise from outside (base = 3); "-side" faces (L,D,B) turn +90°.
const FACE: Record<string, BaseSpec> = {
  R: { axis: "x", layers: [1], base: 3 },
  L: { axis: "x", layers: [-1], base: 1 },
  U: { axis: "y", layers: [1], base: 3 },
  D: { axis: "y", layers: [-1], base: 1 },
  F: { axis: "z", layers: [1], base: 3 },
  B: { axis: "z", layers: [-1], base: 1 },
};

// Slice turns follow the adjacent face: M↔L, E↔D, S↔F.
const SLICE: Record<string, BaseSpec> = {
  M: { axis: "x", layers: [0], base: 1 },
  E: { axis: "y", layers: [0], base: 1 },
  S: { axis: "z", layers: [0], base: 3 },
};

// Wide turns rotate the outer face plus the adjacent middle slice.
const WIDE: Record<string, BaseSpec> = {
  r: { axis: "x", layers: [0, 1], base: 3 },
  l: { axis: "x", layers: [-1, 0], base: 1 },
  u: { axis: "y", layers: [0, 1], base: 3 },
  d: { axis: "y", layers: [-1, 0], base: 1 },
  f: { axis: "z", layers: [0, 1], base: 3 },
  b: { axis: "z", layers: [-1, 0], base: 1 },
};

// Whole-cube rotations follow R / U / F.
const ROT: Record<string, BaseSpec> = {
  x: { axis: "x", layers: [-1, 0, 1], base: 3 },
  y: { axis: "y", layers: [-1, 0, 1], base: 3 },
  z: { axis: "z", layers: [-1, 0, 1], base: 3 },
};

/** Parse a single move token (e.g. "R", "U'", "F2", "Rw", "r", "M", "x'"). */
export function parseToken(raw: string): Move | null {
  let s = raw.trim();
  if (!s) return null;

  const isDouble = s.includes("2");
  const isPrime = s.includes("'") || s.includes("’");
  s = s.replace(/[2'’]/g, "");
  if (!s) return null;

  let wide = false;
  if (s.length > 1 && (s.endsWith("w") || s.endsWith("W"))) {
    wide = true;
    s = s.slice(0, -1);
  }

  const lower = s.toLowerCase();
  const upper = s.toUpperCase();

  let spec: BaseSpec | undefined;
  let label: string;

  if (ROT[lower] && (upper === "X" || upper === "Y" || upper === "Z")) {
    spec = ROT[lower];
    label = lower;
  } else if (wide && FACE[upper]) {
    spec = WIDE[upper.toLowerCase()];
    label = upper + "w";
  } else if (FACE[upper] && s === upper) {
    spec = FACE[upper];
    label = upper;
  } else if (WIDE[lower] && s === lower) {
    spec = WIDE[lower];
    label = upper + "w";
  } else if (SLICE[upper] && (upper === "M" || upper === "E" || upper === "S")) {
    spec = SLICE[upper];
    label = upper;
  } else {
    return null;
  }

  let turns = spec.base;
  let suffix = "";
  if (isDouble) {
    turns = 2;
    suffix = "2";
  } else if (isPrime) {
    turns = (4 - spec.base) % 4;
    suffix = "'";
  }
  if (turns === 0) return null;

  return {
    notation: label + suffix,
    axis: spec.axis,
    layers: spec.layers,
    turns,
  };
}

// (axis, layer) → outer/slice face letter and its base clockwise turn count.
const AXIS_LAYER_FACE: Record<string, { letter: string; base: number }> = {
  "x:1": { letter: "R", base: 3 },
  "x:-1": { letter: "L", base: 1 },
  "x:0": { letter: "M", base: 1 },
  "y:1": { letter: "U", base: 3 },
  "y:-1": { letter: "D", base: 1 },
  "y:0": { letter: "E", base: 1 },
  "z:1": { letter: "F", base: 3 },
  "z:-1": { letter: "B", base: 1 },
  "z:0": { letter: "S", base: 3 },
};

/** Build a single-layer Move from axis + layer + a quarter-turn count about the +axis. */
export function buildMove(axis: Axis, layer: number, quarter: number): Move | null {
  const turns = ((quarter % 4) + 4) % 4;
  if (turns === 0) return null;
  const spec = AXIS_LAYER_FACE[`${axis}:${layer}`];
  if (!spec) return null;
  let notation: string;
  if (turns === 2) notation = spec.letter + "2";
  else if (turns === spec.base) notation = spec.letter;
  else notation = spec.letter + "'";
  return { notation, axis, layers: [layer], turns };
}

/** Parse a whitespace/comma separated sequence of moves. Unknown tokens are skipped. */
export function parseSequence(input: string): Move[] {
  return input
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .map(parseToken)
    .filter((m): m is Move => m !== null);
}

/** Inverse of a single move (same axis/layers, complementary turn count).
 *  The suffix is flipped textually because notation↔turns depends on the
 *  face's base orientation (e.g. "L" is one RH turn, "R" is three). */
export function invertMove(m: Move): Move {
  const turns = m.turns === 2 ? 2 : (4 - m.turns) % 4;
  let notation: string;
  if (m.notation.includes("2")) notation = m.notation; // self-inverse
  else if (/['’]/.test(m.notation)) notation = m.notation.replace(/['’]/g, "");
  else notation = m.notation + "'";
  return { notation, axis: m.axis, layers: m.layers, turns };
}

/** Invert a whole sequence (reverse order, invert each). */
export function invertSequence(moves: Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}

/** Render a list of moves back to clean notation text. */
export function formatSequence(moves: Move[]): string {
  return moves.map((m) => m.notation).join(" ");
}

/** Outward face normal a move acts on, for camera auto-follow. Returns null for
 *  slice/whole-cube moves where "following a face" isn't meaningful. */
export function moveNormal(m: Move): import("./types.ts").Vec3 | null {
  const idx = m.axis === "x" ? 0 : m.axis === "y" ? 1 : 2;
  const hasPos = m.layers.includes(1);
  const hasNeg = m.layers.includes(-1);
  if (hasPos === hasNeg) return null; // slice (0), or both extremes / full rotation
  const v: [number, number, number] = [0, 0, 0];
  v[idx] = hasPos ? 1 : -1;
  return v;
}
