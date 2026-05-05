// 起動直後のタイトル画面。

import { useState } from "react";

export default function TitleScreen({ onStart }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={styles.wrap}>
      <div style={styles.center}>
        <h1 style={styles.title}>Skill Tree Shooter</h1>
        <p style={styles.subtitle}>全方位シューティング × ローグライト</p>
        <button style={styles.button} onClick={onStart}>開始</button>
        <button style={styles.subButton} onClick={() => setShowHelp(true)}>あそびかた</button>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
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
    background: "radial-gradient(circle at 50% 40%, #1e293b 0%, #0f172a 70%)",
    color: "#e2e8f0",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  center: { textAlign: "center", padding: 24 },
  title: {
    margin: 0, fontSize: "min(48px, 11vw)", fontWeight: 800,
    letterSpacing: 2, color: "#fde047",
    textShadow: "0 4px 20px rgba(253, 224, 71, 0.3)",
  },
  subtitle: {
    margin: "12px 0 40px", fontSize: 14, color: "#94a3b8",
  },
  button: {
    background: "#22c55e", color: "#0f172a", border: "none",
    padding: "14px 40px", borderRadius: 8, fontSize: 17, fontWeight: 700,
    cursor: "pointer", boxShadow: "0 4px 0 #15803d",
  },
  subButton: {
    display: "block", margin: "20px auto 0",
    background: "transparent", color: "#94a3b8", border: "1px solid #475569",
    padding: "8px 18px", borderRadius: 6, fontSize: 13, cursor: "pointer",
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
