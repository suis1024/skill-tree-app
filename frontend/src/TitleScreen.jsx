// 起動直後のタイトル画面 (TitleArcade デザイン)。
// design handoff (handoff/source/title-v2.jsx の TitleArcade) を移植したもの。

import { useEffect, useState } from "react";
import { startBgm } from "./bgm";
import { PAL, PX_FONT, JP_FONT } from "./pixel/PixelArt";

const T_INK = PAL.ink;

// ─── Reusable bits ───────────────────────────────────────────────
function CRTScanlines({ opacity = 0.18 }) {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      background: `repeating-linear-gradient(0deg, rgba(0,0,0,${opacity}) 0 1px, transparent 1px 3px)`,
      mixBlendMode: "multiply", zIndex: 50,
    }} />
  );
}

function LogoNeon({ scale = 0.85 }) {
  return (
    <div style={{ textAlign: "center", lineHeight: 1 }}>
      <div style={{
        fontFamily: PX_FONT, fontSize: 16 * scale, color: PAL.gold,
        letterSpacing: 3, marginBottom: 8 * scale,
        textShadow: "0 0 10px rgba(240,196,74,0.6), 2px 2px 0 #4a2a0a",
      }}>
        SKILL TREE
      </div>
      <div style={{
        fontFamily: PX_FONT, fontSize: 44 * scale, color: PAL.blood,
        letterSpacing: 4,
        textShadow: `0 0 18px ${PAL.blood}aa, 0 0 32px ${PAL.blood}66, 4px 4px 0 #4a0a0a`,
      }}>
        SHOOTER
      </div>
    </div>
  );
}

function SubtitleScroll({ text = "樹は灰から育つ" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
      <div style={{ width: 28, height: 1, background: "linear-gradient(90deg, transparent, #c4b08a)" }} />
      <div style={{
        fontFamily: JP_FONT, fontSize: 12, color: PAL.bone2,
        letterSpacing: 5, textShadow: "0 0 6px rgba(196,176,138,0.4)",
      }}>
        {text}
      </div>
      <div style={{ width: 28, height: 1, background: "linear-gradient(90deg, #c4b08a, transparent)" }} />
    </div>
  );
}

function BrickFloor({ opacity = 0.6 }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <pattern id="brick-pattern" width="48" height="20" patternUnits="userSpaceOnUse">
          <path d="M 0 10 L 48 10 M 24 0 L 24 10 M 0 20 L 0 10 M 48 20 L 48 10 M 12 10 L 12 20 M 36 10 L 36 20"
            stroke={PAL.shadow} strokeWidth="0.8" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#brick-pattern)" />
    </svg>
  );
}

function DemoWindow() {
  return (
    <div style={styles.demoWrap}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <BrickFloor opacity={0.6} />
      </div>
      <svg width="100%" height="100%" viewBox="0 0 342 280" preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}>
        {/* Player */}
        <g transform="translate(171, 160)">
          <g opacity="0.5">
            <polygon points="22,0 -22,-15 -22,15" fill="#38bdf8" transform="scale(1.3)" />
          </g>
          <polygon points="14,0 -14,-10 -14,10" fill="#38bdf8" stroke={T_INK} strokeWidth="2" />
          <polygon points="6,0 -6,-4 -6,4" fill={PAL.bone} opacity="0.8" />
        </g>
        {/* Bullets */}
        {[[200, 145], [225, 130], [250, 115], [145, 145], [120, 130], [95, 115]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 6} y={y - 6} width="12" height="12" fill="#facc15" opacity="0.3" />
            <rect x={x - 3} y={y - 3} width="6" height="6" fill="#facc15" stroke={T_INK} strokeWidth="1" />
          </g>
        ))}
        {/* Enemies */}
        {[
          { shape: "rect", x: 60, y: 80, c: "#ef4444", s: 22 },
          { shape: "rect", x: 280, y: 90, c: "#ef4444", s: 22 },
          { shape: "pentagon", x: 50, y: 220, c: "#9333ea", s: 24 },
          { shape: "diamond", x: 290, y: 220, c: "#fbbf24", s: 20 },
        ].map((e, i) => {
          const h = e.s / 2;
          let pts;
          if (e.shape === "rect") pts = `${-h},${-h} ${h},${-h} ${h},${h} ${-h},${h}`;
          else if (e.shape === "pentagon") {
            const arr = [];
            for (let k = 0; k < 5; k++) {
              const a = (Math.PI * 2 * k) / 5 - Math.PI / 2;
              arr.push(`${Math.cos(a) * h},${Math.sin(a) * h}`);
            }
            pts = arr.join(" ");
          } else {
            pts = `0,${-h} ${h},0 0,${h} ${-h},0`;
          }
          return (
            <g key={i} transform={`translate(${e.x}, ${e.y})`}>
              <g opacity="0.4">
                <polygon points={pts} fill={e.c} transform="scale(1.4)" />
              </g>
              <polygon points={pts} fill={e.c} stroke={T_INK} strokeWidth="2" />
              <polygon points={pts} fill={PAL.bone} opacity="0.5" transform="scale(0.4)" />
            </g>
          );
        })}
      </svg>
      <CRTScanlines opacity={0.22} />
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,6,18,0.5) 100%)",
        pointerEvents: "none" }} />
    </div>
  );
}

