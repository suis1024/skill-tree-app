export const COST_TABLE = [10, 25, 50, 100, 200];

export const CATEGORIES = {
  weapon:  { label: "武器", color: "#ef4444" },
  defense: { label: "防御", color: "#3b82f6" },
  economy: { label: "経済", color: "#22c55e" },
};

// height は layoutSkills 後に総ノード数から計算される。初期値はダミー。
export const TREE_VIEWBOX = { width: 480, height: 1800 };

// requires: 親スキルが指定 level 以上のときだけ取得可能。
// アンロック系 (maxLevel: 1) は「装備武器の解放」を表す。
// pos は SVG 上の座標 (layoutSkills が上書き)。
export const SKILLS = [
  // ===== 武器系 =====
  // 武器解放: すべてピストル直下 (= 最初からどれでも買える)
  { id: "wpn_unlock_bomb",    category: "weapon", name: "爆弾",       maxLevel: 1, desc: "近くの敵に放物線で爆弾を投げる",
    costOverrides: [40],  requires: { id: "pistol_unlock", level: 1 } },
  { id: "wpn_unlock_thunder", category: "weapon", name: "サンダー",   maxLevel: 1, desc: "近くの敵に落雷、3 体まで連鎖",
    costOverrides: [80],  requires: { id: "pistol_unlock", level: 1 } },
  { id: "wpn_unlock_homing",  category: "weapon", name: "ホーミング", maxLevel: 1, desc: "敵を追尾する弾を発射",
    costOverrides: [60],  requires: { id: "pistol_unlock", level: 1 } },
  { id: "wpn_unlock_orbital", category: "weapon", name: "オービタル", maxLevel: 1, desc: "周囲を回る弾で接触ダメージ",
    costOverrides: [100], requires: { id: "pistol_unlock", level: 1 } },

  // ピストル列 (初期武器: ヘッダーに「ピストル」を表示するためのダミー解放スキル)
  { id: "pistol_unlock", category: "weapon", name: "ピストル", maxLevel: 1, desc: "初期装備。常に発射する基本武器",
    costOverrides: [0] },
  { id: "pistol_damage", category: "weapon", name: "威力",   maxLevel: 5, desc: "ピストルのダメージ +20% / Lv",
    requires: { id: "pistol_unlock", level: 1 } },
  { id: "pistol_speed",  category: "weapon", name: "速度",   maxLevel: 5, desc: "ピストル発射間隔 -20% / Lv",
    requires: { id: "pistol_unlock", level: 1 } },
  { id: "pistol_crit",   category: "weapon", name: "クリ率", maxLevel: 5, desc: "ピストルのクリ率 +10% / Lv (クリで ×2)",
    requires: { id: "pistol_unlock", level: 1 } },
  { id: "pistol_pierce", category: "weapon", name: "貫通",   maxLevel: 5, desc: "ピストル弾の貫通敵数 +1 / Lv",
    requires: { id: "pistol_unlock", level: 1 } },
  { id: "pistol_multi",  category: "weapon", name: "弾数",   maxLevel: 2, desc: "ピストル 1 発の弾数 +1 / Lv (扇状、最大 3)",
    requires: { id: "pistol_unlock", level: 1 } },
  { id: "pistol_back",   category: "weapon", name: "後方",   maxLevel: 1, desc: "後方にも 1 本撃つ",
    requires: { id: "pistol_multi", level: 2 } },

  // 爆弾列
  { id: "bomb_damage", category: "weapon", name: "威力", maxLevel: 5, desc: "爆弾ダメージ +25% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 } },
  { id: "bomb_radius", category: "weapon", name: "範囲", maxLevel: 5, desc: "爆発半径 +20% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 } },
  { id: "bomb_range",  category: "weapon", name: "射程", maxLevel: 5, desc: "投射射程 +20% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 } },
  { id: "bomb_speed",  category: "weapon", name: "速度", maxLevel: 5, desc: "投擲間隔 -15% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 } },

  // サンダー列
  { id: "thunder_damage", category: "weapon", name: "威力", maxLevel: 5, desc: "サンダーダメージ +25% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 } },
  { id: "thunder_chain",  category: "weapon", name: "連鎖", maxLevel: 5, desc: "連鎖数 +1 / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 } },
  { id: "thunder_range",  category: "weapon", name: "射程", maxLevel: 5, desc: "射程 +20% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 } },
  { id: "thunder_speed",  category: "weapon", name: "速度", maxLevel: 5, desc: "発動間隔 -15% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 } },

  // ホーミング列
  { id: "homing_damage", category: "weapon", name: "威力", maxLevel: 5, desc: "ホーミングダメージ +25% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 } },
  { id: "homing_count",  category: "weapon", name: "弾数", maxLevel: 5, desc: "1 回の発射で +1 / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 } },
  { id: "homing_range",  category: "weapon", name: "射程", maxLevel: 5, desc: "追尾射程 +20% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 } },
  { id: "homing_speed",  category: "weapon", name: "速度", maxLevel: 5, desc: "発射間隔 -15% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 } },

  // オービタル列
  { id: "orbital_damage", category: "weapon", name: "威力", maxLevel: 5, desc: "オービタルダメージ +25% / Lv",
    requires: { id: "wpn_unlock_orbital", level: 1 } },
  { id: "orbital_count",  category: "weapon", name: "弾数", maxLevel: 4, desc: "周回弾の個数 +1 / Lv (初期 2)",
    requires: { id: "wpn_unlock_orbital", level: 1 } },

  // ===== 防御系 (右上) =====
  { id: "def_hp",     category: "defense", name: "最大HPアップ",     maxLevel: 5, desc: "最大HP +20 / Lv",
    pos: { x: 640, y: 380 } },
  { id: "def_regen",  category: "defense", name: "HP自然回復",       maxLevel: 5, desc: "HP +2 / 秒 / Lv (被弾後 3 秒は無効)",
    requires: { id: "def_hp", level: 1 }, pos: { x: 760, y: 320 } },
  { id: "def_speed",  category: "defense", name: "移動速度アップ",   maxLevel: 5, desc: "移動速度 +20% / Lv",
    pos: { x: 640, y: 220 } },
  { id: "def_armor",  category: "defense", name: "被ダメージ軽減",   maxLevel: 5, desc: "被ダメ -10% / Lv (最大 -50%)",
    requires: { id: "def_hp", level: 2 }, pos: { x: 800, y: 420 } },
  { id: "def_revive", category: "defense", name: "復活",             maxLevel: 1, desc: "HP0 で 1 回だけ自動復活",
    costOverrides: [150], requires: { id: "def_armor", level: 2 },
    pos: { x: 880, y: 320 } },

  // ===== 経済系 (右下) =====
  { id: "eco_coin",   category: "economy", name: "コイン獲得アップ", maxLevel: 5, desc: "敵から得られるコイン +15% / Lv",
    pos: { x: 640, y: 540 } },
  { id: "eco_magnet", category: "economy", name: "コイン磁力アップ", maxLevel: 5, desc: "コイン引き寄せ範囲 +30% / Lv",
    requires: { id: "eco_coin", level: 1 }, pos: { x: 760, y: 600 } },
  { id: "eco_start",  category: "economy", name: "開始時ボーナス",   maxLevel: 5, desc: "ラン開始時 +5 コイン / Lv",
    requires: { id: "eco_coin", level: 1 }, pos: { x: 640, y: 660 } },
  { id: "eco_retry",  category: "economy", name: "リトライボーナス", maxLevel: 5, desc: "死亡時、未獲得コインの 10% / Lv 追加",
    requires: { id: "eco_coin", level: 2 }, pos: { x: 800, y: 720 } },
  { id: "eco_lucky",  category: "economy", name: "幸運コイン",       maxLevel: 5, desc: "敵が金コイン (×3) を落とす確率 +5% / Lv",
    requires: { id: "eco_magnet", level: 2 }, pos: { x: 880, y: 660 } },
];

// === 自動グリッドレイアウト ===
// スマホ縦画面に合わせて「縦に長いツリー」を作る。
//
// レイアウト:
//   縦方向: カテゴリ (上から attack / weapon / defense / economy)
//           各カテゴリには見出し用の上端マージンと、tier 別の行を持つ
//   横方向: 同 (カテゴリ, tier) 内のノードを最大 4 個まで横並び
//           5 個以上は折り返し (次の行に)
//
// SKILLS の手書き pos は表示時に layoutSkills で上書きされる。
const CATEGORY_ORDER = ["weapon", "defense", "economy"];
const ROW_H = 90;
const SECTION_TOP_PAD = 60; // カテゴリ見出し用
const SECTION_BOTTOM_PAD = 30;
const MAX_PER_ROW = 4; // 1 行に並べる最大ノード数

function computeTier(skill, byId, memo) {
  if (memo.has(skill.id)) return memo.get(skill.id);
  if (!skill.requires) {
    memo.set(skill.id, 0);
    return 0;
  }
  const parent = byId[skill.requires.id];
  const t = parent ? computeTier(parent, byId, memo) + 1 : 0;
  memo.set(skill.id, t);
  return t;
}

// レイアウト結果として、各カテゴリの見出し Y 位置を返す。
export const SECTION_HEADERS = []; // { category, label, y }

// weapon カテゴリは「武器ごとの縦列」レイアウトを使う。
// 各列は { headerId?, prefix } で定義。headerId があればそれを列ヘッダーに、
// 無ければ prefix で始まる ID 全部を列の子として並べる (= ピストル)。
// 列順: 爆弾 / サンダー / ピストル (中央) / ホーミング / オービタル
const WEAPON_COLUMNS = [
  { headerId: "wpn_unlock_bomb",      prefix: "bomb_" },
  { headerId: "wpn_unlock_thunder",   prefix: "thunder_" },
  { headerId: "pistol_unlock",        prefix: "pistol_" },
  { headerId: "wpn_unlock_homing",    prefix: "homing_" },
  { headerId: "wpn_unlock_orbital",   prefix: "orbital_" },
];

function layoutWeaponColumns(skills, byId, startY) {
  // 各列の子は「ID prefix 一致 (= その武器に属する)」かつ「ヘッダー以外」で取る。
  // 並びはソース順 (SKILLS 配列の登場順) を尊重。
  const columns = WEAPON_COLUMNS.map((col) => {
    const children = skills.filter(
      (s) => s.id !== col.headerId && s.id.startsWith(col.prefix),
    );
    return { ...col, header: byId[col.headerId], children };
  });

  // 列内の縦依存を自動生成: 列 i 番目の子は (i-1 番目) Lv1 を要求。
  // 先頭の子はヘッダー (= 武器解放) Lv1 を要求。
  for (const col of columns) {
    let prevId = col.headerId;
    for (const c of col.children) {
      c.requires = { id: prevId, level: 1 };
      prevId = c.id;
    }
  }

  const ncol = columns.length;
  const colW = TREE_VIEWBOX.width / ncol;
  let maxRowsBelow = 0;
  columns.forEach((col, i) => {
    const cx = colW * (i + 0.5);
    if (col.header) col.header.pos = { x: cx, y: startY };
    col.children.forEach((c, j) => {
      c.pos = { x: cx, y: startY + ROW_H * (j + 1) };
    });
    if (col.children.length > maxRowsBelow) maxRowsBelow = col.children.length;
  });
  return startY + ROW_H * (1 + maxRowsBelow);
}

function layoutSkills(skills) {
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const memo = new Map();
  for (const s of skills) computeTier(s, byId, memo);

  SECTION_HEADERS.length = 0;
  let cursorY = 30;

  for (const cat of CATEGORY_ORDER) {
    const inCat = skills.filter((s) => s.category === cat);
    if (inCat.length === 0) continue;
    SECTION_HEADERS.push({
      category: cat,
      label: CATEGORIES[cat]?.label || cat,
      y: cursorY,
    });
    cursorY += SECTION_TOP_PAD;

    if (cat === "weapon") {
      // 武器ごとの縦列レイアウト
      cursorY = layoutWeaponColumns(skills, byId, cursorY);
    } else {
      // tier 別グリッド
      const tiers = {};
      for (const s of inCat) {
        const t = memo.get(s.id);
        if (!tiers[t]) tiers[t] = [];
        tiers[t].push(s);
      }
      const tierKeys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
      for (const tier of tierKeys) {
        const arr = tiers[tier];
        const rows = [];
        for (let i = 0; i < arr.length; i += MAX_PER_ROW) {
          rows.push(arr.slice(i, i + MAX_PER_ROW));
        }
        for (const row of rows) {
          const n = row.length;
          const cellW = TREE_VIEWBOX.width / Math.max(MAX_PER_ROW, n);
          const xOffset = (TREE_VIEWBOX.width - cellW * n) / 2;
          row.forEach((s, i) => {
            s.pos = {
              x: xOffset + cellW * (i + 0.5),
              y: cursorY,
            };
          });
          cursorY += ROW_H;
        }
      }
    }
    cursorY += SECTION_BOTTOM_PAD;
  }
  TREE_VIEWBOX.height = cursorY + 30;
}

layoutSkills(SKILLS);

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function nextCost(skill, currentLevel) {
  if (currentLevel >= skill.maxLevel) return null;
  const table = skill.costOverrides || COST_TABLE;
  return table[Math.min(currentLevel, table.length - 1)];
}

export function totalSpent(skill, level) {
  const table = skill.costOverrides || COST_TABLE;
  let sum = 0;
  for (let i = 0; i < level && i < table.length; i++) sum += table[i];
  return sum;
}

// 解放可能か (前提条件を満たしているか)
export function isUnlockable(skill, skillLevels) {
  if (!skill.requires) return true;
  const req = skill.requires;
  return (skillLevels[req.id] || 0) >= req.level;
}

// 装備中の武器 ID 一覧。常に pistol が先頭。解放したものは全部装備される。
export function equippedWeapons(skillLevels) {
  const lv = (id) => skillLevels[id] || 0;
  return [
    "pistol",
    lv("wpn_unlock_bomb")    >= 1 ? "bomb"    : null,
    lv("wpn_unlock_thunder") >= 1 ? "thunder" : null,
    lv("wpn_unlock_homing")  >= 1 ? "homing"  : null,
    lv("wpn_unlock_orbital") >= 1 ? "orbital" : null,
  ].filter(Boolean);
}

export function computeStats(skillLevels) {
  const lv = (id) => skillLevels[id] || 0;
  return {
    pistolDamageMul:  1 + lv("pistol_damage") * 0.20,
    pistolCritChance: lv("pistol_crit") * 0.10,
    pierce:           lv("pistol_pierce"),
    bulletCount:      1 + lv("pistol_multi"),
    backBulletCount:  lv("pistol_back") >= 1 ? 1 : 0,
    // 武器ごとの発射間隔倍率 (1 を分母にして使う想定: delay = base / mul)
    weaponSpeedMul: {
      pistol:  1 + lv("pistol_speed")  * 0.20,
      bomb:    1 + lv("bomb_speed")    * 0.15,
      thunder: 1 + lv("thunder_speed") * 0.15,
      homing:  1 + lv("homing_speed")  * 0.15,
      orbital: 1, // 周回武器は速度スキル無し
    },
    maxHp:            50 + lv("def_hp")   * 20,
    regenPerSec:      lv("def_regen") * 2,
    speedMul:         1 + lv("def_speed") * 0.20,
    damageReduction:  Math.min(0.5, lv("def_armor") * 0.10),
    hasRevive:        lv("def_revive") >= 1,
    coinMul:          1 + lv("eco_coin")  * 0.15,
    magnetMul:        1 + lv("eco_magnet") * 0.30,
    startBonus:       lv("eco_start")   * 5,
    retryRate:        lv("eco_retry")   * 0.10,
    luckyChance:      lv("eco_lucky")   * 0.05,
    weapons:          equippedWeapons(skillLevels),
    bombRadiusMul:    1 + lv("bomb_radius")  * 0.20,
    bombDamageMul:    1 + lv("bomb_damage")  * 0.25,
    bombRange:        200 * (1 + lv("bomb_range")    * 0.20),
    thunderChainAdd:  lv("thunder_chain"),
    thunderDamageMul: 1 + lv("thunder_damage") * 0.25,
    thunderRange:     220 * (1 + lv("thunder_range") * 0.20),
    homingCountAdd:   lv("homing_count"),
    homingDamageMul:  1 + lv("homing_damage")  * 0.25,
    homingRange:      400 * (1 + lv("homing_range")  * 0.20),
    orbitalCountAdd:  lv("orbital_count"),
    orbitalDamageMul: 1 + lv("orbital_damage") * 0.25,
  };
}
