// Validates our cubie move-engine against cubejs (trusted ground truth).
// Run: npm run validate
import { createRequire } from "node:module";
import { CubeModel, SOLVED_FACELETS } from "../src/cube/cubeModel.ts";
import { parseSequence, parseToken } from "../src/cube/notation.ts";

const require = createRequire(import.meta.url);
const Cube = require("cubejs");

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error("  ✗ " + msg);
};

// 1. Solved cube must serialize to the identity facelet string.
{
  const m = new CubeModel();
  if (m.toFaceletString() !== SOLVED_FACELETS) {
    fail(`solved string mismatch:\n    got ${m.toFaceletString()}\n    exp ${SOLVED_FACELETS}`);
  } else {
    console.log("  ✓ solved cube serializes to identity");
  }
}

// 2. Every base move must match cubejs's facelet output.
const baseMoves = [
  "U", "U'", "U2", "D", "D'", "D2",
  "L", "L'", "L2", "R", "R'", "R2",
  "F", "F'", "F2", "B", "B'", "B2",
];
for (const mv of baseMoves) {
  const mine = new CubeModel();
  mine.applyMoves(parseSequence(mv));
  const ref = new Cube();
  ref.move(mv);
  if (mine.toFaceletString() !== ref.asString()) {
    fail(`move ${mv}\n    got ${mine.toFaceletString()}\n    ref ${ref.asString()}`);
  }
}
if (!failures) console.log("  ✓ all 18 base moves match cubejs");

// 3. Random sequences must match cubejs.
const faces = ["U", "D", "L", "R", "F", "B"];
const sfx = ["", "'", "2"];
let seqFail = 0;
for (let t = 0; t < 500; t++) {
  const tokens: string[] = [];
  const n = 5 + Math.floor(Math.random() * 25);
  for (let i = 0; i < n; i++) {
    tokens.push(faces[Math.floor(Math.random() * 6)] + sfx[Math.floor(Math.random() * 3)]);
  }
  const seq = tokens.join(" ");
  const mine = new CubeModel();
  mine.applyMoves(parseSequence(seq));
  const ref = new Cube();
  ref.move(seq);
  if (mine.toFaceletString() !== ref.asString()) {
    seqFail++;
    if (seqFail <= 3) fail(`seq ${seq}\n    got ${mine.toFaceletString()}\n    ref ${ref.asString()}`);
  }
}
if (seqFail === 0) console.log("  ✓ 500 random face sequences match cubejs");
else failures += 0; // already counted

// 4. Round-trip: applying a move then its inverse returns to solved.
{
  let rtFail = 0;
  for (const mv of baseMoves) {
    const m = new CubeModel();
    const fwd = parseToken(mv)!;
    m.applyMove(fwd);
    // inverse via notation
    const invStr = mv.includes("2") ? mv : mv.includes("'") ? mv.replace("'", "") : mv + "'";
    m.applyMoves(parseSequence(invStr));
    if (!m.isSolved()) rtFail++;
  }
  if (rtFail === 0) console.log("  ✓ move + inverse returns to solved");
  else fail(`${rtFail} moves failed inverse round-trip`);
}

// 5. Solver sanity: scramble, solve via cubejs, verify solution actually solves our model.
{
  Cube.initSolver();
  let solveFail = 0;
  for (let t = 0; t < 20; t++) {
    const tokens: string[] = [];
    for (let i = 0; i < 25; i++) {
      tokens.push(faces[Math.floor(Math.random() * 6)] + sfx[Math.floor(Math.random() * 3)]);
    }
    const scramble = tokens.join(" ");
    const mine = new CubeModel();
    mine.applyMoves(parseSequence(scramble));

    const ref = Cube.fromString(mine.toFaceletString());
    const solution = ref.solve();
    mine.applyMoves(parseSequence(solution));
    if (!mine.isSolved()) {
      solveFail++;
      if (solveFail <= 2) fail(`solve failed for scramble ${scramble}\n    solution ${solution}`);
    }
  }
  if (solveFail === 0) console.log("  ✓ 20 scramble→solve cycles fully solve the cube");
}

console.log("");
if (failures) {
  console.error(`FAILED with ${failures} error(s).`);
  process.exit(1);
} else {
  console.log("ALL CHECKS PASSED ✅");
}
