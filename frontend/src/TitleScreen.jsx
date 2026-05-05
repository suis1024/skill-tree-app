// 起動直後のタイトル画面。

export default function TitleScreen({ onStart }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.center}>
        <h1 style={styles.title}>Skill Tree Shooter</h1>
        <p style={styles.subtitle}>全方位シューティング × ローグライト</p>
        <button style={styles.button} onClick={onStart}>開始</button>
        <p style={styles.hint}>移動だけで戦う、武器は自動発射。</p>
      </div>
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
  hint: {
    marginTop: 32, fontSize: 12, color: "#64748b",
  },
};
