// Title screen variants — v2
// All three share the Gameplay C aesthetic:
//   - neon glow on key elements
//   - parchment (#e8d9b8) + blood red (#c63838) + gold (#f0c44a) + rune purple (#a06ad4)
//   - CRT scanlines overlay
//   - stone arena / brick texture undertone
// Subtitle: "樹は灰から育つ"

const T_PX = '"Press Start 2P", "DotGothic16", monospace';
const T_JP = '"DotGothic16", "Press Start 2P", monospace';
const T_INK = '#0a0612';

// ─── Shared bits ─────────────────────────────────────────────────
function CRTScanlines({ opacity = 0.18 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `repeating-linear-gradient(0deg, rgba(0,0,0,${opacity}) 0 1px, transparent 1px 3px)`,
      mixBlendMode: 'multiply', zIndex: 50,
    }} />
  );
}

function CRTVignette() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10,6,18,0.85) 100%)',
      zIndex: 49,
    }} />
  );
}

// Big logo: SKILL TREE (small, gold) + SHOOTER (huge, red, neon)
function LogoNeon({ scale = 1, accent = '#c63838', accentDark = '#4a0a0a' }) {
  return (
    <div style={{ textAlign: 'center', lineHeight: 1 }}>
      <div style={{
        fontFamily: T_PX,
        fontSize: 16 * scale,
        color: '#f0c44a',
        letterSpacing: 3,
        marginBottom: 8 * scale,
        textShadow: '0 0 10px rgba(240,196,74,0.6), 2px 2px 0 #4a2a0a',
      }}>
        SKILL TREE
      </div>
      <div style={{
        fontFamily: T_PX,
        fontSize: 44 * scale,
        color: accent,
        letterSpacing: 4,
        textShadow: `0 0 18px ${accent}aa, 0 0 32px ${accent}66, 4px 4px 0 ${accentDark}`,
      }}>
        SHOOTER
      </div>
    </div>
  );
}

function SubtitleScroll({ text = '樹は灰から育つ' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
      <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #c4b08a)' }} />
      <div style={{
        fontFamily: T_JP, fontSize: 12, color: '#c4b08a',
        letterSpacing: 5, textShadow: '0 0 6px rgba(196,176,138,0.4)',
      }}>
        {text}
      </div>
      <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, #c4b08a, transparent)' }} />
    </div>
  );
}

// Pixel ornamental corner (neon rune)
function CornerRune({ pos, color = '#a06ad4' }) {
  // pos = {top|bottom, left|right} in px
  const style = {
    position: 'absolute',
    ...pos,
    width: 16, height: 16,
    pointerEvents: 'none',
  };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" style={style}>
      <g fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
        <rect x="6" y="0" width="4" height="2" />
        <rect x="0" y="6" width="2" height="4" />
        <rect x="14" y="6" width="2" height="4" />
        <rect x="6" y="14" width="4" height="2" />
        <rect x="6" y="6" width="4" height="4" />
      </g>
    </svg>
  );
}

// Neon pixel button
function NeonButton({ children, primary, accent = '#c63838' }) {
  if (primary) {
    return (
      <button style={{
        fontFamily: T_PX, fontSize: 14, letterSpacing: 3,
        color: '#0a0612', background: '#f0c44a',
        border: 'none', padding: '14px 38px', cursor: 'pointer',
        boxShadow: `0 0 20px rgba(240,196,74,0.6), 4px 4px 0 #7a4a0a, 0 0 0 2px #0a0612`,
      }}>{children}</button>
    );
  }
  return (
    <button style={{
      fontFamily: T_PX, fontSize: 10, letterSpacing: 2,
      color: '#e8d9b8', background: 'rgba(26,15,36,0.7)',
      border: 'none', padding: '10px 22px', cursor: 'pointer',
      boxShadow: `3px 3px 0 #050309, 0 0 0 1.5px ${accent}, 0 0 12px ${accent}66`,
    }}>{children}</button>
  );
}

