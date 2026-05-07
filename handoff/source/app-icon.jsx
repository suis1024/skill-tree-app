// iOS App Icon variants — 1024×1024 each.
// All rendered as fixed 240px squares for the canvas; the actual export
// would be 1024×1024.

const ICON_FONT = '"Press Start 2P", monospace';

// ── Variant A: Hero silhouette + glowing skill tree behind ─────
function IconA({ size = 240 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'radial-gradient(circle at 50% 35%, #3a1a4a 0%, #1a0820 55%, #050309 100%)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {/* tree silhouette */}
      <svg width="100%" height="100%" viewBox="0 0 240 240" style={{ position: 'absolute', inset: 0, opacity: 0.7 }}
        shapeRendering="crispEdges">
        <g stroke="#a06ad4" strokeWidth="3" fill="none" opacity="0.6">
          <line x1="120" y1="50" x2="60" y2="120" />
          <line x1="120" y1="50" x2="180" y2="120" />
          <line x1="60" y1="120" x2="40" y2="200" />
          <line x1="180" y1="120" x2="200" y2="200" />
          <line x1="120" y1="50" x2="120" y2="160" />
          <line x1="120" y1="160" x2="80" y2="220" />
          <line x1="120" y1="160" x2="160" y2="220" />
        </g>
        {[
          [120, 50, '#f0c44a', 8],
          [60, 120, '#c63838', 6],
          [180, 120, '#5cb8e8', 6],
          [120, 160, '#8fb068', 6],
          [40, 200, '#c63838', 5],
          [200, 200, '#5cb8e8', 5],
          [80, 220, '#a06ad4', 5],
          [160, 220, '#a06ad4', 5],
        ].map(([x, y, c, r], i) => (
          <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} fill={c} />
        ))}
      </svg>
      {/* hero in center */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -42%)' }}>
        <HeroSprite scale={9} />
      </div>
    </div>
  );
}

// ── Variant B: Big bold "S" + crossed weapons ────────────────────
function IconB({ size = 240 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'linear-gradient(135deg, #c63838 0%, #7a1a1a 100%)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {/* pixel scanlines */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x="0" y={i * 10} width="100%" height="2" fill="#0a0612" />
        ))}
      </svg>
      {/* big pixel S */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: ICON_FONT, fontSize: 160, color: '#f0c44a',
        textShadow: '8px 8px 0 #4a0a0a, 0 0 24px rgba(240,196,74,0.5)',
        letterSpacing: -8,
      }}>S</div>
      {/* corner badge */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        textAlign: 'center', fontFamily: ICON_FONT, fontSize: 12,
        color: '#e8d9b8', letterSpacing: 3,
        textShadow: '2px 2px 0 #4a0a0a',
      }}>SHOOTER</div>
    </div>
  );
}

// ── Variant C: Skill node abstract — clean & iconic ──────────────
function IconC({ size = 240 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'linear-gradient(180deg, #1a0f24 0%, #0a0612 100%)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 240 240" shapeRendering="crispEdges">
        {/* connecting lines */}
        <g stroke="#5a3a8a" strokeWidth="6">
          <line x1="120" y1="120" x2="60" y2="60" />
          <line x1="120" y1="120" x2="180" y2="60" />
          <line x1="120" y1="120" x2="60" y2="180" />
          <line x1="120" y1="120" x2="180" y2="180" />
        </g>
        {/* outer nodes */}
        {[
          [60, 60, '#c63838'],
          [180, 60, '#5cb8e8'],
          [60, 180, '#8fb068'],
          [180, 180, '#f0c44a'],
        ].map(([x, y, c], i) => (
          <g key={i}>
            <rect x={x - 18} y={y - 18} width="36" height="36" fill="#0a0612" stroke={c} strokeWidth="4" />
            <rect x={x - 8} y={y - 8} width="16" height="16" fill={c} />
          </g>
        ))}
        {/* center node — bigger, gold */}
        <rect x="92" y="92" width="56" height="56" fill="#1a0f24" stroke="#f0c44a" strokeWidth="6" />
        <rect x="106" y="106" width="28" height="28" fill="#f0c44a" />
        <rect x="114" y="114" width="12" height="12" fill="#fff2a8" />
      </svg>
    </div>
  );
}

Object.assign(window, { IconA, IconB, IconC });
