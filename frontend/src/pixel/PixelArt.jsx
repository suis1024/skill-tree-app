// Pixel art assets — SVG-based, drawn cell-by-cell so they scale crisp.
// design-handoff の pixel-art.jsx を ESM 化したもの。

export const PAL = {
  ink: '#0a0612',
  ink2: '#1a0f24',
  bone: '#e8d9b8',
  bone2: '#c4b08a',
  blood: '#c63838',
  bloodDark: '#7a1a1a',
  spark: '#5cb8e8',
  sparkDark: '#2a6f9a',
  moss: '#8fb068',
  mossDark: '#4a6a3a',
  gold: '#f0c44a',
  goldDark: '#a87a1c',
  shadow: '#3a2a4a',
  rune: '#a06ad4',
};

// 16進カラー → 0xRRGGBB の数値 (Phaser 用)
export const PAL_HEX = Object.fromEntries(
  Object.entries(PAL).map(([k, v]) => [k, parseInt(v.slice(1), 16)])
);

export const PX_FONT = '"Press Start 2P", "DotGothic16", monospace';
export const JP_FONT = '"DotGothic16", "Press Start 2P", monospace';

function pixelGrid(rows, palette, scale = 4) {
  const w = rows[0].length;
  const h = rows.length;
  const rects = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      const fill = palette[c];
      if (!fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />);
    }
  }
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges" style={{ display: 'block', imageRendering: 'pixelated' }}>
      {rects}
    </svg>
  );
}

export function HeroSprite({ scale = 4 }) {
  const rows = [
    '................',
    '......BBBB......',
    '.....BPPPPB.....',
    '....BPSSSSPB....',
    '....BSSWWSSB....',
    '....BSWBWWSB....',
    '....BSWWWWSB....',
    '....BSSWWSSB....',
    '....RRRRRRRR....',
    '...RRRBRRRRRR...',
    '..RRRRBBBRRRRR..',
    '..RRRRBBBRRRRR..',
    '..RRRRBBBRRRRR..',
    '...RRRRGRRRR....',
    '....KK....KK....',
    '....KK....KK....',
  ];
  return pixelGrid(rows, {
    B: PAL.ink, P: PAL.bone, S: PAL.bone2, W: PAL.ink, R: PAL.blood,
    K: PAL.shadow, G: PAL.gold,
  }, scale);
}

export function CrossedWeapons({ scale = 4 }) {
  const rows = [
    '........RRR.............',
    '.......RGGR.............',
    '......RGGGR.............',
    '.....RGGGR..............',
    '....RGGGR.....BBB.......',
    '...RGGGR.....BSSB.......',
    '..RGGGR.....BSSSB.......',
    '.RGGGR.....BSSSSB.......',
    'RGGGR.....BSSSSB........',
    'RGGR.....BSSSSB.........',
    'RGR.....BSSSSB..........',
    'RR.....BSSSSB...........',
    'RR....BSSSSB............',
    '.....BSSSSB.RR..........',
    '....BSSSSB.RGR..........',
    '...BSSSSB.RGGR..........',
    '..BSSSSB.RGGGR..........',
    '.BSSSSB.RGGGR...........',
    'BSSSSB.RGGGR............',
    'BSSSB.RGGGR.............',
    'BSSB.RGGGR..............',
    'BSB.RGGGR...............',
    'BB.RGGGR................',
    'B..RGGR.................',
  ];
  return pixelGrid(rows, {
    B: PAL.ink, S: PAL.bone, R: PAL.blood, G: PAL.gold,
  }, scale);
}

export function Coin({ scale = 3 }) {
  const rows = [
    '.BBBB.',
    'BGGGGB',
    'BGYYGB',
    'BGYYGB',
    'BGGGGB',
    '.BBBB.',
  ];
  return pixelGrid(rows, { B: PAL.ink, G: PAL.gold, Y: '#fff2a8' }, scale);
}

export function Heart({ scale = 3 }) {
  const rows = [
    '.RR.RR.',
    'RPRRRPR',
    'RPPPPPR',
    'RPPPPPR',
    '.RPPPR.',
    '..RPR..',
    '...R...',
  ];
  return pixelGrid(rows, { R: PAL.blood, P: '#ff7878' }, scale);
}

