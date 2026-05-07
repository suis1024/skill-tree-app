// Title and Skill Tree screen variants — drop into iPhone frames.
//
// Two variants per screen, all sharing the pixel-art palette + fonts.

const PX_FONT = '"Press Start 2P", "DotGothic16", monospace';
const JP_FONT = '"DotGothic16", "Press Start 2P", monospace';
const BG_INK = '#0a0612';

// ─────────────────────────────────────────────────────────────
// Title — Variant A: animated bg + hero centerpiece
// ─────────────────────────────────────────────────────────────
function TitleA() {
  const W = 390;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(ellipse at 50% 30%, #2a1240 0%, ${BG_INK} 55%, #050309 100%)`,
      color: '#e8d9b8', fontFamily: PX_FONT, position: 'relative', overflow: 'hidden',
    }}>
      {/* Distant skill tree silhouette */}
      <svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.35 }} shapeRendering="crispEdges">
        <g stroke="#5a3a8a" strokeWidth="2" fill="none" opacity="0.6">
          <line x1="195" y1="180" x2="100" y2="320" />
          <line x1="195" y1="180" x2="290" y2="320" />
          <line x1="195" y1="180" x2="195" y2="340" />
          <line x1="100" y1="320" x2="50" y2="460" />
          <line x1="290" y1="320" x2="340" y2="460" />
          <line x1="195" y1="340" x2="120" y2="500" />
          <line x1="195" y1="340" x2="270" y2="500" />
        </g>
        <g shapeRendering="crispEdges">
          {[
            [195, 180, '#f0c44a', 6],
            [100, 320, '#c63838', 4],
            [290, 320, '#5cb8e8', 4],
            [195, 340, '#8fb068', 4],
            [50, 460, '#c63838', 3],
            [340, 460, '#5cb8e8', 3],
            [120, 500, '#a06ad4', 3],
            [270, 500, '#a06ad4', 3],
          ].map(([x, y, c, r], i) => (
            <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} fill={c} />
          ))}
        </g>
      </svg>

      {/* Pixel stars */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {Array.from({ length: 30 }).map((_, i) => {
          const x = (i * 73) % W;
          const y = (i * 41 + 17) % 844;
          const s = (i % 3) + 1;
          return <rect key={i} x={x} y={y} width={s} height={s} fill="#e8d9b8" opacity="0.35" />;
        })}
      </svg>

      {/* Center stack */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '60px 24px 40px',
        zIndex: 2,
      }}>
        <div style={{ marginBottom: 18, transform: 'scale(0.9)' }}>
          <CrossedWeapons scale={4} />
        </div>

        <div style={{
          fontFamily: PX_FONT, fontSize: 22, color: '#f0c44a',
          letterSpacing: 2, lineHeight: 1.2, textAlign: 'center',
          textShadow: '3px 3px 0 #7a4a0a, 0 0 16px rgba(240,196,74,0.4)',
          marginBottom: 8,
        }}>
          SKILL TREE
        </div>
        <div style={{
          fontFamily: PX_FONT, fontSize: 32, color: '#e8d9b8',
          letterSpacing: 3, lineHeight: 1, textAlign: 'center',
          textShadow: '4px 4px 0 #c63838, 0 0 24px rgba(232,217,184,0.3)',
          marginBottom: 36,
        }}>
          SHOOTER
        </div>

        <div style={{ fontFamily: JP_FONT, fontSize: 11, color: '#c4b08a',
          letterSpacing: 4, marginBottom: 60, opacity: 0.8 }}>
          ◆ 全方位シューティング × ローグライト ◆
        </div>

        {/* Buttons — chunky pixel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%' }}>
          <PixelButton primary>▶ START</PixelButton>
          <PixelButton>あそびかた</PixelButton>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 32, fontFamily: PX_FONT, fontSize: 8, color: '#5a4670', letterSpacing: 2 }}>
          PRESS ANYWHERE TO BEGIN
        </div>
      </div>
    </div>
  );
}

function PixelButton({ children, primary }) {
  return (
    <button style={{
      fontFamily: PX_FONT,
      fontSize: primary ? 14 : 10,
      color: primary ? '#0a0612' : '#e8d9b8',
      background: primary ? '#f0c44a' : '#1a0f24',
      border: 'none',
      padding: primary ? '14px 36px' : '10px 22px',
      letterSpacing: 2,
      cursor: 'pointer',
      boxShadow: primary
        ? '4px 4px 0 #7a4a0a, 0 0 0 2px #0a0612'
        : '3px 3px 0 #050309, 0 0 0 2px #5a4670',
      imageRendering: 'pixelated',
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Title — Variant B: gameplay loop bg
// ─────────────────────────────────────────────────────────────
function TitleB() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: BG_INK, color: '#e8d9b8',
      fontFamily: PX_FONT, position: 'relative', overflow: 'hidden',
    }}>
      {/* Top: arena window */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
        background: 'radial-gradient(circle at 50% 50%, #3a1a4a 0%, #1a0820 60%, #0a0612 100%)',
        overflow: 'hidden',
      }}>
        {/* Grid floor */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#5a3a8a" strokeWidth="0.5" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Hero in center */}
        <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <HeroSprite scale={5} />
        </div>

        {/* Enemies surrounding */}
        {[
          { top: '20%', left: '15%', c: '#c63838' },
          { top: '15%', left: '75%', c: '#c63838' },
          { top: '70%', left: '10%', c: '#a06ad4' },
          { top: '75%', left: '80%', c: '#5cb8e8' },
          { top: '25%', left: '50%', c: '#c63838' },
        ].map((p, i) => (
          <div key={i} style={{ position: 'absolute', top: p.top, left: p.left }}>
            <Bug scale={3} color={p.c} />
          </div>
        ))}

        {/* Bullet streaks */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} shapeRendering="crispEdges">
          {[[0, 'left'], [1, 'right']].map(([i]) => (
            <g key={i}>
              <rect x={140 + i * 80} y={130 + i * 20} width="4" height="2" fill="#f0c44a" />
              <rect x={130 + i * 100} y={150 + i * 15} width="6" height="2" fill="#f0c44a" />
            </g>
          ))}
        </svg>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,6,18,0.8) 100%)' }} />
      </div>

      {/* Bottom: title block */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '52%',
        padding: '40px 28px 50px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(180deg, transparent 0%, #0a0612 30%)',
      }}>
        <div style={{
          fontFamily: PX_FONT, fontSize: 18, color: '#f0c44a',
          letterSpacing: 1, marginBottom: 4, textAlign: 'center',
          textShadow: '2px 2px 0 #7a4a0a',
        }}>
          SKILL TREE
        </div>
        <div style={{
          fontFamily: PX_FONT, fontSize: 38, color: '#c63838',
          letterSpacing: 2, marginBottom: 14, textAlign: 'center',
          textShadow: '4px 4px 0 #4a0a0a, 0 0 20px rgba(198,56,56,0.5)',
        }}>
          SHOOTER
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 22, alignItems: 'center' }}>
          <div style={{ width: 12, height: 2, background: '#5a4670' }} />
          <div style={{ fontFamily: JP_FONT, fontSize: 10, color: '#c4b08a', letterSpacing: 3 }}>
            生きるな。育て。死ね。繰り返せ。
          </div>
          <div style={{ width: 12, height: 2, background: '#5a4670' }} />
        </div>

        <PixelButton primary>▶ START</PixelButton>

        <div style={{ display: 'flex', gap: 24, marginTop: 24, fontFamily: PX_FONT, fontSize: 8, color: '#7a6a8a', letterSpacing: 2 }}>
          <span>HOW TO</span>
          <span>·</span>
          <span>OPTIONS</span>
          <span>·</span>
          <span>CREDITS</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Skill Tree — Variant A: TAB-based, card nodes
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'weapon', label: '武器', en: 'WEAPON', color: '#c63838' },
  { id: 'defense', label: '防御', en: 'GUARD', color: '#5cb8e8' },
  { id: 'economy', label: '経済', en: 'COIN', color: '#8fb068' },
];

