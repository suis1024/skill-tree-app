import { TOTAL_STAGES } from "./game/stages";
import { BackIcon, CheckIcon, LockIcon } from "./icons";

export default function StageSelectScreen({ clearedStages, onSelect, onBack }) {
  const cleared = new Set(clearedStages);
  const maxUnlocked = clearedStages.length === 0 ? 1 : Math.min(TOTAL_STAGES, Math.max(...clearedStages) + 1);

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <button type="button" onClick={onBack} style={styles.backButton}>
          <BackIcon width={16} height={16} />
          <span>戻る</span>
        </button>
        <h2 style={styles.headerTitle}>ステージ選択</h2>
        <span style={{ width: 64, flexShrink: 0 }} />
      </header>

      <div style={styles.grid}>
        {Array.from({ length: TOTAL_STAGES }).map((_, i) => {
          const n = i + 1;
          const isCleared = cleared.has(n);
          const isLocked = n > maxUnlocked;
          const isPlayable = !isLocked;
          return (
            <button
              key={n}
              type="button"
              disabled={!isPlayable}
              onClick={() => isPlayable && onSelect(n)}
              style={{
                ...styles.card,
                background: isLocked ? "#1e293b" : isCleared ? "#14532d" : "#1e3a8a",
                borderColor: isLocked ? "#334155" : isCleared ? "#22c55e" : "#3b82f6",
                cursor: isPlayable ? "pointer" : "not-allowed",
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <div style={styles.cardLabel}>STAGE</div>
              <div style={styles.cardNum}>{n}</div>
              <div style={styles.cardStatus}>
                {isLocked ? (
                  <LockIcon width={16} height={16} />
                ) : isCleared ? (
                  <span style={styles.statusInner}>
                    <CheckIcon width={14} height={14} />
                    <span>CLEAR</span>
                  </span>
                ) : (
                  "未クリア"
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p style={styles.note}>
        各ステージは雑魚波 90秒 → ボス戦。ボスを倒すとクリア。
      </p>
    </div>
  );
}

const styles = {
  wrap: {
    padding: "calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 16px)",
    color: "#e2e8f0",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16, gap: 12,
  },
  headerTitle: {
    margin: 0,
    fontSize: 20,
    whiteSpace: "nowrap",
    flexShrink: 1,
    minWidth: 0,
  },
  backButton: {
    background: "#334155", color: "#e2e8f0", border: "none",
    padding: "8px 12px", borderRadius: 18, fontSize: 14, cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", gap: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 12,
    maxWidth: 720,
    margin: "0 auto",
  },
  card: {
    border: "2px solid",
    borderRadius: 10,
    padding: "16px 8px",
    color: "#e2e8f0",
    fontFamily: "inherit",
    transition: "transform 0.1s",
  },
  cardLabel: { fontSize: 10, color: "#94a3b8", letterSpacing: 1 },
  cardNum: { fontSize: 36, fontWeight: 700, lineHeight: 1.1, margin: "4px 0" },
  cardStatus: { fontSize: 12, color: "#cbd5e1", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 16 },
  statusInner: { display: "inline-flex", alignItems: "center", gap: 4 },
  note: { textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 16 },
};
