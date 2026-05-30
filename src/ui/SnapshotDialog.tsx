import { useState } from "react";
import { copyImageToClipboard, downloadImage, snapshotFilename } from "../three/exportImage.ts";
import { CheckIcon, CloseIcon, CopyIcon, DownloadIcon } from "./icons.tsx";

export function SnapshotDialog({ dataUrl, onClose }: { dataUrl: string; onClose: () => void }) {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canCopy] = useState(() => typeof ClipboardItem !== "undefined");

  const download = async () => {
    await downloadImage(dataUrl, snapshotFilename());
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1600);
  };

  const copy = async () => {
    const ok = await copyImageToClipboard(dataUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Snapshot ready</h3>
          <button className="icon-btn ghost" title="Close" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        <p>Here's your render. Save it to your downloads, copy it, or right-click the image to save.</p>

        <div className="snapshot-frame">
          <img className="snapshot-preview" src={dataUrl} alt="Cube snapshot preview" />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Back to cube
          </button>
          {canCopy && (
            <button className="btn" onClick={copy}>
              {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
          <button className="btn primary" onClick={download}>
            {downloaded ? <CheckIcon size={18} /> : <DownloadIcon size={18} />}
            <span>{downloaded ? "Saved" : "Download PNG"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
