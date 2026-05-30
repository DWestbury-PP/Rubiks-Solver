// Save the current 3D view as a PNG. The WebGL canvas is transparent (the
// backdrop is CSS), so we composite it onto a gradient matching the app before
// exporting, producing a self-contained image. Saves to the browser's download
// folder (Downloads by default; users can pick another via their browser's
// "ask where to save" setting).

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}${p(d.getSeconds())}`;
}

/** Capture the scene, composite onto the backdrop gradient, and download as PNG. */
export async function exportCubeImage(): Promise<boolean> {
  const src = document.querySelector<HTMLCanvasElement>("#scene canvas");
  if (!src) return false;

  const w = src.width;
  const h = src.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return false;

  // Matches index.css: radial-gradient(120% 120% at 50% 30%, #1a1d24, #0c0d11 55%, #06070a)
  const cx = w * 0.5;
  const cy = h * 0.3;
  const r = 1.2 * Math.max(w, h) * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "#1a1d24");
  grad.addColorStop(0.55, "#0c0d11");
  grad.addColorStop(1, "#06070a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    out.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cubelab-${timestamp()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