// Brick floor texture (matches Gameplay C)
function BrickFloor({ opacity = 0.4 }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity }}>
      <defs>
        <pattern id="t-bricks" width="48" height="20" patternUnits="userSpaceOnUse">
          <path d="M 0 10 L 48 10 M 24 0 L 24 10 M 0 20 L 0 10 M 48 20 L 48 10 M 12 10 L 12 20 M 36 10 L 36 20"
            stroke="#3a2a4a" strokeWidth="0.8" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#t-bricks)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Variant A — "Altar"
// 中央に祭壇に立てかけられた剣、地面から立ちのぼる紫のオーラ。
// CRT スキャンライン + レンガ床 + コーナー・ルーン。最もミニマル。
// ─────────────────────────────────────────────────────────────────
function TitleAltar() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 70%, #2a1240 0%, #1a0820 35%, #0a0612 75%)',
      color: '#e8d9b8',
    }}>
      <BrickFloor opacity={0.3} />

      {/* Vertical shafts of light */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0, width: 180,
        transform: 'translateX(-50%)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(160,106,212,0.18) 40%, rgba(160,106,212,0.32) 70%, transparent 100%)',
        filter: 'blur(2px)',
      }} />

      {/* Floating ash particles */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {Array.from({ length: 28 }).map((_, i) => {
          const x = (i * 47 + 23) % 390;
          const y = (i * 73 + 11) % 844;
          const s = (i % 3) + 1;
          const colors = ['#e8d9b8', '#a06ad4', '#f0c44a'];
          const c = colors[i % 3];
          return <rect key={i} x={x} y={y} width={s} height={s} fill={c} opacity={0.4 + (i % 3) * 0.15} />;
        })}
      </svg>

      {/* Center: altar pedestal + sword */}
      <div style={{
        position: 'absolute', left: '50%', top: 320, transform: 'translateX(-50%)',
        zIndex: 5,
      }}>
        {/* Sword (use existing CrossedWeapons lite) — pixel-svg */}
        <svg width="120" height="200" viewBox="0 0 24 40" shapeRendering="crispEdges"
          style={{ filter: 'drop-shadow(0 0 12px rgba(240,196,74,0.6))' }}>
          {/* Blade */}
          <g fill="#0a0612">
            <rect x="10" y="2" width="4" height="22" />
          </g>
          <g fill="#e8d9b8">
            <rect x="11" y="3" width="2" height="20" />
          </g>
          <rect x="12" y="3" width="1" height="20" fill="#fff" opacity="0.5" />
          {/* Crossguard */}
          <rect x="6" y="22" width="12" height="2" fill="#0a0612" />
          <rect x="7" y="22" width="10" height="1" fill="#f0c44a" />
          {/* Grip */}
          <rect x="11" y="24" width="2" height="6" fill="#7a1a1a" />
          {/* Pommel */}
          <rect x="10" y="30" width="4" height="2" fill="#f0c44a" />
          <rect x="11" y="32" width="2" height="1" fill="#a87a1c" />
        </svg>
        {/* Pedestal pixel block */}
        <div style={{
          width: 140, height: 18, marginTop: -8, marginLeft: -10,
          background: '#3a2a4a',
          boxShadow: 'inset 0 -4px 0 #1a0f24, 0 4px 0 #0a0612, 0 8px 24px rgba(160,106,212,0.4)',
        }} />
        <div style={{
          width: 160, height: 8, marginLeft: -20,
          background: '#1a0f24',
          boxShadow: 'inset 0 -2px 0 #050309',
        }} />
        {/* Glow rune in front of pedestal */}
        <div style={{
          width: 12, height: 12, margin: '6px auto 0', background: '#a06ad4',
          boxShadow: '0 0 16px #a06ad4, 0 0 4px #fff',
        }} />
      </div>

      {/* Logo at top */}
      <div style={{
        position: 'absolute', top: 90, left: 0, right: 0, zIndex: 10,
      }}>
        <LogoNeon scale={0.85} />
        <div style={{ marginTop: 18 }}>
          <SubtitleScroll />
        </div>
      </div>

      {/* Buttons at bottom */}
      <div style={{
        position: 'absolute', bottom: 110, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 10,
      }}>
        <NeonButton primary>▶ START</NeonButton>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeonButton accent="#5cb8e8">CONTINUE</NeonButton>
          <NeonButton accent="#a06ad4">OPTIONS</NeonButton>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: T_PX, fontSize: 7, color: '#5a4670', letterSpacing: 3, zIndex: 10,
      }}>
        v0.1 · TAP ANYWHERE
      </div>

      {/* Corners */}
      <CornerRune pos={{ top: 14, left: 14 }} />
      <CornerRune pos={{ top: 14, right: 14 }} />
      <CornerRune pos={{ bottom: 14, left: 14 }} />
      <CornerRune pos={{ bottom: 14, right: 14 }} />

      <CRTVignette />
      <CRTScanlines />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Variant B — "Tree of Ash"
