// Core type vocabulary for the cube model.

// A grid coordinate component is always one of -1, 0, +1.
export type Axis = "x" | "y" | "z";
export type Vec3 = readonly [number, number, number];

// The six face colours, keyed by the canonical face letter they belong to.
// U=Up(white) R=Right(red) F=Front(green) D=Down(yellow) L=Left(orange) B=Back(blue)
export type FaceLetter = "U" | "R" | "F" | "D" | "L" | "B";

// Hex colours for the studio-realistic palette (slightly desaturated, premium plastic).
export const FACE_COLOR: Record<FaceLetter, string> = {
  U: "#f5f5f7", // white
  R: "#e8362d", // red
  F: "#16a34a", // green
  D: "#f9d423", // yellow
  L: "#ee771d", // orange
  B: "#1573e6", // blue
};

// The outward direction a sticker faces, as a unit grid vector.
export const DIRECTIONS: { letter: FaceLetter; vec: Vec3 }[] = [
  { letter: "U", vec: [0, 1, 0] },
  { letter: "D", vec: [0, -1, 0] },
  { letter: "R", vec: [1, 0, 0] },
  { letter: "L", vec: [-1, 0, 0] },
  { letter: "F", vec: [0, 0, 1] },
  { letter: "B", vec: [0, 0, -1] },
];

// A sticker: which way it currently points and what colour it is.
export interface Sticker {
  dir: Vec3;
  face: FaceLetter; // the face this colour belongs to (its "home")
}

// A single small cube ("cubie").
export interface Cubie {
  id: number;
  position: Vec3; // current grid position, each component in {-1,0,1}
  stickers: Sticker[];
}

// A parsed move: a quarter/half turn of one or more layers about an axis.
export interface Move {
  notation: string; // canonical text, e.g. "R", "U'", "F2", "M", "x"
  axis: Axis;
  // which layers (by their coordinate along `axis`) are affected
  layers: number[];
  // number of clockwise (right-hand-rule, about the +axis) quarter turns: 1, 2, or 3
  turns: number;
}
