// Minimal stroked icon set (24px viewBox, currentColor).
type P = { size?: number };
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const ShuffleIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </svg>
);

export const WandIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M15 4V2" />
    <path d="M15 10V8" />
    <path d="M12.5 6.5h-2" />
    <path d="M19.5 6.5h-2" />
    <path d="m3 21 9-9" />
    <path d="M14 7l3 3" />
  </svg>
);

export const UndoIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
  </svg>
);

export const ResetIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const PlayIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const PauseIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="6.5" y="5" width="3.4" height="14" rx="1.1" fill="currentColor" stroke="none" />
    <rect x="14.1" y="5" width="3.4" height="14" rx="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const CopyIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);

export const PasteIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    <path d="M9 4h6v2H9z" fill="currentColor" stroke="none" />
  </svg>
);

export const GearIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
  </svg>
);

export const CloseIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const CheckIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12.5 10 17 19 7" />
  </svg>
);

export const CameraIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 8.5a2 2 0 0 1 2-2h1.2l1-1.6h5.6l1 1.6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.1" />
  </svg>
);

export const DownloadIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
);