// 中央に巨大なピクセルの樹。枝先にスキルノードが灯る。
// プレイヤー (HeroSprite) が樹の根元に立つ。Gameplay C と完全に同じ世界。
// ─────────────────────────────────────────────────────────────────
function TitleTree() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 50%, #1a0820 0%, #0a0612 70%)',
      color: '#e8d9b8',
    }}>
      <BrickFloor opacity={0.25} />

      {/* The tree — drawn as a pixel SVG */}
      <svg width="100%" height="100%" viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {/* Trunk */}
        <g fill="#1a0f24" stroke="#0a0612" strokeWidth="1">
          <rect x="186" y="380" width="18" height="280" />
          <rect x="180" y="660" width="30" height="6" />
        </g>
        {/* Bark highlight */}
        <rect x="190" y="380" width="2" height="280" fill="#3a2a4a" />

        {/* Roots */}
        <g fill="#1a0f24" stroke="#0a0612" strokeWidth="1">
          <rect x="160" y="660" width="20" height="6" />
          <rect x="150" y="666" width="18" height="4" />
          <rect x="210" y="660" width="20" height="6" />
          <rect x="222" y="666" width="18" height="4" />
        </g>

        {/* Branches — angular pixel limbs */}
        <g stroke="#1a0f24" strokeWidth="6" fill="none" strokeLinecap="square">
          {/* Left main */}
          <path d="M 195 460 L 130 420 L 90 360" />
          <path d="M 130 420 L 110 460" />
          <path d="M 90 360 L 70 320" />
          <path d="M 90 360 L 100 290" />
          {/* Right main */}
          <path d="M 195 440 L 260 400 L 300 340" />
          <path d="M 260 400 L 280 440" />
          <path d="M 300 340 L 320 300" />
          <path d="M 300 340 L 290 270" />
          {/* Top */}
          <path d="M 195 380 L 195 280" />
          <path d="M 195 320 L 170 280" />
          <path d="M 195 320 L 220 280" />
        </g>

        {/* Ember-glow nodes on branch tips */}
        {[
          [70, 320, '#c63838'],   // weapon red
          [100, 290, '#c63838'],
          [110, 460, '#5cb8e8'],  // guard blue
          [320, 300, '#5cb8e8'],
          [290, 270, '#f0c44a'],  // gold core
          [280, 440, '#8fb068'],  // econ green
          [170, 280, '#a06ad4'],
          [220, 280, '#a06ad4'],
          [195, 280, '#f0c44a'],  // top crown
        ].map(([x, y, c], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="14" fill={c} opacity="0.18" />
            <circle cx={x} cy={y} r="8" fill={c} opacity="0.35" />
            <rect x={x - 3} y={y - 3} width="6" height="6" fill={c} />
            <rect x={x - 1} y={y - 1} width="2" height="2" fill="#fff" />
          </g>
        ))}

        {/* Falling ashes */}
        {Array.from({ length: 22 }).map((_, i) => {
          const x = (i * 53 + 17) % 390;
          const y = (i * 89 + 31) % 844;
          const s = (i % 3) + 1;
          return <rect key={`ash-${i}`} x={x} y={y} width={s} height={s} fill="#e8d9b8" opacity={0.3 + (i % 2) * 0.2} />;
        })}
      </svg>

      {/* Hero at the trunk */}
      <div style={{
        position: 'absolute', left: '50%', top: 600, transform: 'translateX(-50%)',
        zIndex: 5, filter: 'drop-shadow(0 0 8px rgba(240,196,74,0.4))',
      }}>
        <HeroSprite scale={3} />
      </div>

      {/* Logo + subtitle (top) */}
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0, zIndex: 10,
      }}>
        <LogoNeon scale={0.78} />
        <div style={{ marginTop: 16 }}>
          <SubtitleScroll />
        </div>
      </div>

      {/* CTA — pinned bottom */}
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <NeonButton primary>▶ START</NeonButton>
        <div style={{ display: 'flex', gap: 16, marginTop: 4,
          fontFamily: T_PX, fontSize: 8, color: '#7a6a8a', letterSpacing: 2 }}>
          <span>CONTINUE</span>
          <span style={{ color: '#3a2a4a' }}>·</span>
          <span>OPTIONS</span>
          <span style={{ color: '#3a2a4a' }}>·</span>
          <span>CREDITS</span>
        </div>
      </div>

      <CornerRune pos={{ top: 14, left: 14 }} color="#c63838" />
      <CornerRune pos={{ top: 14, right: 14 }} color="#5cb8e8" />
      <CornerRune pos={{ bottom: 14, left: 14 }} color="#8fb068" />
      <CornerRune pos={{ bottom: 14, right: 14 }} color="#a06ad4" />

      <CRTVignette />
      <CRTScanlines />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Variant C — "Press Start"