function SkillTreeA() {
  const [tab, setTab] = React.useState('weapon');
  const tabColor = TABS.find((t) => t.id === tab).color;

  const nodes = {
    weapon: [
      { name: 'ピストル威力', icon: 'sword', lv: 3, max: 5, cost: 100, status: 'owned' },
      { name: '発射速度', icon: 'pierce', lv: 2, max: 5, cost: 80, status: 'owned' },
      { name: 'クリ率', icon: 'target', lv: 1, max: 5, cost: 50, status: 'owned' },
      { name: '貫通', icon: 'pierce', lv: 0, max: 5, cost: 50, status: 'unlockable' },
      { name: '弾数 +1', icon: 'sword', lv: 0, max: 2, cost: 150, status: 'unlockable' },
      { name: '爆弾解放', icon: 'bomb', lv: 0, max: 1, cost: 80, status: 'unlockable' },
      { name: 'サンダー', icon: 'bolt', lv: 0, max: 1, cost: 150, status: 'locked', req: '威力 Lv2' },
      { name: 'ホーミング', icon: 'orbit', lv: 0, max: 1, cost: 100, status: 'locked', req: '速度 Lv2' },
      { name: 'オービタル', icon: 'orbit', lv: 0, max: 1, cost: 200, status: 'locked', req: '貫通 Lv1' },
    ],
    defense: [
      { name: '最大HP', icon: 'heart', lv: 2, max: 5, cost: 100, status: 'owned' },
      { name: 'HP回復', icon: 'heart', lv: 0, max: 5, cost: 50, status: 'unlockable' },
      { name: '移動速度', icon: 'boots', lv: 1, max: 5, cost: 50, status: 'owned' },
      { name: '被ダメ軽減', icon: 'shield', lv: 0, max: 5, cost: 100, status: 'locked', req: 'HP Lv2' },
      { name: '復活', icon: 'revive', lv: 0, max: 1, cost: 300, status: 'locked', req: '軽減 Lv2' },
    ],
    economy: [
      { name: 'コイン獲得', icon: 'coin', lv: 1, max: 5, cost: 50, status: 'owned' },
      { name: '磁力', icon: 'star', lv: 0, max: 5, cost: 50, status: 'unlockable' },
      { name: '開始ボーナス', icon: 'coin', lv: 0, max: 5, cost: 50, status: 'unlockable' },
      { name: 'リトライ', icon: 'revive', lv: 0, max: 5, cost: 100, status: 'locked', req: 'コイン Lv2' },
      { name: '幸運コイン', icon: 'star', lv: 0, max: 5, cost: 100, status: 'locked', req: '磁力 Lv2' },
    ],
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: BG_INK, color: '#e8d9b8',
      fontFamily: JP_FONT, display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '14px 16px 12px', borderBottom: `2px solid ${tabColor}`,
        background: 'linear-gradient(180deg, #1a0f24 0%, #0a0612 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, background: '#1a0f24', boxShadow: `2px 2px 0 ${tabColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PX_FONT, fontSize: 10, color: '#e8d9b8' }}>◀</div>
          <div style={{ fontFamily: PX_FONT, fontSize: 11, color: '#f0c44a', letterSpacing: 2 }}>
            SKILL TREE
          </div>
          <div style={{ width: 28, height: 28, background: '#1a0f24', boxShadow: `2px 2px 0 ${tabColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PX_FONT, fontSize: 10, color: '#e8d9b8' }}>≡</div>
        </div>

        {/* Coin + start */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1a0f24', padding: '6px 12px',
            boxShadow: '2px 2px 0 #7a4a0a, 0 0 0 2px #f0c44a' }}>
            <Coin scale={2} />
            <span style={{ fontFamily: PX_FONT, fontSize: 14, color: '#f0c44a', letterSpacing: 1 }}>1,247</span>
          </div>
          <button style={{
            fontFamily: PX_FONT, fontSize: 11, letterSpacing: 1,
            background: '#c63838', color: '#0a0612', border: 'none',
            padding: '8px 16px', boxShadow: '3px 3px 0 #4a0a0a, 0 0 0 2px #0a0612', cursor: 'pointer',
          }}>
            ▶ STAGE
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #1a0f24' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, fontFamily: PX_FONT, fontSize: 9, letterSpacing: 1,
            background: tab === t.id ? t.color : '#1a0f24',
            color: tab === t.id ? '#0a0612' : '#7a6a8a',
            border: 'none', padding: '10px 4px', cursor: 'pointer',
            borderBottom: tab === t.id ? `4px solid ${t.color}` : '4px solid transparent',
          }}>
            <div style={{ fontFamily: JP_FONT, fontSize: 13, marginBottom: 2 }}>{t.label}</div>
            <div>{t.en}</div>
          </button>
        ))}
      </div>

      {/* Node grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {nodes[tab].map((n, i) => (
            <SkillCard key={i} node={n} color={tabColor} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillCard({ node, color }) {
  const isLocked = node.status === 'locked';
  const isOwned = node.status === 'owned';
  const isMaxed = node.lv >= node.max;
  const bg = isLocked ? '#150b1c' : '#1a0f24';
  const border = isOwned ? color : isLocked ? '#3a2a4a' : color;
  const opacity = isLocked ? 0.45 : 1;

  return (
    <div style={{
      background: bg, padding: '10px 8px 8px',
      boxShadow: `3px 3px 0 ${isOwned ? '#050309' : '#050309'}, 0 0 0 2px ${border}`,
      position: 'relative', opacity, minHeight: 120,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* MAX ribbon */}
      {isMaxed && (
        <div style={{
          position: 'absolute', top: -8, right: -4,
          background: '#f0c44a', color: '#0a0612',
          fontFamily: PX_FONT, fontSize: 7, padding: '3px 5px',
          boxShadow: '2px 2px 0 #7a4a0a',
        }}>MAX</div>
      )}

      {/* Lock badge */}
      {isLocked && (
        <div style={{ position: 'absolute', top: 6, right: 6, fontFamily: PX_FONT, fontSize: 10, color: '#7a6a8a' }}>🔒</div>
      )}

      <div style={{ marginBottom: 6, marginTop: 4 }}>
        <NodeIcon kind={node.icon} scale={3} />
      </div>

      <div style={{ fontFamily: JP_FONT, fontSize: 11, color: '#e8d9b8', textAlign: 'center', marginBottom: 6, lineHeight: 1.2 }}>
        {node.name}
      </div>

      {/* Lv pips */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
        {Array.from({ length: node.max }).map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6,
            background: i < node.lv ? color : '#3a2a4a',
            boxShadow: i < node.lv ? `0 0 4px ${color}` : 'none',
          }} />
        ))}
      </div>

      <div style={{ fontFamily: PX_FONT, fontSize: 8, letterSpacing: 1,
        color: isLocked ? '#5a4670' : isMaxed ? '#7a6a8a' : '#f0c44a' }}>
        {isMaxed ? '— —' : isLocked ? node.req : `${node.cost}c`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Skill Tree — Variant B: vertical tree with pixel paths
// ─────────────────────────────────────────────────────────────
function SkillTreeB() {
  // Hand-laid out, simple pixel-tree
  const W = 360;
  const H = 1100;
  const C = { w: '#c63838', d: '#5cb8e8', e: '#8fb068' };

  // node format: { x, y, name, icon, cat, lv, max, status }
  const nodes = [
    // Weapon column
    { x: 60, y: 100, name: 'ピストル', icon: 'sword', cat: 'w', lv: 1, max: 1, status: 'owned' },
    { x: 60, y: 180, name: '威力', icon: 'sword', cat: 'w', lv: 3, max: 5, status: 'owned' },
    { x: 60, y: 260, name: '速度', icon: 'pierce', cat: 'w', lv: 2, max: 5, status: 'owned' },
    { x: 60, y: 340, name: '貫通', icon: 'pierce', cat: 'w', lv: 0, max: 5, status: 'unlockable' },
    { x: 60, y: 420, name: '弾数', icon: 'sword', cat: 'w', lv: 0, max: 2, status: 'locked' },

    { x: 180, y: 100, name: '爆弾', icon: 'bomb', cat: 'w', lv: 0, max: 1, status: 'unlockable' },
    { x: 180, y: 180, name: 'サンダー', icon: 'bolt', cat: 'w', lv: 0, max: 1, status: 'locked' },
    { x: 180, y: 260, name: 'ホーミング', icon: 'orbit', cat: 'w', lv: 0, max: 1, status: 'locked' },
    { x: 180, y: 340, name: 'オービタル', icon: 'orbit', cat: 'w', lv: 0, max: 1, status: 'locked' },

    // Defense column
    { x: 300, y: 540, name: '最大HP', icon: 'heart', cat: 'd', lv: 2, max: 5, status: 'owned' },
    { x: 300, y: 620, name: '回復', icon: 'heart', cat: 'd', lv: 0, max: 5, status: 'unlockable' },
    { x: 180, y: 540, name: '速度', icon: 'boots', cat: 'd', lv: 1, max: 5, status: 'owned' },
    { x: 180, y: 620, name: '軽減', icon: 'shield', cat: 'd', lv: 0, max: 5, status: 'locked' },
    { x: 180, y: 700, name: '復活', icon: 'revive', cat: 'd', lv: 0, max: 1, status: 'locked' },

    // Economy column
    { x: 60, y: 820, name: 'コイン', icon: 'coin', cat: 'e', lv: 1, max: 5, status: 'owned' },
    { x: 60, y: 900, name: '磁力', icon: 'star', cat: 'e', lv: 0, max: 5, status: 'unlockable' },
    { x: 180, y: 820, name: '開始', icon: 'coin', cat: 'e', lv: 0, max: 5, status: 'unlockable' },
    { x: 180, y: 900, name: 'リトライ', icon: 'revive', cat: 'e', lv: 0, max: 5, status: 'locked' },
    { x: 300, y: 820, name: '幸運', icon: 'star', cat: 'e', lv: 0, max: 5, status: 'locked' },
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [1, 6], [2, 7], [3, 8],
    [9, 10], [11, 12], [12, 13], [9, 13],
    [14, 15], [14, 16], [16, 17], [15, 18],
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: BG_INK, color: '#e8d9b8',
      fontFamily: JP_FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '2px solid #1a0f24',
        background: 'linear-gradient(180deg, #1a0f24, #0a0612)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: PX_FONT, fontSize: 9, color: '#7a6a8a', letterSpacing: 2 }}>◀ BACK</div>
          <div style={{ fontFamily: PX_FONT, fontSize: 12, color: '#f0c44a', letterSpacing: 2 }}>SKILL TREE</div>
          <div style={{ fontFamily: PX_FONT, fontSize: 9, color: '#7a6a8a', letterSpacing: 2 }}>⚙</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#1a0f24', padding: '5px 10px',
            boxShadow: '2px 2px 0 #7a4a0a, 0 0 0 2px #f0c44a' }}>
            <Coin scale={2} />
            <span style={{ fontFamily: PX_FONT, fontSize: 12, color: '#f0c44a', letterSpacing: 1 }}>1,247</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CategoryChip color={C.w} label="武器" count="3/9" />
            <CategoryChip color={C.d} label="防御" count="2/5" />
            <CategoryChip color={C.e} label="経済" count="1/5" />
          </div>
        </div>
      </div>

      {/* Tree viewport */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: BG_INK }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges"
          style={{ display: 'block' }}>
          {/* Section bands */}
          <rect x="0" y="60" width={W} height="2" fill="#c63838" opacity="0.4" />
          <rect x="0" y="500" width={W} height="2" fill="#5cb8e8" opacity="0.4" />
          <rect x="0" y="780" width={W} height="2" fill="#8fb068" opacity="0.4" />
          <text x={W / 2} y="48" textAnchor="middle" fontFamily={PX_FONT} fontSize="11" fill="#c63838" letterSpacing="2">◆ WEAPON ◆</text>
          <text x={W / 2} y="490" textAnchor="middle" fontFamily={PX_FONT} fontSize="11" fill="#5cb8e8" letterSpacing="2">◆ GUARD ◆</text>
          <text x={W / 2} y="770" textAnchor="middle" fontFamily={PX_FONT} fontSize="11" fill="#8fb068" letterSpacing="2">◆ COIN ◆</text>

          {/* Edges (pixel-style 90° elbows) */}
          {edges.map(([a, b], i) => {
            const A = nodes[a]; const B = nodes[b];
            const reached = A.lv > 0;
            const stroke = reached ? (B.cat === 'w' ? C.w : B.cat === 'd' ? C.d : C.e) : '#3a2a4a';
            return (
              <g key={i}>
                <line x1={A.x} y1={A.y} x2={A.x} y2={B.y} stroke={stroke} strokeWidth="3" />
                <line x1={A.x} y1={B.y} x2={B.x} y2={B.y} stroke={stroke} strokeWidth="3" />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((n, i) => (
            <TreeNode key={i} node={n} colors={C} />
          ))}
        </svg>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 16px', borderTop: '2px solid #1a0f24', background: '#0a0612' }}>
        <button style={{
          width: '100%', fontFamily: PX_FONT, fontSize: 13, letterSpacing: 2,
          background: '#c63838', color: '#0a0612', border: 'none',
          padding: '14px', boxShadow: '4px 4px 0 #4a0a0a, 0 0 0 2px #0a0612', cursor: 'pointer',
        }}>
          ▶ STAGE SELECT
        </button>
      </div>
    </div>
  );
}

function CategoryChip({ color, label, count }) {
  return (
    <div style={{
      background: '#1a0f24', padding: '4px 8px',
      boxShadow: `2px 2px 0 ${color}`,
      fontFamily: JP_FONT, fontSize: 10, color: '#e8d9b8',
      display: 'inline-flex', gap: 4, alignItems: 'center',
    }}>
      <span style={{ width: 6, height: 6, background: color, display: 'inline-block' }} />
      {label} <span style={{ color: '#7a6a8a', fontFamily: PX_FONT, fontSize: 8 }}>{count}</span>
    </div>
  );
}

function TreeNode({ node, colors }) {
  const c = node.cat === 'w' ? colors.w : node.cat === 'd' ? colors.d : colors.e;
  const isOwned = node.lv > 0;
  const isLocked = node.status === 'locked';
  const fill = isOwned ? c : isLocked ? '#1a0f24' : '#0a0612';
  const stroke = isLocked ? '#3a2a4a' : c;
  const r = 22;

  return (
    <g>
      {/* Pixel-square node */}
      <rect x={node.x - r} y={node.y - r} width={r * 2} height={r * 2} fill={fill} stroke={stroke} strokeWidth="3" />
      {/* Inner icon area */}
      <rect x={node.x - r + 4} y={node.y - r + 4} width={r * 2 - 8} height={r * 2 - 8} fill="#0a0612" opacity={isOwned ? 0.2 : 1} />
      {/* Icon via foreignObject */}
      <foreignObject x={node.x - 12} y={node.y - 14} width="24" height="24">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, opacity: isLocked ? 0.4 : 1 }}>
          <NodeIcon kind={node.icon} scale={2} />
        </div>
      </foreignObject>
      {/* Lv badge */}
      {!isLocked && (
        <g>
          <rect x={node.x + r - 14} y={node.y + r - 10} width="20" height="12" fill="#0a0612" stroke={c} strokeWidth="1.5" />
          <text x={node.x + r - 4} y={node.y + r - 1} textAnchor="middle" fontFamily={PX_FONT} fontSize="8" fill={c}>{node.lv}/{node.max}</text>
        </g>
      )}
      {isLocked && (
        <text x={node.x} y={node.y + 4} textAnchor="middle" fontFamily={PX_FONT} fontSize="14" fill="#5a4670">🔒</text>
      )}
      {/* Name */}
      <text x={node.x} y={node.y + r + 14} textAnchor="middle"
        fontFamily={JP_FONT} fontSize="11" fill={isLocked ? '#5a4670' : '#e8d9b8'}>{node.name}</text>
    </g>
  );
}

Object.assign(window, { TitleA, TitleB, SkillTreeA, SkillTreeB });
