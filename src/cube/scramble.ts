import { parseToken } from "./notation.ts";
import type { Move } from "./types.ts";

const FACES = ["U", "D", "L", "R", "F", "B"] as const;
const SUFFIX = ["", "'", "2"] as const;

// Axis grouping so we avoid two consecutive turns on the same axis (e.g. R then L).
const AXIS_OF: Record<string, string> = {
  U: "y",
  D: "y",
  L: "x",
  R: "x",
  F: "z",
  B: "z",
};

/**
 * Generate a WCA-style random scramble of `length` quarter/half turns.
 * Avoids redundant consecutive moves (same face, or same axis back-to-back-to-back).
 */
export function randomScramble(length = 25): Move[] {
  const moves: Move[] = [];
  let lastFace = "";
  let lastAxis = "";
  let prevAxis = "";

  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    if (face === lastFace) continue;
    const axis = AXIS_OF[face];
    // disallow three same-axis turns in a row (e.g. R L R)
    if (axis === lastAxis && axis === prevAxis) continue;

    const suffix = SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
    const move = parseToken(face + suffix);
    if (!move) continue;

    moves.push(move);
    prevAxis = lastAxis;
    lastAxis = axis;
    lastFace = face;
  }
  return moves;
}
