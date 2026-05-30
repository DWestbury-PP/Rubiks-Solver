import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Group, Quaternion, Vector3 } from "three";
import type { Axis } from "../cube/types.ts";
import type { FaceKey, RenderCubie } from "../cube/cubeModel.ts";
import { buildMove } from "../cube/notation.ts";
import { useCube } from "../state/store.ts";

const SPACING = 1.0;
const DRAG_THRESHOLD = 9; // px before a face-drag commits a turn

// Outward normal (cube/world axis) for each sticker face.
const FACE_NORMAL: Record<FaceKey, Vector3> = {
  px: new Vector3(1, 0, 0),
  nx: new Vector3(-1, 0, 0),
  py: new Vector3(0, 1, 0),
  ny: new Vector3(0, -1, 0),
  pz: new Vector3(0, 0, 1),
  nz: new Vector3(0, 0, -1),
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface AnimState {
  axisVec: Vector3;
  target: number; // signed radians
  idx: number; // axis index 0/1/2
  layers: Set<number>;
  affected: number[];
  elapsed: number;
  duration: number;
}

interface DragState {
  startX: number;
  startY: number;
  normal: Vector3; // grabbed face normal (cube axis)
  cubiePos: readonly [number, number, number];
  committed: boolean;
}

// dynamic ref type for drei's OrbitControls
type ControlsRef = React.MutableRefObject<{ enabled: boolean } | null>;

export function CubeMesh({ controls }: { controls: ControlsRef }) {
  const renderKey = useCube((s) => s.renderKey);
  const model = useCube((s) => s.model);
  const camera = useThree((s) => s.camera);

  const cubies = useMemo<RenderCubie[]>(() => model.toRenderState(), [model, renderKey]);
  const cubieById = useMemo(() => {
    const m = new Map<number, RenderCubie>();
    for (const c of cubies) m.set(c.id, c);
    return m;
  }, [cubies]);

  const groups = useRef<Map<number, Group>>(new Map());
  const anim = useRef<AnimState | null>(null);
  const drag = useRef<DragState | null>(null);

  // Place all cubies at their settled base transform whenever the model changes.
  useLayoutEffect(() => {
    for (const c of cubies) {
      const g = groups.current.get(c.id);
      if (!g) continue;
      g.position.set(c.position[0] * SPACING, c.position[1] * SPACING, c.position[2] * SPACING);
      g.quaternion.identity();
    }
  }, [cubies]);

  function beginAnim(axis: Axis, layers: number[], turns: number, turnMs: number) {
    const axisVec = new Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
    const signedQuarters = ((turns + 1) % 4) - 1; // 1→1, 2→2, 3→-1
    const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    const layerSet = new Set(layers);
    const affected = cubies.filter((c) => layerSet.has(c.position[idx])).map((c) => c.id);
    anim.current = {
      axisVec,
      target: signedQuarters * (Math.PI / 2),
      idx,
      layers: layerSet,
      affected,
      elapsed: 0,
      duration: turnMs * Math.max(1, Math.abs(signedQuarters)),
    };
  }

  useFrame((_, delta) => {
    const s = useCube.getState();

    if (!anim.current) {
      if (!s.playing || s.active || s.queue.length === 0) return;
      const next = s.startNext();
      if (!next) return;
      beginAnim(next.move.axis, next.move.layers, next.move.turns, s.settings.turnMs);
    }

    const a = anim.current!;
    a.elapsed += delta * 1000;
    const t = Math.min(1, a.elapsed / a.duration);
    const angle = a.target * easeInOut(t);

    const q = new Quaternion().setFromAxisAngle(a.axisVec, angle);
    for (const id of a.affected) {
      const g = groups.current.get(id);
      const c = cubieById.get(id);
      if (!g || !c) continue;
      const base = new Vector3(c.position[0], c.position[1], c.position[2]).multiplyScalar(SPACING);
      g.position.copy(base.applyQuaternion(q));
      g.quaternion.copy(q);
    }

    if (t >= 1) {
      anim.current = null;
      useCube.getState().finishActive();
    }
  });

  // ---- Face-drag interaction -------------------------------------------------
  function onPointerDown(e: ThreeEvent<PointerEvent>, cubie: RenderCubie, key: FaceKey) {
    // Only allow manual turns when the cube is settled.
    const s = useCube.getState();
    if (s.active || s.queue.length > 0) return;
    e.stopPropagation();
    drag.current = {
      startX: e.nativeEvent.clientX,
      startY: e.nativeEvent.clientY,
      normal: FACE_NORMAL[key].clone(),
      cubiePos: cubie.position,
      committed: false,
    };
    if (controls.current) controls.current.enabled = false;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.committed) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    // Screen drag → world drag using camera basis.
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const worldDrag = right.multiplyScalar(dx).add(up.multiplyScalar(-dy));

    // Tangent along the face surface, snapped to a cube axis.
    const n = d.normal;
    const tangent = worldDrag.sub(n.clone().multiplyScalar(worldDrag.dot(n)));
    const t = snapToAxis(tangent);
    if (!t) {
      d.committed = true;
      return;
    }

    // Rotation axis a = n × t (so the grabbed point travels along the drag).
    const a = snapToAxis(new Vector3().crossVectors(n, t));
    if (!a) {
      d.committed = true;
      return;
    }
    const { axis, sign } = axisOf(a);
    const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    const layer = d.cubiePos[idx];
    // +90° about +a == quarter 1; about -a == quarter 3 about +axis.
    const quarter = sign > 0 ? 1 : 3;
    const move = buildMove(axis, layer, quarter);
    d.committed = true;
    if (move) useCube.getState().enqueue([move], "manual");
  };

  const onPointerUp = () => {
    drag.current = null;
    if (controls.current) controls.current.enabled = true;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  return (
    <group>
      {cubies.map((c) => (
        <group
          key={c.id}
          ref={(g) => {
            if (g) groups.current.set(c.id, g);
            else groups.current.delete(c.id);
          }}
        >
          {/* Beveled plastic body */}
          <RoundedBox args={[0.97, 0.97, 0.97]} radius={0.08} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#0b0b0d" roughness={0.5} metalness={0.05} />
          </RoundedBox>
          {/* Stickers with pointer handlers */}
          {(Object.keys(c.faces) as FaceKey[]).map((key) => (
            <StickerMesh
              key={key}
              faceKey={key}
              color={c.faces[key]!}
              onDown={(e) => onPointerDown(e, c, key)}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function snapToAxis(v: Vector3): Vector3 | null {
  if (v.lengthSq() < 1e-6) return null;
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return new Vector3(Math.sign(v.x), 0, 0);
  if (ay >= ax && ay >= az) return new Vector3(0, Math.sign(v.y), 0);
  return new Vector3(0, 0, Math.sign(v.z));
}

function axisOf(v: Vector3): { axis: Axis; sign: number } {
  if (Math.abs(v.x) > 0.5) return { axis: "x", sign: Math.sign(v.x) };
  if (Math.abs(v.y) > 0.5) return { axis: "y", sign: Math.sign(v.y) };
  return { axis: "z", sign: Math.sign(v.z) };
}

import { FACE_COLOR, type FaceLetter } from "../cube/types.ts";

const STICKER_TF: Record<FaceKey, { pos: [number, number, number]; rot: [number, number, number] }> = {
  pz: { pos: [0, 0, 0.49], rot: [0, 0, 0] },
  nz: { pos: [0, 0, -0.49], rot: [0, Math.PI, 0] },
  px: { pos: [0.49, 0, 0], rot: [0, Math.PI / 2, 0] },
  nx: { pos: [-0.49, 0, 0], rot: [0, -Math.PI / 2, 0] },
  py: { pos: [0, 0.49, 0], rot: [-Math.PI / 2, 0, 0] },
  ny: { pos: [0, -0.49, 0], rot: [Math.PI / 2, 0, 0] },
};

function StickerMesh({
  faceKey,
  color,
  onDown,
}: {
  faceKey: FaceKey;
  color: FaceLetter;
  onDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const tf = STICKER_TF[faceKey];
  return (
    <group position={tf.pos} rotation={tf.rot}>
      <RoundedBox args={[0.82, 0.82, 0.05]} radius={0.07} smoothness={4} onPointerDown={onDown} castShadow>
        <meshPhysicalMaterial
          color={FACE_COLOR[color]}
          roughness={0.3}
          metalness={0}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
          envMapIntensity={1}
        />
      </RoundedBox>
    </group>
  );
}
