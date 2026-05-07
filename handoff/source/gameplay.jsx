// Gameplay screen mockups — same Phaser polygons, different visual treatments.
// All three keep the existing shape/size/physics; only fill, stroke, HUD and bg change.

const GP_PX = '"Press Start 2P", "DotGothic16", monospace';
const GP_JP = '"DotGothic16", "Press Start 2P", monospace';
const GP_INK = '#0a0612';

// ENEMY_TYPES mirrored from frontend/src/game/enemies.js + player triangle.
// Layout is hand-tuned to look like a busy mid-wave moment.
const GP_ACTORS = [
  // player at center
  { kind: 'player', x: 195, y: 440, size: 28, color: '#38bdf8', shape: 'triangle', rot: -0.2 },
  // grunts (rect, red)
  { kind: 'grunt', x: 70,  y: 180, size: 24, color: '#ef4444', shape: 'rect', rot: 0.3 },
  { kind: 'grunt', x: 320, y: 200, size: 24, color: '#ef4444', shape: 'rect', rot: -0.4 },
  { kind: 'grunt', x: 110, y: 260, size: 24, color: '#ef4444', shape: 'rect', rot: 0.7 },
  // swift (triangle, blue)
  { kind: 'swift', x: 280, y: 290, size: 18, color: '#60a5fa', shape: 'triangle', rot: 2.6 },
  { kind: 'swift', x: 60,  y: 380, size: 18, color: '#60a5fa', shape: 'triangle', rot: 0.4 },
  // tank (rect, purple, big)
  { kind: 'tank',  x: 260, y: 130, size: 36, color: '#a855f7', shape: 'rect', rot: 0.15 },
  // shooter (diamond, gold)
  { kind: 'shooter', x: 340, y: 380, size: 22, color: '#fbbf24', shape: 'diamond', rot: 0.5 },
  // bouncer (circle, teal)
  { kind: 'bouncer', x: 150, y: 600, size: 22, color: '#14b8a6', shape: 'circle', rot: 0 },
  // turret (pentagon, deep purple)
  { kind: 'turret', x: 320, y: 580, size: 26, color: '#9333ea', shape: 'pentagon', rot: 0.8 },
  // charger (wide-triangle, orange)
  { kind: 'charger', x: 80,  y: 530, size: 26, color: '#fb923c', shape: 'triangle_wide', rot: 1.7 },
];

// Bullets: yellow squares from player, scattered
const GP_BULLETS = [
  { x: 220, y: 410, size: 8 },
  { x: 245, y: 380, size: 8 },
  { x: 270, y: 350, size: 8 },
  { x: 170, y: 405, size: 8 },
  { x: 145, y: 380, size: 8 },
  { x: 195, y: 380, size: 8 },
  { x: 195, y: 350, size: 8 },
];

// Enemy bullets: small magenta circles
const GP_EBULLETS = [
  { x: 320, y: 420, r: 5 },
  { x: 295, y: 460, r: 5 },
  { x: 270, y: 500, r: 5 },
];

// Coins floating
const GP_COINS = [
  { x: 130, y: 470 },
  { x: 240, y: 510 },
  { x: 80,  y: 320 },
];

