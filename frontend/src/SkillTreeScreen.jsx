import { useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  SKILLS, SKILL_BY_ID, CATEGORIES, TREE_VIEWBOX, SECTION_HEADERS, nextCost, isUnlockable,
} from "./game/skills";

export default function SkillTreeScreen({ coins, skillLevels, onUpgrade, onStart, onBackToTitle, onOpenSettings, busy }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? SKILL_BY_ID[selectedId] : null;

  const edges = useMemo(() => {
    return SKILLS.filter((s) => s.requires).map((s) => {
      const parent = SKILL_BY_ID[s.requires.id];
      return { from: parent.pos, to: s.pos, parentId: parent.id, childId: s.id };
    });
  }, []);

  const nodeRadius = 26;

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {onBackToTitle && (
            <button type="button" onClick={onBackToTitle} style={styles.backButton}>← タイトル</button>
          )}
          <h2 style={{ margin: 0 }}>スキルツリー</h2>
          {onOpenSettings && (
            <button type="button" onClick={onOpenSettings} aria-label="設定" style={styles.iconButton}>⚙</button>
          )}
        </div>
        <div style={styles.headerRight}>
          <span style={styles.coin}>COIN: <strong>{coins}</strong></span>
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            style={styles.startButton}
          >
            ▶ ステージ選択
          </button>
        </div>
      </header>

      <div style={styles.treeWrap}>
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          doubleClick={{ mode: "reset" }}
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: false }}
          pinch={{ step: 5 }}
        >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%" }}
        >
        <svg
          viewBox={`0 0 ${TREE_VIEWBOX.width} ${TREE_VIEWBOX.height}`}
          style={styles.svg}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* カテゴリ見出し */}
          {SECTION_HEADERS.map((h) => {
            const color = CATEGORIES[h.category]?.color || "#94a3b8";
            return (
              <g key={`hdr-${h.category}`}>
                <line
                  x1={20} y1={h.y + 18}
                  x2={TREE_VIEWBOX.width - 20} y2={h.y + 18}
                  stroke={color}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                />
                <text
                  x={TREE_VIEWBOX.width / 2}
                  y={h.y + 14}
                  textAnchor="middle"
                  fontSize={20}
                  fontWeight="bold"
                  fill={color}
                >{h.label}</text>
              </g>
            );
          })}

          {/* 接続線 */}
          {edges.map((e, i) => {
            const childLv = skillLevels[e.childId] || 0;
            const parentLv = skillLevels[e.parentId] || 0;
            const reqLv = SKILL_BY_ID[e.childId].requires.level;
            const reached = parentLv >= reqLv;
            return (
              <line
                key={i}
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
                stroke={reached ? "#64748b" : "#1e293b"}
                strokeWidth={3}
              />
            );
          })}

          {/* ノード */}
          {SKILLS.map((s) => {
            const lv = skillLevels[s.id] || 0;
            const cat = CATEGORIES[s.category];
            const unlockable = isUnlockable(s, skillLevels);
            const isMaxed = lv >= s.maxLevel;
            const isOwned = lv > 0;
            const fill = isOwned ? cat.color : unlockable ? "#0f172a" : "#1e293b";
            const stroke = unlockable ? cat.color : "#475569";
            const isSelected = selectedId === s.id;
            return (
              <g
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={s.pos.x}
                  cy={s.pos.y}
                  r={nodeRadius + (isSelected ? 4 : 0)}
                  fill={fill}
                  stroke={isSelected ? "#fde047" : stroke}
                  strokeWidth={isSelected ? 4 : 2.5}
                />
                {isMaxed && (
                  <circle
                    cx={s.pos.x}
                    cy={s.pos.y}
                    r={nodeRadius - 6}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={2}
                  />
                )}
                {!unlockable && (
                  <text
                    x={s.pos.x}
                    y={s.pos.y + 6}
                    textAnchor="middle"
                    fontSize={18}
                    fill="#cbd5e1"
                  >🔒</text>
                )}
                {unlockable && (
                  <text
                    x={s.pos.x}
                    y={s.pos.y + 5}
                    textAnchor="middle"
                    fontSize={14}
                    fill={isOwned ? "#0f172a" : "#cbd5e1"}
                    fontWeight="bold"
                  >{lv}/{s.maxLevel}</text>
                )}
                <text
                  x={s.pos.x}
                  y={s.pos.y + nodeRadius + 16}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#cbd5e1"
                >{s.name}</text>
              </g>
            );
          })}
        </svg>
        </TransformComponent>
        </TransformWrapper>
      </div>

      {/* 詳細パネル */}
      {selected ? (
        <SkillDetail
          skill={selected}
          lv={skillLevels[selected.id] || 0}
          skillLevels={skillLevels}
          coins={coins}
          busy={busy}
          onUpgrade={onUpgrade}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <p style={styles.hint}>ノードをタップして詳細を表示</p>
      )}
    </div>
  );
}

