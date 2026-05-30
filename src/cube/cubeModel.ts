import {
  DIRECTIONS,
  type Axis,
  type Cubie,
  type FaceLetter,
  type Move,
  type Sticker,
  type Vec3,
} from "./types.ts";

const AXIS_INDEX: Record<Axis, number> = { x: 0, y: 1, z: 2 };

/** Rotate an integer grid vector by `turns` quarter-turns (right-hand rule about +axis). */
export function rotateVec(v: Vec3, axis: Axis, turns: number): Vec3 {
  let [x, y, z] = v;
  const t = ((turns % 4) + 4) % 4;
  for (let i = 0; i < t; i++) {
    if (axis === "x") {
      [y, z] = [-z, y]; // (x, -z, y)
    } else if (axis === "y") {
      [x, z] = [z, -x]; // (z, y, -x)
    } else {
      [x, y] = [-y, x]; // (-y, x, z)
    }
  }
  return [x, y, z];
}

const key = (p: Vec3) => `${p[0]},${p[1]},${p[2]}`;
const vecEq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// The 54 facelet slots in Kociemba/cubejs order: U(0-8) R(9-17) F(18-26) D(27-35) L(36-44) B(45-53).
// Each slot is a (grid position, outward direction) pair, read row-by-row per the standard net.
interface Slot {
  pos: Vec3;
  dir: Vec3;
}

function buildSlots(): Slot[] {
  const faces: { dir: Vec3; pos: (r: number, c: number) => Vec3 }[] = [
    { dir: [0, 1, 0], pos: (r, c) => [-1 + c, 1, -1 + r] }, // U
    { dir: [1, 0, 0], pos: (r, c) => [1, 1 - r, 1 - c] }, // R
    { dir: [0, 0, 1], pos: (r, c) => [-1 + c, 1 - r, 1] }, // F
    { dir: [0, -1, 0], pos: (r, c) => [-1 + c, -1, 1 - r] }, // D
    { dir: [-1, 0, 0], pos: (r, c) => [-1, 1 - r, -1 + c] }, // L
    { dir: [0, 0, -1], pos: (r, c) => [1 - c, 1 - r, -1] }, // B
  ];
  const slots: Slot[] = [];
  for (const face of faces) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        slots.push({ pos: face.pos(r, c), dir: face.dir });
      }
    }
  }
  return slots;
}

const SLOTS = buildSlots();

/** Logical source of truth for the cube: 26 visible cubies (the core is omitted). */
export class CubeModel {
  cubies: Cubie[];

  constructor() {
    this.cubies = this.buildSolved();
  }

  private buildSolved(): Cubie[] {
    const cubies: Cubie[] = [];
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // skip invisible core
          const position: Vec3 = [x, y, z];
          const stickers: Sticker[] = [];
          for (const d of DIRECTIONS) {
            const onFace =
              d.vec[0] * x + d.vec[1] * y + d.vec[2] * z === 1; // sticker faces outward on an extreme layer
            if (onFace) stickers.push({ dir: [...d.vec] as unknown as Vec3, face: d.letter });
          }
          cubies.push({ id: id++, position, stickers });
        }
      }
    }
    return cubies;
  }

  reset(): void {
    this.cubies = this.buildSolved();
  }

  clone(): CubeModel {
    const c = new CubeModel();
    c.cubies = this.cubies.map((cu) => ({
      id: cu.id,
      position: [...cu.position] as Vec3,
      stickers: cu.stickers.map((s) => ({ dir: [...s.dir] as Vec3, face: s.face })),
    }));
    return c;
  }

  applyMove(m: Move): void {
    const ax = AXIS_INDEX[m.axis];
    const layers = new Set(m.layers);
    for (const cubie of this.cubies) {
      if (!layers.has(cubie.position[ax])) continue;
      cubie.position = rotateVec(cubie.position, m.axis, m.turns);
      for (const s of cubie.stickers) {
        s.dir = rotateVec(s.dir, m.axis, m.turns);
      }
    }
  }

  applyMoves(moves: Move[]): void {
    for (const m of moves) this.applyMove(m);
  }

  /** Serialize to the 54-character facelet string consumed by the Kociemba solver. */
  toFaceletString(): string {
    const byPos = new Map<string, Cubie>();
    for (const cubie of this.cubies) byPos.set(key(cubie.position), cubie);

    let out = "";
    for (const slot of SLOTS) {
      const cubie = byPos.get(key(slot.pos));
      if (!cubie) {
        out += "?";
        continue;
      }
      const sticker = cubie.stickers.find((s) => vecEq(s.dir, slot.dir));
      out += sticker ? sticker.face : "?";
    }
    return out;
  }

  isSolved(): boolean {
    return this.toFaceletString() === SOLVED_FACELETS;
  }

  /** Snapshot suitable for rendering: each visible cubie with a colour per outward direction. */
  toRenderState(): RenderCubie[] {
    return this.cubies.map((cubie) => {
      const faces: Partial<Record<FaceKey, FaceLetter>> = {};
      for (const s of cubie.stickers) {
        faces[dirToKey(s.dir)] = s.face;
      }
      return { id: cubie.id, position: [...cubie.position] as Vec3, faces };
    });
  }
}

export const SOLVED_FACELETS =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export type FaceKey = "px" | "nx" | "py" | "ny" | "pz" | "nz";

export interface RenderCubie {
  id: number;
  position: Vec3;
  faces: Partial<Record<FaceKey, FaceLetter>>;
}

export function dirToKey(d: Vec3): FaceKey {
  if (d[0] === 1) return "px";
  if (d[0] === -1) return "nx";
  if (d[1] === 1) return "py";
  if (d[1] === -1) return "ny";
  if (d[2] === 1) return "pz";
  return "nz";
}
