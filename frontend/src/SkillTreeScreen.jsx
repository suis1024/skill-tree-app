import { useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  SKILLS, SKILL_BY_ID, CATEGORIES, TREE_VIEWBOX, SECTION_HEADERS, nextCost, isUnlockable,
} from "./game/skills";
import { GearIcon, BackIcon, PlayIcon, CloseIcon, LockIcon } from "./icons";
import { PAL, PX_FONT, JP_FONT, NodeIcon, Coin } from "./pixel/PixelArt";

// スキル ID から NodeIcon の kind を推定。
function iconKindFor(id) {
  if (id.startsWith("pistol_")) return "sword";
  if (id.startsWith("bomb_") || id === "wpn_unlock_bomb") return "bomb";
  if (id.startsWith("thunder_") || id === "wpn_unlock_thunder") return "bolt";
  if (id.startsWith("homing_") || id === "wpn_unlock_homing") return "target";
  if (id.startsWith("orbital_") || id === "wpn_unlock_orbital") return "orbit";
  if (id === "def_hp" || id === "def_regen") return "heart";
  if (id === "def_speed") return "boots";
  if (id === "def_armor") return "shield";
  if (id === "def_revive") return "revive";
  if (id === "eco_coin" || id === "eco_start") return "coin";
  if (id === "eco_magnet" || id === "eco_lucky") return "star";
  if (id === "eco_retry") return "revive";
  if (id === "pistol_pierce") return "pierce";
  return "target";
}

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
      <div style={styles.headerBox}>
        <div style={styles.headerTop}>
          {onBackToTitle ? (
            <button type="button" onClick={onBackToTitle} style={styles.headerSideBtn} aria-label="戻る">
              <BackIcon width={14} height={14} /><span>BACK</span>
            </button>
          ) : <span style={{ width: 60 }} />}
          <div style={styles.headerTitle}>SKILL TREE</div>
          {onOpenSettings ? (
            <button type="button" onClick={onOpenSettings} aria-label="設定" style={styles.headerSideBtn}>
              <GearIcon width={14} height={14} /><span>MENU</span>
            </button>
          ) : <span style={{ width: 60 }} />}
        </div>
        <div style={styles.headerBottom}>
          <div style={styles.coinPill}>
            <Coin scale={2} />
            <span style={styles.coinValue}>{coins.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            style={styles.startButton}
          >
            <PlayIcon width={12} height={12} />
            <span>STAGE</span>
          </button>
        </div>
      </div>

      <div style={styles.treeWrap}>
        <TransformWrapper
          initialScale={1}
          minScale={0.6}
          maxScale={3}
          limitToBounds={false}
          doubleClick={{ disabled: true }}
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: true }}
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
            const color = CATEGORIES[h.category]?.color || PAL.bone2;
            const upper = (h.label || "").toUpperCase();
            return (
              <g key={`hdr-${h.category}`}>
                <rect
                  x={0} y={h.y + 18}
                  width={TREE_VIEWBOX.width} height={2}
                  fill={color} fillOpacity={0.4}
                />
                <text
                  x={TREE_VIEWBOX.width / 2}
                  y={h.y + 12}
                  textAnchor="middle"
                  fontFamily={PX_FONT}
                  fontSize={11}
                  letterSpacing={2}
                  fill={color}
                >{`◆ ${h.label} ◆`}</text>
              </g>
            );
          })}

          {/* 接続線 (90 度エルボー風) */}
          {edges.map((e, i) => {
            const parentLv = skillLevels[e.parentId] || 0;
            const reqLv = SKILL_BY_ID[e.childId].requires.level;
            const reached = parentLv >= reqLv;
            const childCat = CATEGORIES[SKILL_BY_ID[e.childId].category];
            const stroke = reached ? childCat.color : PAL.shadow;
            return (
              <g key={i} stroke={stroke} strokeWidth={3} fill="none" shapeRendering="crispEdges">
                <line x1={e.from.x} y1={e.from.y} x2={e.from.x} y2={e.to.y} />
                <line x1={e.from.x} y1={e.to.y}   x2={e.to.x}   y2={e.to.y} />
              </g>
            );
          })}

          {/* ノード (矩形ピクセル風) */}
          {SKILLS.map((s) => {
            const lv = skillLevels[s.id] || 0;
            const cat = CATEGORIES[s.category];
            const unlockable = isUnlockable(s, skillLevels);
            const isMaxed = lv >= s.maxLevel;
            const isOwned = lv > 0;
            const isLocked = !unlockable;
            const isSelected = selectedId === s.id;
            const r = nodeRadius;
            const fill = isOwned ? cat.color : isLocked ? PAL.ink2 : PAL.ink;
            const stroke = isLocked ? PAL.shadow : cat.color;
            return (
              <g
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{ cursor: "pointer" }}
                shapeRendering="crispEdges"
              >
                {/* 外枠 (選択時はゴールドのリング) */}
                {isSelected && (
                  <rect
                    x={s.pos.x - r - 4} y={s.pos.y - r - 4}
                    width={r * 2 + 8} height={r * 2 + 8}
                    fill="none" stroke={PAL.gold} strokeWidth={2}
                  />
                )}
                <rect
                  x={s.pos.x - r} y={s.pos.y - r}
                  width={r * 2} height={r * 2}
                  fill={fill} stroke={stroke} strokeWidth={3}
                />
                {/* 内側のインキ枠 */}
                <rect
                  x={s.pos.x - r + 4} y={s.pos.y - r + 4}
                  width={r * 2 - 8} height={r * 2 - 8}
                  fill={PAL.ink} fillOpacity={isOwned ? 0.2 : 1}
                />
                {/* アイコン (16×16 を box 中央に固定) */}
                {!isLocked && (
                  <foreignObject
                    x={s.pos.x - 16} y={s.pos.y - 16}
                    width={32} height={32}
                    style={{ overflow: "visible", pointerEvents: "none" }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32,
                    }}>
                      <NodeIcon kind={iconKindFor(s.id)} scale={2} />
                    </div>
                  </foreignObject>
                )}
                {/* Lv バッジ or ロック */}
                {!isLocked && (
                  <g>
                    <rect
                      x={s.pos.x + r - 16} y={s.pos.y + r - 11}
                      width={22} height={13}
                      fill={PAL.ink} stroke={cat.color} strokeWidth={1.5}
                    />
                    <text
                      x={s.pos.x + r - 5} y={s.pos.y + r - 1}
                      textAnchor="middle"
                      fontFamily={PX_FONT} fontSize={8}
                      fill={isMaxed ? PAL.gold : cat.color}
                    >
                      {isMaxed ? "MAX" : `${lv}/${s.maxLevel}`}
                    </text>
                  </g>
                )}
                {isLocked && (
                  <g
                    transform={`translate(${s.pos.x - 7}, ${s.pos.y - 7})`}
                    fill="none" stroke={PAL.shadow} strokeWidth={1.6}
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="11" height="7" />
                    <path d="M4 6 V4 a3.5 3.5 0 0 1 7 0 V6" />
                  </g>
                )}
                {/* スキル名 */}
                <text
                  x={s.pos.x}
                  y={s.pos.y + r + 16}
                  textAnchor="middle"
                  fontFamily={JP_FONT}
                  fontSize={12}
                  fill={isLocked ? PAL.shadow : PAL.bone}
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
    minHeight: "100vh",
    padding: "calc(env(safe-area-inset-top) + 0px) 0 200px",
    color: PAL.bone,
    background: PAL.ink,
    fontFamily: JP_FONT,
  },
  headerBox: {
    padding: "12px 16px 10px",
    borderBottom: `2px solid ${PAL.ink2}`,
    background: `linear-gradient(180deg, ${PAL.ink2}, ${PAL.ink})`,
  },
  headerTop: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10, gap: 8,
  },
  headerTitle: {
    fontFamily: PX_FONT,
    fontSize: 12,
    color: PAL.gold,
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  headerSideBtn: {
    background: PAL.ink2,
    border: "none",
    color: PAL.bone2,
    cursor: "pointer",
    fontFamily: PX_FONT,
    fontSize: 9,
    letterSpacing: 2,
    padding: "6px 10px",
    display: "inline-flex", alignItems: "center", gap: 5,
    flexShrink: 0,
    boxShadow: `2px 2px 0 #050309, 0 0 0 1.5px ${PAL.shadow}`,
  },
  headerBottom: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12,
  },
  coinPill: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: PAL.ink2,
    padding: "5px 10px",
    boxShadow: `2px 2px 0 ${PAL.goldDark}, 0 0 0 2px ${PAL.gold}`,
  },
  coinValue: {
    fontFamily: PX_FONT, fontSize: 12, color: PAL.gold, letterSpacing: 1,
  },
  startButton: {
    fontFamily: PX_FONT, fontSize: 11, letterSpacing: 2,
    background: PAL.blood, color: PAL.ink, border: "none",
    padding: "8px 14px", cursor: "pointer",
    boxShadow: `3px 3px 0 ${PAL.bloodDark}, 0 0 0 2px ${PAL.ink}`,
    flexShrink: 0,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  treeWrap: {
    width: "100%",
    background: PAL.ink,
    overflow: "hidden",
    aspectRatio: `${TREE_VIEWBOX.width} / ${TREE_VIEWBOX.height}`,
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