// ─── Shape renderer (matches shapes.js bbox math) ──────────────────
function GpShape({ shape, size, color, stroke, strokeW = 2, rot = 0,
                   innerCore = null, outerGlow = null }) {
  // Returns an svg <g> that draws the shape centered at (0,0).
  const half = size / 2;

  let path = null;
  if (shape === 'rect') {
    path = (
      <rect x={-half} y={-half} width={size} height={size}
        fill={color} stroke={stroke} strokeWidth={strokeW} />
    );
  } else if (shape === 'circle') {
    path = (
      <circle cx={0} cy={0} r={half}
        fill={color} stroke={stroke} strokeWidth={strokeW} />
    );
  } else {
    let pts;
    if (shape === 'triangle') {
      pts = [[half, 0], [-half, -half * 0.7], [-half, half * 0.7]];
    } else if (shape === 'triangle_wide') {
      pts = [[half, 0], [-half * 0.8, -half], [-half * 0.8, half]];
    } else if (shape === 'diamond') {
      pts = [[0, -half], [half, 0], [0, half], [-half, 0]];
    } else if (shape === 'pentagon') {
      pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        pts.push([Math.cos(a) * half, Math.sin(a) * half]);
      }
    } else if (shape === 'hexagon') {
      pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        pts.push([Math.cos(a) * half, Math.sin(a) * half]);
      }
    } else {
      pts = [[half, 0], [-half, -half], [-half, half]];
    }
    const ptsStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
    path = (
      <polygon points={ptsStr}
        fill={color} stroke={stroke} strokeWidth={strokeW} />
    );
  }

  return (
    <g transform={`rotate(${(rot * 180) / Math.PI})`}>
      {outerGlow}
      {path}
      {innerCore}
    </g>
  );
}

// ─── Helper: render all actors as svg ─────────────────────────────
function GpActorLayer({ treatment }) {
  // treatment = 'A' | 'B' | 'C'
  return (
    <svg width="100%" height="100%" viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Coins behind actors */}
      {GP_COINS.map((c, i) => (
        <g key={`c-${i}`} transform={`translate(${c.x}, ${c.y})`}>
          <circle r="7" fill="#f0c44a" stroke={treatment === 'A' ? '#1f2937' : '#0a0612'} strokeWidth="2" />
          <circle r="3" fill="#fff2a8" />
        </g>
      ))}

      {/* Enemy bullets */}
      {GP_EBULLETS.map((b, i) => (
        <g key={`eb-${i}`} transform={`translate(${b.x}, ${b.y})`}>
          {treatment === 'C' && (
            <circle r={b.r * 2} fill="#ec4899" opacity="0.35" />
          )}
          <circle r={b.r} fill="#ec4899" stroke={treatment === 'A' ? '#1f2937' : '#0a0612'} strokeWidth="1.5" />
        </g>
      ))}

      {/* Player bullets */}
      {GP_BULLETS.map((b, i) => (
        <g key={`b-${i}`} transform={`translate(${b.x}, ${b.y})`}>
          {treatment === 'C' && (
            <rect x={-b.size} y={-b.size} width={b.size * 2} height={b.size * 2}
              fill="#facc15" opacity="0.3" />
          )}
          <rect x={-b.size / 2} y={-b.size / 2} width={b.size} height={b.size}
            fill="#facc15" stroke={treatment === 'A' ? '#1f2937' : '#0a0612'} strokeWidth="1" />
        </g>
      ))}

      {/* Actors */}
      {GP_ACTORS.map((a, i) => {
        // Treatment-specific styling
        let stroke = '#0b1220';
        let strokeW = 2;
        let innerCore = null;
        let outerGlow = null;

        if (treatment === 'A') {
          // current style — thin dark stroke, no extras
          stroke = '#0b1220';
          strokeW = 2;
        } else if (treatment === 'B') {
          // dark pixel — heavy black stroke, lifted by 1px shadow square
          stroke = '#050309';
          strokeW = 3;
        } else if (treatment === 'C') {
          // neon + parchment core
          stroke = '#0a0612';
          strokeW = 2.5;
          // outer glow: same shape, bigger, low alpha
          outerGlow = (
            <g opacity="0.5">
              <GpShape shape={a.shape} size={a.size + 8} color={a.color}
                stroke="none" strokeW={0} />
            </g>
          );
          // inner highlight: small bone-colored shape
          innerCore = (
            <g opacity="0.7">
              <GpShape shape={a.shape} size={a.size * 0.45} color="#e8d9b8"
                stroke="none" strokeW={0} />
            </g>
          );
        }

        return (
          <g key={`a-${i}`} transform={`translate(${a.x}, ${a.y})`}>
            {treatment === 'B' && (
              // pixel drop shadow
              <g transform="translate(2, 2)" opacity="0.6">
                <GpShape shape={a.shape} size={a.size} color="#050309"
                  stroke="none" strokeW={0} rot={a.rot} />
              </g>
            )}
            <GpShape
              shape={a.shape} size={a.size} color={a.color}
              stroke={stroke} strokeW={strokeW} rot={a.rot}
              innerCore={innerCore} outerGlow={outerGlow}
            />
            {/* Tiny enemy hp bar above non-player */}
            {a.kind !== 'player' && (
              <g transform={`translate(0, ${-a.size / 2 - 8})`}>
                <rect x={-12} y={0} width="24" height="3" fill="#1f2937" />
                <rect x={-12} y={0} width={a.kind === 'tank' ? 22 : 18} height="3"
                  fill={treatment === 'C' ? '#ef4444' : '#22c55e'} />
              </g>
            )}
            {/* Player aim indicator */}
            {a.kind === 'player' && (
              <g opacity={treatment === 'C' ? 0.8 : 0.5}>
                <line x1="0" y1="0" x2="40" y2="-8" stroke="#38bdf8" strokeWidth="1.5"
                  strokeDasharray="3 3" transform={`rotate(${(a.rot * 180) / Math.PI})`} />
              </g>
            )}
          </g>
        );
      })}

      {/* Damage popups */}
      <g fontFamily={treatment === 'A' ? 'system-ui,sans-serif' : GP_PX} fontWeight="bold">
        <text x="265" y="115" fontSize={treatment === 'A' ? '14' : '11'}
          fill="#fef3c7" stroke="#1f2937" strokeWidth="3" paintOrder="stroke">8</text>
        <text x="115" y="160" fontSize={treatment === 'A' ? '22' : '16'}
          fill="#fb923c" stroke="#7c2d12" strokeWidth="3" paintOrder="stroke">24!</text>
        <text x="345" y="370" fontSize={treatment === 'A' ? '13' : '10'}
          fill="#fde047" stroke="#1f2937" strokeWidth="2" paintOrder="stroke">+2</text>
      </g>
    </svg>
  );
}

