import { useMemo } from "react";
import { SKILLS, CATEGORIES, COST_TABLE, nextCost } from "./game/skills";

export default function SkillTreeScreen({ coins, skillLevels, onUpgrade, onStart, busy }) {
  const grouped = useMemo(() => {
    const out = { attack: [], defense: [], economy: [] };
    for (const s of SKILLS) out[s.category].push(s);
    return out;
  }, []);

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h2 style={{ margin: 0 }}>スキルツリー</h2>
        <div style={styles.headerRight}>
          <span style={styles.coin}>COIN: <strong>{coins}</strong></span>
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            style={styles.startButton}
          >
            ▶ 出撃する
          </button>
        </div>
      </header>

      <div style={styles.columns}>
        {Object.entries(grouped).map(([catId, skills]) => {
          const cat = CATEGORIES[catId];
          return (
            <section key={catId} style={{ ...styles.column, borderTopColor: cat.color }}>
              <h3 style={{ ...styles.colTitle, color: cat.color }}>{cat.label}</h3>
              {skills.map((skill) => {
                const lv = skillLevels[skill.id] || 0;
                const cost = nextCost(skill, lv);
                const maxed = cost === null;
                const affordable = !maxed && coins >= cost;
                return (
                  <div key={skill.id} style={styles.skillCard}>
                    <div style={styles.skillTopRow}>
                      <strong>{skill.name}</strong>
                      <span style={styles.level}>Lv. {lv} / {skill.maxLevel}</span>
                    </div>
                    <p style={styles.desc}>{skill.desc}</p>
                    <div style={styles.bar}>
                      {Array.from({ length: skill.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          style={{ ...styles.barCell, background: i < lv ? cat.color : "#1e293b" }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpgrade(skill.id, cost)}
                      disabled={maxed || !affordable || busy}
                      style={{
                        ...styles.upgradeButton,
                        background: maxed ? "#475569" : affordable ? cat.color : "#334155",
                        cursor: maxed || !affordable || busy ? "not-allowed" : "pointer",
                      }}
                    >
                      {maxed ? "MAX" : `強化 (${cost} コイン)`}
                    </button>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <p style={styles.footnote}>
        コスト: {COST_TABLE.join(" → ")}（Lv1 → Lv{COST_TABLE.length}）
      </p>
    </div>
  );
}

const styles = {
  wrap: { padding: "16px 24px", color: "#e2e8f0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  coin: { fontSize: 18, color: "#fde047" },
  startButton: {
    background: "#22c55e", color: "#0f172a", border: "none", padding: "10px 22px",
    fontSize: 16, fontWeight: 700, borderRadius: 6, cursor: "pointer",
  },
  columns: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  column: { background: "#0f172a", border: "1px solid #1e293b", borderTopWidth: 4, borderRadius: 6, padding: 12 },
  colTitle: { margin: "0 0 12px", fontSize: 18 },
  skillCard: { background: "#1e293b", borderRadius: 6, padding: 10, marginBottom: 10 },
  skillTopRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  level: { fontSize: 12, color: "#94a3b8" },
  desc: { fontSize: 13, color: "#cbd5e1", margin: "4px 0 8px" },
  bar: { display: "flex", gap: 3, marginBottom: 8 },
  barCell: { flex: 1, height: 6, borderRadius: 2 },
  upgradeButton: {
    width: "100%", border: "none", padding: "6px 10px", borderRadius: 4,
    color: "#0f172a", fontWeight: 700, fontSize: 13,
  },
  footnote: { textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 12 },
};
