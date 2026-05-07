// シンプルな線画 SVG アイコン群。絵文字を避けて統一感を出す。
// stroke ベースなので、color / strokeWidth は呼び出し側で制御。

const baseProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function GearIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

export function PauseIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="6"  y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}

export function BackIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M15 6 L9 12 L15 18" />
    </svg>
  );
}

export function CoinIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V7 a4 4 0 0 1 8 0 V11" />
    </svg>
  );
}

export function UnlockIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V7 a4 4 0 0 1 7.5 -1.8" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12 L10 17 L19 7" />
    </svg>
  );
}

export function WarnIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 L22 20 L2 20 Z" />
      <path d="M12 9 v5 M12 17.5 v0.5" />
    </svg>
  );
}

export function ResetIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 12 a9 9 0 1 0 3 -6.7" />
      <path d="M3 4 v5 h5" />
    </svg>
  );
}

export function BossIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <polygon points="12,3 14.6,9 21,9 16,13.5 18,20 12,16 6,20 8,13.5 3,9 9.4,9" />
    </svg>
  );
}