// ─── HUD variants ──────────────────────────────────────────────────
function GpHudA({ stage = 3, time = '00:42', hp = 88, maxHp = 120, coin = 247 }) {
  // Current minimal HUD — sans-serif, slate text
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      fontFamily: 'system-ui, sans-serif', color: '#e2e8f0' }}>
      <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 14, color: '#94a3b8' }}>
        HP {hp}/{maxHp}
      </div>
      <div style={{ position: 'absolute', top: 32, left: 16, fontSize: 18 }}>
        COIN: {coin}
      </div>
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        fontSize: 18, textAlign: 'center' }}>
        STAGE {stage}
      </div>
      <div style={{ position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
        fontSize: 18, textAlign: 'center' }}>
        BOSS in {time}
      </div>
      {/* Player hp bar (under triangle) */}
      <div style={{ position: 'absolute', left: 195 - 18, top: 440 + 22,
        width: 36, height: 4, background: '#1f2937' }}>
        <div style={{ width: `${(hp / maxHp) * 36}px`, height: 4, background: '#22c55e' }} />
      </div>
    </div>
  );
}

function GpHudB({ stage = 3, time = '00:42', hp = 88, maxHp = 120, coin = 247 }) {
  // Dark pixel HUD — chunky frames, Press Start 2P
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      fontFamily: GP_PX, color: '#e8d9b8' }}>
      {/* Top-left HP block */}
      <div style={{ position: 'absolute', top: 12, left: 12,
        background: '#1a0f24', padding: '6px 10px',
        boxShadow: '2px 2px 0 #050309, 0 0 0 2px #c63838' }}>
        <div style={{ fontSize: 7, color: '#7a6a8a', letterSpacing: 1, marginBottom: 3 }}>HP</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 60, height: 6, background: '#3a2a4a',
            boxShadow: 'inset 1px 1px 0 #050309' }}>
            <div style={{ width: `${(hp / maxHp) * 60}px`, height: 6, background: '#c63838' }} />
          </div>
          <span style={{ fontSize: 9 }}>{hp}</span>
        </div>
      </div>

      {/* Top-left coin */}
      <div style={{ position: 'absolute', top: 60, left: 12,
        background: '#1a0f24', padding: '5px 9px',
        boxShadow: '2px 2px 0 #050309, 0 0 0 2px #f0c44a',
        display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, background: '#f0c44a',
          boxShadow: 'inset -1px -1px 0 #a87a1c' }} />
        <span style={{ fontSize: 10, color: '#f0c44a', letterSpacing: 1 }}>{coin}</span>
      </div>

      {/* Top-center stage + timer */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: '#1a0f24', padding: '6px 14px', textAlign: 'center',
        boxShadow: '2px 2px 0 #050309, 0 0 0 2px #5a4670' }}>
        <div style={{ fontSize: 8, color: '#7a6a8a', letterSpacing: 2, marginBottom: 3 }}>STAGE {stage}</div>
        <div style={{ fontSize: 11, color: '#f0c44a', letterSpacing: 2 }}>BOSS {time}</div>
      </div>

      {/* Player hp bar */}
      <div style={{ position: 'absolute', left: 195 - 20, top: 440 + 22,
        width: 40, height: 5, background: '#050309',
        boxShadow: '0 0 0 1px #0a0612' }}>
        <div style={{ width: `${(hp / maxHp) * 40}px`, height: 5, background: '#22c55e' }} />
      </div>

      {/* Joystick (bottom-left) */}
      <div style={{ position: 'absolute', bottom: 80, left: 36,
        width: 96, height: 96, borderRadius: '50%',
        background: 'rgba(26,15,36,0.6)',
        boxShadow: 'inset 0 0 0 2px #5a4670, 0 0 0 2px #050309' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-25%, -50%)',
          width: 40, height: 40, borderRadius: '50%', background: '#c63838',
          boxShadow: 'inset -2px -2px 0 #7a1a1a, 2px 2px 0 #050309' }} />
      </div>
    </div>
  );
}