// アーケード筐体風。INSERT COIN モチーフ。点滅 PRESS START。
// 上部にゲームプレイのスナップ (敵のシルエット & 弾) が見える。
// ─────────────────────────────────────────────────────────────────
function TitleArcade() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#0a0612',
      color: '#e8d9b8',
    }}>
      {/* Top half: gameplay window inside a frame */}
      <div style={{
        position: 'absolute', top: 50, left: 24, right: 24, height: 280,
        background: 'radial-gradient(ellipse at 50% 50%, #2a0a30 0%, #0a0612 80%)',
        boxShadow: 'inset 0 0 0 2px #5a4670, 0 0 0 4px #0a0612, 0 0 0 6px #f0c44a, 0 0 24px rgba(240,196,74,0.4)',
        overflow: 'hidden',
      }}>
        {/* Inner brick floor */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <BrickFloor opacity={0.6} />
        </div>

        {/* Player (triangle with neon + parchment core) */}
        <svg width="100%" height="100%" viewBox="0 0 342 280" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0 }}>
          {/* Player */}
          <g transform="translate(171, 160)">
            <g opacity="0.5">
              <polygon points="22,0 -22,-15 -22,15" fill="#38bdf8" transform="scale(1.3)" />
            </g>
            <polygon points="14,0 -14,-10 -14,10" fill="#38bdf8" stroke="#0a0612" strokeWidth="2" />
            <polygon points="6,0 -6,-4 -6,4" fill="#e8d9b8" opacity="0.8" />
          </g>
          {/* Bullets */}
          <g>
            {[[200, 145], [225, 130], [250, 115], [145, 145], [120, 130], [95, 115]].map(([x, y], i) => (
              <g key={i}>
                <rect x={x - 6} y={y - 6} width="12" height="12" fill="#facc15" opacity="0.3" />
                <rect x={x - 3} y={y - 3} width="6" height="6" fill="#facc15" stroke="#0a0612" strokeWidth="1" />
              </g>
            ))}
          </g>
          {/* Enemies (silhouettes) */}
          {[
            { shape: 'rect', x: 60, y: 80, c: '#ef4444', s: 22 },
            { shape: 'rect', x: 280, y: 90, c: '#ef4444', s: 22 },
            { shape: 'pentagon', x: 50, y: 220, c: '#9333ea', s: 24 },
            { shape: 'diamond', x: 290, y: 220, c: '#fbbf24', s: 20 },
          ].map((e, i) => {
            const h = e.s / 2;
            let pts;
            if (e.shape === 'rect') pts = `${-h},${-h} ${h},${-h} ${h},${h} ${-h},${h}`;
            else if (e.shape === 'pentagon') {
              const arr = [];
              for (let k = 0; k < 5; k++) {
                const a = (Math.PI * 2 * k) / 5 - Math.PI / 2;
                arr.push(`${Math.cos(a) * h},${Math.sin(a) * h}`);
              }
              pts = arr.join(' ');
            } else if (e.shape === 'diamond') {
              pts = `0,${-h} ${h},0 0,${h} ${-h},0`;
            }
            return (
              <g key={i} transform={`translate(${e.x}, ${e.y})`}>
                <g opacity="0.4">
                  <polygon points={pts} fill={e.c} transform="scale(1.4)" />
                </g>
                <polygon points={pts} fill={e.c} stroke="#0a0612" strokeWidth="2" />
                <polygon points={pts} fill="#e8d9b8" opacity="0.5" transform="scale(0.4)" />
              </g>
            );
          })}
        </svg>

        {/* Inner CRT scanlines */}
        <CRTScanlines opacity={0.22} />
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,6,18,0.5) 100%)',
          pointerEvents: 'none' }} />
      </div>

      {/* "DEMO" tag in window corner */}
      <div style={{
        position: 'absolute', top: 60, left: 36,
        fontFamily: T_PX, fontSize: 7, color: '#f0c44a', letterSpacing: 2,
        textShadow: '0 0 6px rgba(240,196,74,0.7)',
      }}>
        ▸ DEMO
      </div>

      {/* Logo + subtitle below window */}
      <div style={{
        position: 'absolute', top: 360, left: 0, right: 0, zIndex: 10,
        textAlign: 'center',
      }}>
        <LogoNeon scale={0.85} />
        <div style={{ marginTop: 18 }}>
          <SubtitleScroll />
        </div>
      </div>

      {/* CTA: blinking PRESS START */}
      <div style={{
        position: 'absolute', bottom: 180, left: 0, right: 0,
        textAlign: 'center', zIndex: 10,
      }}>
        <div style={{
          fontFamily: T_PX, fontSize: 18, color: '#f0c44a', letterSpacing: 6,
          textShadow: '0 0 12px rgba(240,196,74,0.8), 3px 3px 0 #4a2a0a',
          animation: 'arcade-blink 1.2s steps(2) infinite',
        }}>
          PRESS START
        </div>
        <style>{`
          @keyframes arcade-blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0.25; }
          }
        `}</style>
      </div>

      {/* Bottom: insert coin row */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, zIndex: 10,
      }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#f0c44a',
          boxShadow: '0 0 10px #f0c44a, inset -2px -2px 0 #a87a1c' }} />
        <span style={{ fontFamily: T_PX, fontSize: 9, color: '#c4b08a', letterSpacing: 3 }}>
          INSERT · COIN · TO · BEGIN
        </span>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#f0c44a',
          boxShadow: '0 0 10px #f0c44a, inset -2px -2px 0 #a87a1c' }} />
      </div>

      {/* High score / credits row */}
      <div style={{
        position: 'absolute', bottom: 36, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-around',
        fontFamily: T_PX, fontSize: 8, color: '#7a6a8a', letterSpacing: 2, zIndex: 10,
      }}>
        <span>HI · <span style={{ color: '#c63838' }}>014250</span></span>
        <span>1P · <span style={{ color: '#5cb8e8' }}>READY</span></span>
        <span>CREDITS · <span style={{ color: '#f0c44a' }}>03</span></span>
      </div>

      {/* Outer scanlines */}
      <CRTScanlines opacity={0.12} />
    </div>
  );
}

Object.assign(window, { TitleAltar, TitleTree, TitleArcade });