export default function TitleScreen({ onStart }) {
  const [showHelp, setShowHelp] = useState(false);

  // iOS WebView は autoplay を弾くので、タイトル表示時 + 画面タップ時に試行する。
  useEffect(() => { startBgm(); }, []);

  return (
    <div style={styles.wrap} onPointerDown={() => startBgm()}>
      <DemoWindow />

      {/* DEMO タグ */}
      <div style={styles.demoTag}>▸ DEMO</div>

      {/* ロゴ + サブタイトル */}
      <div style={styles.logoArea}>
        <LogoNeon scale={0.85} />
        <div style={{ marginTop: 18 }}>
          <SubtitleScroll />
        </div>
      </div>

      {/* PRESS START (タップで開始) */}
      <button style={styles.pressStart} onClick={onStart} aria-label="開始">
        PRESS START
      </button>

      {/* INSERT COIN */}
      <div style={styles.coinRow}>
        <span style={styles.coinDot} />
        <span style={styles.coinText}>INSERT · COIN · TO · BEGIN</span>
        <span style={styles.coinDot} />
      </div>

      {/* High score / credits 風 */}
      <div style={styles.bottomRow}>
        <button type="button" onClick={() => setShowHelp(true)} style={styles.bottomLink}>
          HOW · TO · PLAY
        </button>
      </div>

      {/* Outer CRT */}
      <CRTScanlines opacity={0.12} />

      <style>{`
        @keyframes arcade-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
      `}</style>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function HelpModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: PX_FONT, color: PAL.gold, letterSpacing: 2 }}>HOW TO PLAY</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <Section title="操作">
          <p>画面を<b>ドラッグ</b>して移動。武器は<b>自動発射</b>。</p>
        </Section>
        <Section title="ゲームの流れ">
          <p>各ステージは <b>雑魚波 90 秒 → ボス戦</b>。ボスを倒すとクリア。全 10 ステージ。</p>
        </Section>
        <Section title="コインとスキル">
          <p>敵を倒すとコインが落ちる。死亡 / クリア時に<b>全額持ち帰り</b>。スキルツリーで<b>永続強化</b>。</p>
        </Section>
        <button style={styles.modalBtn} onClick={onClose}>CLOSE</button>
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
    background: PAL.ink,
    color: PAL.bone,
    overflow: "hidden",
    fontFamily: JP_FONT,
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  demoWrap: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 28px)",
    left: 24, right: 24, height: "32vh", minHeight: 220, maxHeight: 320,
    background: "radial-gradient(ellipse at 50% 50%, #2a0a30 0%, #0a0612 80%)",
    boxShadow: `inset 0 0 0 2px #5a4670, 0 0 0 4px ${PAL.ink}, 0 0 0 6px ${PAL.gold}, 0 0 24px rgba(240,196,74,0.4)`,
    overflow: "hidden",
  },
  demoTag: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 38px)",
    left: 36,
    fontFamily: PX_FONT, fontSize: 7, color: PAL.gold, letterSpacing: 2,
    textShadow: "0 0 6px rgba(240,196,74,0.7)",
    zIndex: 12,
  },
  logoArea: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 32vh + 60px)",
    left: 0, right: 0,
    textAlign: "center",
    zIndex: 10,
  },
  pressStart: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 25%)",
    left: "50%", transform: "translateX(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: PX_FONT, fontSize: 18, color: PAL.gold, letterSpacing: 6,
    textShadow: "0 0 12px rgba(240,196,74,0.8), 3px 3px 0 #4a2a0a",
    animation: "arcade-blink 1.2s steps(2) infinite",
    padding: "8px 16px",
    zIndex: 10,
  },
  coinRow: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 80px)",
    left: 0, right: 0,
    display: "flex", justifyContent: "center", alignItems: "center", gap: 14,
    zIndex: 10,
  },
  coinDot: {
    width: 14, height: 14, borderRadius: "50%", background: PAL.gold,
    boxShadow: `0 0 10px ${PAL.gold}, inset -2px -2px 0 ${PAL.goldDark}`,
  },
  coinText: { fontFamily: PX_FONT, fontSize: 9, color: PAL.bone2, letterSpacing: 3 },
  bottomRow: {
    position: "absolute",
    bottom: "calc(env(safe-area-inset-bottom) + 32px)",
    left: 0, right: 0,
    display: "flex", justifyContent: "center",
    zIndex: 10,
  },
  bottomLink: {
    background: "transparent", border: "none", cursor: "pointer",
    fontFamily: PX_FONT, fontSize: 9, color: PAL.bone2, letterSpacing: 2,
    padding: "6px 16px",
    textShadow: "0 0 4px rgba(196,176,138,0.4)",
  },

  // モーダル
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16, zIndex: 100,
    paddingTop: "calc(env(safe-area-inset-top) + 16px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
  },
  modal: {
    background: PAL.ink2, border: `2px solid ${PAL.gold}`, borderRadius: 4,
    padding: "16px 20px", maxWidth: 460, width: "100%",
    maxHeight: "100%", overflowY: "auto",
    color: PAL.bone, textAlign: "left",
    boxShadow: `0 0 24px rgba(240,196,74,0.3)`,
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${PAL.shadow}`,
  },
  closeBtn: {
    background: "transparent", color: PAL.bone, border: "none",
    fontSize: 22, lineHeight: 1, cursor: "pointer",
  },
  section: { marginTop: 12 },
  sectionTitle: {
    margin: "0 0 4px", fontSize: 10, color: PAL.gold,
    letterSpacing: 2, fontFamily: PX_FONT,
  },
  sectionBody: { fontSize: 13, color: PAL.bone, lineHeight: 1.6 },
  modalBtn: {
    display: "block", width: "100%", marginTop: 16,
    background: PAL.gold, color: PAL.ink, border: "none",
    padding: "12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: PX_FONT, letterSpacing: 2,
    boxShadow: `3px 3px 0 ${PAL.goldDark}`,
  },
};