export function NodeIcon({ kind, scale = 3 }) {
  const recipes = {
    sword: {
      rows: [
        '......BB','.....BSB','....BSSB','...BSSB.',
        '..BSSB..','.BSSB...','BBBB....','BG......',
      ],
      pal: { B: PAL.ink, S: PAL.bone, G: PAL.gold },
    },
    bomb: {
      rows: [
        '......YS','.....BB.','...BBKBB','..BKKKKB',
        '.BKKKKKB','.BKKKKKB','..BKKKB.','...BBB..',
      ],
      pal: { B: PAL.ink, K: '#3a2a3a', S: PAL.spark, Y: PAL.gold },
    },
    bolt: {
      rows: [
        '...BB...','..BSB...','..BS B..','.BSSSB..',
        '..BSSB..','...BSB..','...BSB..','....BB..',
      ],
      pal: { B: PAL.ink, S: PAL.spark },
    },
    shield: {
      rows: [
        '.BBBBBB.','BSSSSSSB','BSCCCCSB','BSCBBCSB',
        'BSCBBCSB','BSCCCCSB','.BSSSSB.','..BBBB..',
      ],
      pal: { B: PAL.ink, S: PAL.spark, C: PAL.bone },
    },
    heart: {
      rows: [
        '.RR.RR..','RPRRRPR.','RPPPPPR.','RPPPPPR.',
        '.RPPPR..','..RPR...','...R....','........',
      ],
      pal: { R: PAL.blood, P: '#ff8a8a' },
    },
    coin: {
      rows: [
        '..BBBB..','.BGYYGB.','BGYWWYGB','BGYWWYGB',
        'BGYWWYGB','.BGYYGB.','..BBBB..','........',
      ],
      pal: { B: PAL.ink, G: PAL.gold, Y: '#fde68a', W: '#fff8d8' },
    },
    boots: {
      rows: [
        '...BBB..','..BCCCB.','..BCCCB.','..BCCCBB',
        '.BBCCCCB','BCCCCCCB','BBBBBBBB','........',
      ],
      pal: { B: PAL.ink, C: PAL.moss },
    },
    star: {
      rows: [
        '...YY...','...YY...','YYYWWYYY','.YWWWWY.',
        '..WWWW..','.YYWWYY.','YY....YY','Y......Y',
      ],
      pal: { Y: PAL.gold, W: '#fff2a8' },
    },
    orbit: {
      rows: [
        '...BB...','..BSSB..','.BSCCSB.','.BSCCSB.',
        '..BSSB..','...BB...','........','........',
      ],
      pal: { B: PAL.ink, S: PAL.rune, C: PAL.bone },
    },
    target: {
      rows: [
        '.BBBBBB.','BSSSSSSB','BSBBBBSB','BSBRRBSB',
        'BSBRRBSB','BSBBBBSB','BSSSSSSB','.BBBBBB.',
      ],
      pal: { B: PAL.ink, S: PAL.bone, R: PAL.blood },
    },
    pierce: {
      rows: [
        '.......B','......BB','.....BBB','....BBSS',
        '...BBSS.','..BBSS..','BBBS....','B.......',
      ],
      pal: { B: PAL.ink, S: PAL.spark },
    },
    revive: {
      rows: [
        '..BBBB..','.BGGGGB.','BGWGGWGB','BGGGGGGB',
        'BGWGGWGB','BGGGGGGB','.BGGGGB.','..BBBB..',
      ],
      pal: { B: PAL.ink, G: PAL.gold, W: '#fff' },
    },
  };
  const r = recipes[kind] || recipes.target;
  return pixelGrid(r.rows, r.pal, scale);
}

export function Sparkle({ size = 12, color = PAL.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges"
      style={{ display: 'block' }}>
      <rect x="5" y="0" width="2" height="12" fill={color} />
      <rect x="0" y="5" width="12" height="2" fill={color} />
      <rect x="3" y="3" width="6" height="6" fill={color} opacity="0.5" />
    </svg>
  );
}
