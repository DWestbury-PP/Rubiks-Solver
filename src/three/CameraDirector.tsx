import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { moveNormal } from "../cube/notation.ts";
import { useCube } from "../state/store.ts";

type Controls = {
  enabled: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  target: Vector3;
  update: () => void;
  addEventListener: (t: string, fn: () => void) => void;
  removeEventListener: (t: string, fn: () => void) => void;
};

const IDLE_DELAY = 2.5; // seconds of no interaction before showcase spin

/**
 * Intelligent auto-orbit:
 *  - gently eases the camera to reveal the face a move acts on
 *  - performs a slow showcase rotation once fully idle
 * All automatic motion yields immediately to user interaction.
 */
export function CameraDirector({ controls }: { controls: React.MutableRefObject<Controls | null> }) {
  const camera = useThree((s) => s.camera);
  const clockNow = useRef(0);
  const lastInteract = useRef(-Infinity);
  const desired = useRef<Vector3 | null>(null);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onStart = () => {
      lastInteract.current = clockNow.current;
      desired.current = null; // cancel any in-progress auto move
    };
    c.addEventListener("start", onStart);
    return () => c.removeEventListener("start", onStart);
  });

  useFrame((state, delta) => {
    const c = controls.current;
    if (!c) return;
    const now = state.clock.elapsedTime;
    clockNow.current = now;

    const s = useCube.getState();
    const autoOrbit = s.settings.autoOrbit;
    const interactingRecently = now - lastInteract.current < IDLE_DELAY;

    // Pick the face we'd like to reveal: the active move, else the next queued.
    const head = s.active?.move ?? s.queue[0]?.move ?? null;
    const faceN = head ? moveNormal(head) : null;

    if (autoOrbit && !interactingRecently && faceN) {
      const n = new Vector3(faceN[0], faceN[1], faceN[2]);
      const cur = camera.position.clone().sub(c.target).normalize();
      // Only re-aim if the face is currently hidden-ish from view.
      if (cur.dot(n) < 0.35) {
        const blended = cur.multiplyScalar(0.5).add(n.multiplyScalar(0.85));
        if (blended.lengthSq() < 1e-4) blended.copy(n);
        blended.normalize();
        blended.y = Math.max(blended.y, 0.28); // keep a 3/4 "from above" feel
        blended.normalize();
        desired.current = blended;
      }
    }

    // Ease toward the desired view direction, preserving the user's current zoom.
    if (autoOrbit && desired.current && !interactingRecently) {
      const radius = camera.position.distanceTo(c.target);
      const target = c.target.clone().add(desired.current.clone().multiplyScalar(radius));
      camera.position.lerp(target, 1 - Math.pow(0.0012, delta));
      camera.lookAt(c.target);
      if (camera.position.distanceTo(target) < 0.04) desired.current = null;
      c.update();
    }

    // Slow showcase spin when fully idle.
    const idle =
      autoOrbit &&
      !s.active &&
      s.queue.length === 0 &&
      !desired.current &&
      now - lastInteract.current > IDLE_DELAY;
    c.autoRotate = idle;
    c.autoRotateSpeed = 0.55;
  });

  return null;
}
