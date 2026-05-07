import { TOTAL_STAGES } from "./game/stages";
import { BackIcon, CheckIcon, LockIcon } from "./icons";
import { PAL, PX_FONT, JP_FONT } from "./pixel/PixelArt";

export default function StageSelectScreen({ clearedStages, onSelect, onBack }) {
  const cleared = new Set(clearedStages);
  const maxUnlocked = clearedStages.length === 0 ? 1 : Math.min(TOTAL_STAGES, Math.max(...clearedStages) + 1);

  return (
    <div style={styles.wrap}>
      <div style={styles.headerBox}>
        <div style={styles.headerTop}>
          <button type="button" onClick={onBack} style={styles.headerSideBtn} aria-label="戻る">
            <BackIcon width={14} height={14} /><span>BACK</span>
          </button>
          <div style={styles.headerTitle}>STAGE SELECT</div>
          <span style={{ width: 60, flexShrink: 0 }} />
        </div>
      </div>

      <div style={styles.gridWrap}>
        <div style={styles.grid}>
          {Array.from({ length: TOTAL_STAGES }).map((_, i) => {
            const n = i + 1;
            const isCleared = cleared.has(n);
            const isLocked = n > maxUnlocked;
            const isPlayable = !isLocked;

            const fill = isLocked ? PAL.ink2 : isCleared ? "#1f3a1f" : "#1a0f24";
            const stroke = isLocked ? PAL.shadow : isCleared ? PAL.moss : PAL.blood;
            const shadowColor = isLocked ? "#000" : isCleared ? PAL.mossDark : PAL.bloodDark;
            const numColor = isLocked ? PAL.shadow : isCleared ? PAL.moss : PAL.bone;

            return (
              <button
                key={n}
                type="button"
                disabled={!isPlayable}
                onClick={() => isPlayable && onSelect(n)}
                style={{
                  ...styles.card,
                  background: fill,
                  boxShadow: `3px 3px 0 ${shadowColor}, 0 0 0 2px ${stroke}, 0 0 0 4px ${PAL.ink}`,
                  cursor: isPlayable ? "pointer" : "not-allowed",
                  opacity: isLocked ? 0.7 : 1,
                }}
              >
                <div style={{ ...styles.cardLabel, color: stroke }}>STAGE</div>
                <div style={{ ...styles.cardNum, color: numColor }}>
                  {String(n).padStart(2, "0")}
                </div>
                <div style={styles.cardStatus}>
                  {isLocked ? (
                    <LockIcon width={14} height={14} />
                  ) : isCleared ? (
                    <span style={{ ...styles.statusInner, color: PAL.moss }}>
                      <CheckIcon width={12} height={12} />
                      <span>CLEAR</span>
                    </span>
                  ) : (
                    <span style={{ color: PAL.bone2 }}>READY</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p style={styles.note}>
          ◆ 雑魚 90 秒 → ボス戦 ◆
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
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
    gap: 8,
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
    textShadow: `0 0 8px rgba(240,196,74,0.5)`,
  },
  headerSideBtn: {
    background: "transparent",
    border: "none",
    color: "#7a6a8a",
    cursor: "pointer",
    fontFamily: PX_FONT,
    fontSize: 9,
    letterSpacing: 2,
    padding: "4px 6px",
    display: "inline-flex", alignItems: "center", gap: 4,
    flexShrink: 0,
  },
  gridWrap: {
    padding: "20px 16px",
    maxWidth: 720,
    margin: "0 auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  card: {
    border: "none",
    padding: "20px 8px",
    color: PAL.bone,
    fontFamily: JP_FONT,
    minHeight: 110,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cardLabel: {
    fontFamily: PX_FONT,
    fontSize: 9,
    letterSpacing: 2,
  },
  cardNum: {
    fontFamily: PX_FONT,
    fontSize: 32,
    lineHeight: 1,
    letterSpacing: 2,
    textShadow: `0 0 10px rgba(232,217,184,0.3)`,
  },
  cardStatus: {
    fontFamily: PX_FONT,
    fontSize: 8,
    color: PAL.bone2,
    letterSpacing: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 14,
    marginTop: 2,
  },
  statusInner: { display: "inline-flex", alignItems: "center", gap: 4 },
  note: {
    textAlign: "center",
    color: PAL.bone2,
    fontFamily: PX_FONT,
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 22,
  },
};
