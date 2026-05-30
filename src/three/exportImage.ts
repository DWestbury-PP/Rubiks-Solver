// Snapshot helpers. The WebGL canvas is transparent (the backdrop is CSS), so we
// composite it onto a gradient matching the app to produce a self-contained image.

/** Capture the current 3D view as a PNG data URL (composited onto the backdrop). */
export function captureCubeImage(): string | null {
  const src = document.querySelector<HTMLCanvasElement>("#scene canvas");
  if (!src) return null;

  const w = src.width;
  const h = src.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return null;

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

  return out.toDataURL("image/png");
}

/** A timestamped default filename. */
export function snapshotFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `cubelab-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}${p(d.getSeconds())}.png`;
}

/** Download a PNG data URL to the browser's download folder. */
export async function downloadImage(dataUrl: string, filename: string): Promise<void> {
  // Convert to a blob so the download is reliable and never navigates the page.
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Copy a PNG data URL to the clipboard. Returns false if unsupported/denied. */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const clip = navigator.clipboard as Clipboard & {
      write?: (items: ClipboardItem[]) => Promise<void>;
    };
    if (!clip?.write || typeof ClipboardItem === "undefined") return false;
    const blob = await (await fetch(dataUrl)).blob();
    await clip.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