function GpHudC({ stage = 3, time = '00:42', hp = 88, maxHp = 120, coin = 247 }) {
  // Neon + parchment HUD — gold/red glow, ornate corners
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      fontFamily: GP_PX, color: '#e8d9b8' }}>
      {/* Top frame band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64,
        background: 'linear-gradient(180deg, rgba(10,6,18,0.9) 0%, rgba(10,6,18,0.4) 70%, transparent 100%)',
        borderBottom: '1px solid rgba(240,196,74,0.3)' }} />

      {/* Top-left: HP heart + bar */}
      <div style={{ position: 'absolute', top: 14, left: 14,
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 14, color: '#c63838',
          textShadow: '0 0 8px rgba(198,56,56,0.8)' }}>♥</div>
        <div>
          <div style={{ width: 80, height: 7,
            background: 'rgba(26,15,36,0.8)',
            border: '1px solid #c63838',
            boxShadow: '0 0 6px rgba(198,56,56,0.5)' }}>
            <div style={{ width: `${(hp / maxHp) * 78}px`, height: 5, background: '#c63838',
              margin: '1px', boxShadow: '0 0 4px rgba(198,56,56,0.9)' }} />
          </div>
          <div style={{ fontSize: 7, color: '#c4b08a', letterSpacing: 1, marginTop: 3 }}>
            {hp} / {maxHp}
          </div>
        </div>
      </div>

      {/* Top-right: coin */}
      <div style={{ position: 'absolute', top: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#f0c44a', letterSpacing: 1,
          textShadow: '0 0 6px rgba(240,196,74,0.7)' }}>{coin}</span>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f0c44a',
          boxShadow: '0 0 8px rgba(240,196,74,0.8), inset -2px -2px 0 #a87a1c' }} />
      </div>

      {/* Top-center: stage scroll */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center' }}>
        <div style={{ fontSize: 7, color: '#c4b08a', letterSpacing: 3 }}>━ STAGE {stage} ━</div>
        <div style={{ fontSize: 12, color: '#f0c44a', letterSpacing: 3, marginTop: 3,
          textShadow: '0 0 8px rgba(240,196,74,0.6), 2px 2px 0 #4a2a0a' }}>
          ◆ {time} ◆
        </div>
      </div>

      {/* Player hp bar — neon */}
      <div style={{ position: 'absolute', left: 195 - 20, top: 440 + 22,
        width: 40, height: 4,
        background: 'rgba(10,6,18,0.7)',
        boxShadow: '0 0 4px rgba(56,189,248,0.6)' }}>
        <div style={{ width: `${(hp / maxHp) * 40}px`, height: 4, background: '#22c55e',
          boxShadow: '0 0 4px rgba(34,197,94,0.9)' }} />
      </div>

      {/* Bottom corner ornaments */}
      <div style={{ position: 'absolute', bottom: 24, left: 16,
        fontSize: 9, color: '#7a6a8a', letterSpacing: 2,
        fontFamily: GP_JP }}>
        WAVE 7 / 12
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 16,
        fontSize: 9, color: '#a06ad4', letterSpacing: 2,
        fontFamily: GP_PX, textShadow: '0 0 6px rgba(160,106,212,0.6)' }}>
        ✦ COMBO x12
      </div>
    </div>
  );
}