function SkillDetail({ skill, lv, skillLevels, coins, busy, onUpgrade, onClose }) {
  const cat = CATEGORIES[skill.category];
  const cost = nextCost(skill, lv);
  const maxed = cost === null;
  const unlockable = isUnlockable(skill, skillLevels);
  const affordable = !maxed && unlockable && coins >= cost;
  // 子の名前は短いことが多い (例: 「速度」) ので、武器解放スキル直系なら親名を前置
  const parent = skill.requires ? SKILL_BY_ID[skill.requires.id] : null;
  const isWeaponChild = parent && parent.id?.startsWith("wpn_unlock_");
  const isPistolChild = parent && skill.id?.startsWith("pistol_");
  const fullName = isWeaponChild
    ? `${parent.name}の${skill.name}`
    : isPistolChild
    ? `ピストルの${skill.name}`
    : skill.name;
  const reqText = skill.requires
    ? `要: ${SKILL_BY_ID[skill.requires.id]?.name ?? skill.requires.id} Lv${skill.requires.level}`
    : null;

  return (
    <div style={{ ...styles.detailWrap, borderColor: cat.color }}>
      <div style={styles.detailHeader}>
        <div>
          <span style={{ ...styles.catTag, background: cat.color, color: "#0f172a" }}>{cat.label}</span>
          <strong style={{ marginLeft: 8, fontSize: 16 }}>{fullName}</strong>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
      </div>
      <p style={styles.detailDesc}>{skill.desc}</p>
      <p style={styles.detailLine}>レベル: <strong>{lv} / {skill.maxLevel}</strong></p>
      {reqText && (
        <p style={{ ...styles.detailLine, color: unlockable ? "#86efac" : "#fda4af" }}>
          {unlockable ? "✓ " : "🔒 "}{reqText}
        </p>
      )}
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
        {maxed ? "MAX" : !unlockable ? "🔒 LOCKED" : `強化 (${cost} コイン)`}
      </button>
    </div>
  );
}

const styles = {
  wrap: { padding: "12px 12px 200px", color: "#e2e8f0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  backButton: {
    background: "#334155", color: "#e2e8f0", border: "none",
    padding: "8px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer",
  },
  iconButton: {
    background: "#334155", color: "#e2e8f0", border: "none",
    width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  coin: { fontSize: 18, color: "#fde047" },
  startButton: {
    background: "#22c55e", color: "#0f172a", border: "none", padding: "10px 22px",
    fontSize: 16, fontWeight: 700, borderRadius: 6, cursor: "pointer",
  },
  treeWrap: {
    width: "100%",
    background: "radial-gradient(ellipse at center, #1e293b 0%, #0b1220 70%)",
    borderRadius: 8,
    border: "1px solid #1e293b",
    overflow: "hidden",
    aspectRatio: `${1000 / 900}`,
    maxHeight: "70vh",
  },
  svg: { width: "100%", height: "100%", display: "block" },
  hint: { textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 12 },
  detailWrap: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(env(safe-area-inset-bottom) + 12px)",
    maxWidth: 520,
    margin: "0 auto",
    background: "#1e293b",
    border: "2px solid",
    borderRadius: 8,
    padding: "12px 14px",
    zIndex: 10,
  },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catTag: { padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
  closeBtn: { background: "transparent", color: "#cbd5e1", border: "none", fontSize: 22, cursor: "pointer", lineHeight: 1 },
  detailDesc: { fontSize: 13, color: "#cbd5e1", margin: "4px 0 8px" },
  detailLine: { fontSize: 13, margin: "4px 0" },
  upgradeButton: {
    width: "100%", border: "none", padding: "10px", borderRadius: 6,
    color: "#0f172a", fontWeight: 700, fontSize: 14, marginTop: 8,
  },
};
