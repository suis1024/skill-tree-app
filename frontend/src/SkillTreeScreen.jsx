import { useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  SKILLS, SKILL_BY_ID, CATEGORIES, TREE_VIEWBOX, SECTION_HEADERS, nextCost, isUnlockable,
} from "./game/skills";
import { GearIcon, BackIcon, CoinIcon, PlayIcon, CloseIcon, LockIcon } from "./icons";

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
      <header style={styles.headerTop}>
        {onBackToTitle && (
          <button type="button" onClick={onBackToTitle} style={styles.backButton} aria-label="戻る">
            <BackIcon width={18} height={18} />
            <span style={styles.backLabel}>戻る</span>
          </button>
        )}
        <h2 style={styles.headerTitle}>スキルツリー</h2>
        {onOpenSettings && (
          <button type="button" onClick={onOpenSettings} aria-label="設定" style={styles.iconButton}>
            <GearIcon width={20} height={20} />
          </button>
        )}
      </header>
      <div style={styles.headerBottom}>
        <div style={styles.coinPill}>
          <CoinIcon width={16} height={16} />
          <strong style={styles.coinValue}>{coins.toLocaleString()}</strong>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={busy}
          style={styles.startButton}
        >
          <span>ステージ選択</span>
          <PlayIcon width={14} height={14} />
        </button>
      </div>

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
                  <g
                    transform={`translate(${s.pos.x - 8}, ${s.pos.y - 8})`}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="12" height="8" rx="1.5" />
                    <path d="M4.5 7 V4.5 a3.5 3.5 0 0 1 7 0 V7" />
                  </g>
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
        <button onClick={onClose} style={styles.closeBtn} aria-label="閉じる">
          <CloseIcon width={18} height={18} />
        </button>
      </div>
      <p style={styles.detailDesc}>{skill.desc}</p>
      <p style={styles.detailLine}>レベル: <strong>{lv} / {skill.maxLevel}</strong></p>
      {reqText && (
        <p style={{ ...styles.detailLine, color: unlockable ? "#86efac" : "#fda4af", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <LockIcon width={14} height={14} />
          {reqText}
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
        {maxed ? "MAX" : !unlockable ? "LOCKED" : `強化 (${cost} コイン)`}
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    padding: "calc(env(safe-area-inset-top) + 8px) 12px 200px",
    color: "#e2e8f0",
  },
  headerTop: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10, gap: 8,
  },
  headerTitle: {
    margin: 0,
    fontSize: 18,
    flex: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  headerBottom: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 14, gap: 12,
  },
  backButton: {
    background: "rgba(51,65,85,0.7)", color: "#e2e8f0", border: "1px solid #475569",
    padding: "8px 12px", borderRadius: 18, fontSize: 13, cursor: "pointer",
    flexShrink: 0, whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", gap: 4,
  },
  backLabel: { fontSize: 13 },
  iconButton: {
    background: "rgba(51,65,85,0.7)", color: "#e2e8f0", border: "1px solid #475569",
    width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  coinPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    color: "#7c2d12",
    padding: "8px 16px",
    borderRadius: 20,
    boxShadow: "0 2px 8px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
    fontWeight: 700,
  },
  coinValue: { fontSize: 18, color: "#451a03" },
  startButton: {
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#052e16",
    border: "none",
    padding: "10px 18px",
    fontSize: 15,
    fontWeight: 700,
    borderRadius: 22,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
    flexShrink: 0,
    display: "inline-flex", alignItems: "center", gap: 6,
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
  closeBtn: {
    background: "transparent", color: "#cbd5e1", border: "none",
    cursor: "pointer", padding: 4, lineHeight: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  detailDesc: { fontSize: 13, color: "#cbd5e1", margin: "4px 0 8px" },
  detailLine: { fontSize: 13, margin: "4px 0" },
  upgradeButton: {
    width: "100%", border: "none", padding: "10px", borderRadius: 6,
    color: "#0f172a", fontWeight: 700, fontSize: 14, marginTop: 8,
  },
};