// ─── Background variants ──────────────────────────────────────────
function GpBgA() {
  // Current — flat slate
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0f172a' }} />
  );
}

function GpBgB() {
  // Dark pixel grid floor
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0612' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="bg-grid-b" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1a0f24" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-grid-b)" />
      </svg>
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(10,6,18,0.7) 100%)' }} />
    </div>
  );
}

function GpBgC() {
  // Stone arena + scanlines + corner runes
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 50%, #1a0820 0%, #0a0612 70%)' }}>
      {/* Brick floor */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <defs>
          <pattern id="bricks" width="48" height="20" patternUnits="userSpaceOnUse">
            <rect width="48" height="20" fill="none" />
            <path d="M 0 10 L 48 10 M 24 0 L 24 10 M 0 20 L 0 10 M 48 20 L 48 10 M 12 10 L 12 20 M 36 10 L 36 20"
              stroke="#3a2a4a" strokeWidth="0.8" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bricks)" />
      </svg>
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)',
        mixBlendMode: 'multiply' }} />
      {/* Corner rune sparks */}
      <div style={{ position: 'absolute', top: 80, left: 20, width: 8, height: 8,
        background: '#a06ad4', boxShadow: '0 0 12px rgba(160,106,212,0.8)' }} />
      <div style={{ position: 'absolute', top: 80, right: 20, width: 8, height: 8,
        background: '#a06ad4', boxShadow: '0 0 12px rgba(160,106,212,0.8)' }} />
      <div style={{ position: 'absolute', bottom: 60, left: 20, width: 8, height: 8,
        background: '#a06ad4', boxShadow: '0 0 12px rgba(160,106,212,0.8)' }} />
      <div style={{ position: 'absolute', bottom: 60, right: 20, width: 8, height: 8,
        background: '#a06ad4', boxShadow: '0 0 12px rgba(160,106,212,0.8)' }} />
    </div>
  );
}

// ─── Compose full screens ─────────────────────────────────────────
function GameplayCurrent() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <GpBgA />
      <GpActorLayer treatment="A" />
      <GpHudA />
    </div>
  );
}

function GameplayB() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <GpBgB />
      <GpActorLayer treatment="B" />
      <GpHudB />
    </div>
  );
}

function GameplayC() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <GpBgC />
      <GpActorLayer treatment="C" />
      <GpHudC />
    </div>
  );
}

Object.assign(window, { GameplayCurrent, GameplayB, GameplayC });
