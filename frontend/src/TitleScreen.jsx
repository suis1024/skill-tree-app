// 起動直後のタイトル画面。

import { useEffect, useState } from "react";
import { startBgm } from "./bgm";

export default function TitleScreen({ onStart }) {
  const [showHelp, setShowHelp] = useState(false);

  // iOS WebView は autoplay を弾くので、タイトル表示時 + 画面タップ時に試行する。
  useEffect(() => { startBgm(); }, []);

  return (
    <div style={styles.wrap} onPointerDown={() => startBgm()}>
      <BackdropDeco />
      <div style={styles.center}>
        <div style={styles.titleStack}>
          <span style={styles.titleLine1}>Skill Tree</span>
          <span style={styles.titleLine2}>Shooter</span>
        </div>
        <p style={styles.subtitle}>全方位シューティング × ローグライト</p>
        <button style={styles.button} onClick={onStart}>
          <span style={styles.buttonInner}>▶ 開始</span>
        </button>
        <button style={styles.subButton} onClick={() => setShowHelp(true)}>あそびかた</button>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// 背景の装飾。スキルツリー風の薄いノードグラフ + ふんわり発光。
function BackdropDeco() {
  return (
    <svg style={styles.backdrop} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="titleGlow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fde047" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="700" fill="url(#titleGlow)" />
      {/* 接続線 */}
      <g stroke="#334155" strokeWidth="1" opacity="0.5">
        <line x1="200" y1="120" x2="100" y2="220" />
        <line x1="200" y1="120" x2="300" y2="220" />
        <line x1="200" y1="120" x2="200" y2="240" />
        <line x1="100" y1="220" x2="60"  y2="340" />
        <line x1="300" y1="220" x2="340" y2="340" />
        <line x1="200" y1="240" x2="200" y2="360" />
        <line x1="200" y1="360" x2="120" y2="500" />
        <line x1="200" y1="360" x2="280" y2="500" />
      </g>
      {/* ノード (色違い) */}
      <g opacity="0.6">
        <circle cx="200" cy="120" r="9" fill="#fde047" />
        <circle cx="100" cy="220" r="7" fill="#ef4444" />
        <circle cx="300" cy="220" r="7" fill="#3b82f6" />
        <circle cx="200" cy="240" r="6" fill="#22c55e" />
        <circle cx="60"  cy="340" r="6" fill="#ef4444" />
        <circle cx="340" cy="340" r="6" fill="#3b82f6" />
        <circle cx="200" cy="360" r="6" fill="#22c55e" />
        <circle cx="120" cy="500" r="5" fill="#a855f7" />
        <circle cx="280" cy="500" r="5" fill="#a855f7" />
      </g>
    </svg>
  );
}

function HelpModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18 }}>あそびかた</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <Section title="操作">
          <p>画面を<b>ドラッグ</b>して移動。武器は<b>自動発射</b>。</p>
          <p>PC ではキーボードの <b>WASD</b> または <b>矢印キー</b>。</p>
        </Section>
        <Section title="ゲームの流れ">
          <p>各ステージは <b>雑魚波 90 秒 → ボス戦</b>。ボスを倒すとクリア。</p>
          <p>ステージは <b>10 個</b>。クリアすると次のステージが解放される。</p>
        </Section>
        <Section title="コインとスキル">
          <p>敵を倒すとコインが落ちる。死亡 / クリア時に<b>全額持ち帰り</b>。</p>
          <p>スキルツリーで<b>永続強化</b>。新しい武器の解放もここから。</p>
        </Section>
        <Section title="ループ">
          <p>死ぬ → コインで強くなる → 再挑戦。これを繰り返して 10 ステージ制覇を目指す。</p>
        </Section>
        <button style={styles.modalBtn} onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(circle at 50% 35%, #1e3a5f 0%, #0b1220 60%, #020617 100%)",
    color: "#e2e8f0",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    overflow: "hidden",
  },
  backdrop: {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    pointerEvents: "none", zIndex: 0,
  },
  center: { textAlign: "center", padding: 24, position: "relative", zIndex: 1 },
  titleStack: {
    display: "flex", flexDirection: "column", alignItems: "center",
    lineHeight: 0.95, marginBottom: 14,
  },
  titleLine1: {
    fontSize: "min(48px, 12vw)",
    fontWeight: 800,
    letterSpacing: 2,
    color: "#fef3c7",
    textShadow: "0 0 12px rgba(253,224,71,0.4), 0 4px 20px rgba(0,0,0,0.6)",
  },
  titleLine2: {
    fontSize: "min(64px, 17vw)",
    fontWeight: 900,
    letterSpacing: 3,
    color: "#fde047",
    textShadow: "0 0 20px rgba(253,224,71,0.6), 0 4px 24px rgba(0,0,0,0.7)",
  },
  subtitle: {
    margin: "0 0 48px", fontSize: 13, color: "#cbd5e1",
    letterSpacing: 1.5, opacity: 0.85,
  },
  button: {
    background: "linear-gradient(180deg, #22c55e 0%, #15803d 100%)",
    color: "#052e16",
    border: "none",
    padding: "16px 48px",
    borderRadius: 28,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 1,
    cursor: "pointer",
    boxShadow: "0 6px 0 #14532d, 0 10px 24px rgba(34,197,94,0.35)",
  },
  buttonInner: { display: "inline-block" },
  subButton: {
    display: "block", margin: "24px auto 0",
    background: "rgba(51,65,85,0.4)", color: "#cbd5e1",
    border: "1px solid #475569",
    padding: "8px 22px", borderRadius: 18, fontSize: 13, cursor: "pointer",
    backdropFilter: "blur(4px)",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16, zIndex: 100,
    paddingTop: "calc(env(safe-area-inset-top) + 16px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
  },
  modal: {
    background: "#1e293b", border: "1px solid #475569", borderRadius: 10,
    padding: "16px 20px", maxWidth: 480, width: "100%",
    maxHeight: "100%", overflowY: "auto",
    color: "#e2e8f0", textAlign: "left",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    background: "transparent", color: "#cbd5e1", border: "none",
    fontSize: 24, lineHeight: 1, cursor: "pointer",
  },
  section: { marginTop: 14 },
  sectionTitle: {
    margin: "0 0 4px", fontSize: 13, color: "#fde047", letterSpacing: 1,
  },
  sectionBody: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 },
  modalBtn: {
    display: "block", width: "100%", marginTop: 20,
    background: "#22c55e", color: "#0f172a", border: "none",
    padding: "12px", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: "pointer",
  },
};
