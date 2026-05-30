<div align="center">

# 🧩 CubeLab

### A studio-quality 3D Rubik's Cube solver that runs in your browser

Scramble it, solve it, or just play. Beautiful real-time rendering, drag-to-turn
interaction, intelligent camera work, and a near-optimal **Kociemba two-phase**
solver — all client-side, GPU-accelerated through WebGL.

`React` · `TypeScript` · `three.js` · `Vite` · `Kociemba (cubejs)` · `Docker`

</div>

---

## ✨ Features

- **Studio-realistic 3D** — beveled plastic cubies, glossy clear-coated stickers, a
  procedural studio environment for reflections, soft contact shadows, and ACES film
  tone mapping. The environment is generated in-app, so there are no external asset
  downloads at runtime.
- **Full mouse / trackpad control**
  - Drag the background to orbit the whole cube; scroll to zoom.
  - **Drag any sticker** to turn that layer — the drag direction is raycast and mapped
    to the correct face turn.
- **Intelligent auto-orbit** — when enabled, the camera gently re-aims to reveal the
  face a move is acting on, and does a slow showcase spin when idle. It yields the
  instant you touch the cube.
- **Scramble** — one-click random (WCA-style), or **paste your own** sequence in
  standard notation.
- **Solve** — a near-optimal two-phase solution (~20–23 moves), computed in a Web
  Worker so the UI never stutters. The full solution is captured in standard notation
  with live playback highlighting, and is one-click copyable.
- **Keyboard** — `R U F L D B` (hold `⇧` for prime), `M E S`, `x y z`; `space`
  pauses / resumes playback.
- **Minimal, modern UI** — a single floating dock keeps Scramble and Solve front and
  centre; everything else is one tap away.

## 🚀 Try it

The app builds and deploys as a single static-serving container.

```bash
docker compose up -d --build      # build image + start
# open http://localhost:8080
docker compose down               # stop & remove
```

Prefer to run it from source? See [Local development](#-local-development) below.

## 🎮 Controls

| Action | How |
| --- | --- |
| Orbit the cube | Drag the background |
| Zoom | Scroll / pinch |
| Turn a layer | Drag a sticker in the direction you want it to go |
| Turn via keyboard | `R U F L D B` · hold `⇧` for counter-clockwise |
| Slices / wide / rotations | `M E S` · `x y z` |
| Scramble | **Scramble** button, or paste your own |
| Solve | **Solve** button |
| Pause / resume playback | `space` |

## ✍️ Notation

Standard Singmaster notation: `U D L R F B` faces · `'` counter-clockwise ·
`2` half turn · `M E S` slices · `Rw` / lowercase wide turns · `x y z` whole-cube
rotations. Paste a sequence into the scramble dialog and it animates through it.

## 🛠 Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm run validate   # verify the cube engine against cubejs (ground truth)
```

> `npm run validate` runs `scripts/validate-model.ts` using Node's built-in
> TypeScript stripping. It checks the move engine against `cubejs` across all 18 base
> moves, 500 random sequences, inverse round-trips, and full scramble→solve cycles —
> the regression net for the cube logic.

## 🧠 How it works

```
src/
  cube/                Logical model — the single source of truth
    types.ts             vocabulary (faces, colours, directions, moves)
    cubeModel.ts         26-cubie engine + 90° layer rotations + facelet serializer
    notation.ts          Singmaster parser / formatter / move builder
    scramble.ts          WCA-style random scramble generator
  solver/
    solver.worker.ts     solver worker (cubejs Kociemba two-phase)
    solverClient.ts      promise-based main-thread client
  state/
    store.ts             zustand store: model, move queue, scramble/solve flows
  three/
    CubeScene.tsx        Canvas, lighting, environment, shadows, controls
    CubeMesh.tsx         cubie meshes, layer-turn animation, face-drag interaction
    CameraDirector.tsx   intelligent auto-orbit / face-follow
  ui/                    TopBar, ControlDock, MovesPanel, ScramblePasteDialog, icons
```

**Staying correct.** The cube is modelled as 26 small cubies, each carrying coloured
stickers keyed by the direction they face. A move rotates the affected layer's cubie
positions and sticker directions by 90°. That same model serializes to the
54-character facelet string the Kociemba solver consumes, and is rebuilt into the
rendered meshes after every committed move — so the 3D view, the solver input, and the
logic can never drift apart.

**Why a browser app for GPU acceleration?** On macOS the browser's WebGL/WebGPU layer
compiles down to **Metal**, so a browser app *is* the path to the GPU — with none of
the shareability cost of a native build. three.js (via react-three-fiber) gives mature,
hardware-accelerated PBR rendering that runs anywhere.

## 🤝 Contributing & experimenting

This is a playground — fork it, remix it, build something weird. Ideas that would be
fun: alternate visual themes (glass/neon), an optimal-solver toggle, a speed-timer with
stats, solve-step explanations, or bigger cubes. PRs and forks welcome; no permission
needed.

## 📄 License

Released into the **public domain** under [The Unlicense](LICENSE). Do whatever you
like with it — no attribution required.
