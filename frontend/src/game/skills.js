export const COST_TABLE = [10, 25, 50, 100, 200];

export const CATEGORIES = {
  weapon:  { label: "武器", color: "#a78bfa" },
  attack:  { label: "攻撃", color: "#ef4444" },
  defense: { label: "防御", color: "#3b82f6" },
  economy: { label: "経済", color: "#22c55e" },
};

// ツリーレイアウト用座標 (論理座標、SVG にマップ)。
// レイアウト: 中央に「攻撃」、左に「武器」、右上に「防御」、右下に「経済」を配置。
// 縦は y、横は x。原点は左上。

// height は layoutSkills 後に総ノード数から計算される。初期値はダミー。
export const TREE_VIEWBOX = { width: 480, height: 1800 };

// requires: 親スキルが指定 level 以上のときだけ取得可能。
// アンロック系 (maxLevel: 1) は「装備武器の解放」を表す。
// pos は SVG 上の座標。
export const SKILLS = [
  // ===== 攻撃系 (中央縦軸) =====
  { id: "atk_power",  category: "attack", name: "攻撃力アップ",   maxLevel: 5, desc: "全武器のダメージ +20% / Lv",
    pos: { x: 500, y: 460 } },
  { id: "atk_pierce", category: "attack", name: "弾の貫通",       maxLevel: 5, desc: "ピストル弾の貫通敵数 +1 / Lv",
    requires: { id: "atk_power", level: 1 }, pos: { x: 380, y: 380 } },
  { id: "atk_multi",  category: "attack", name: "ピストル弾数",   maxLevel: 3, desc: "ピストル 1 発の弾数 +1 / Lv (扇状に拡散、最大 4)",
    requires: { id: "atk_pierce", level: 1 }, pos: { x: 280, y: 300 } },
  { id: "atk_back",   category: "attack", name: "後方発射",       maxLevel: 3, desc: "後方にも弾を撃つ。Lv1=1本 / Lv2=3本 / Lv3=5本 (扇)",
    requires: { id: "atk_multi", level: 3 }, pos: { x: 200, y: 220 } },

  // ===== 武器系 (左側) =====
  { id: "wpn_unlock_bomb",    category: "weapon", name: "爆弾",       maxLevel: 1, desc: "近くの敵に放物線で爆弾を投げる",
    costOverrides: [40], requires: { id: "atk_power", level: 1 },
    pos: { x: 360, y: 540 } },
  { id: "wpn_unlock_thunder", category: "weapon", name: "サンダー",   maxLevel: 1, desc: "近くの敵に落雷、3 体まで連鎖",
    costOverrides: [80], requires: { id: "wpn_unlock_bomb", level: 1 },
    pos: { x: 220, y: 580 } },
  { id: "wpn_unlock_homing",  category: "weapon", name: "ホーミング", maxLevel: 1, desc: "敵を追尾する弾を発射",
    costOverrides: [60], requires: { id: "atk_power", level: 1 },
    pos: { x: 360, y: 660 } },
  { id: "wpn_unlock_orbital", category: "weapon", name: "オービタル", maxLevel: 1, desc: "周囲を回る弾で接触ダメージ",
    costOverrides: [100], requires: { id: "wpn_unlock_homing", level: 1 },
    pos: { x: 220, y: 720 } },

  // 武器固有強化 (各武器の子ノード)
  // ピストル (atk_power 配下): 攻撃速度・クリティカルはここに
  { id: "pistol_speed", category: "attack", name: "ピストル速度",   maxLevel: 5, desc: "ピストル発射間隔 -20% / Lv",
    requires: { id: "atk_power", level: 1 }, pos: { x: 500, y: 340 } },
  { id: "pistol_crit",  category: "attack", name: "ピストル クリ率", maxLevel: 5, desc: "ピストルのクリ率 +10% / Lv (クリで ×2)",
    requires: { id: "pistol_speed", level: 2 }, pos: { x: 500, y: 220 } },

  { id: "bomb_radius", category: "weapon", name: "爆弾の範囲",     maxLevel: 5, desc: "爆発半径 +20% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 }, pos: { x: 130, y: 460 } },
  { id: "bomb_damage", category: "weapon", name: "爆弾の威力",     maxLevel: 5, desc: "爆弾ダメージ +25% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 }, pos: { x: 130, y: 520 } },
  { id: "bomb_range", category: "weapon", name: "爆弾の射程",      maxLevel: 5, desc: "投射射程 +20% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 }, pos: { x: 60, y: 420 } },
  { id: "bomb_speed", category: "weapon", name: "爆弾の速度",      maxLevel: 5, desc: "投擲間隔 -15% / Lv",
    requires: { id: "wpn_unlock_bomb", level: 1 }, pos: { x: 60, y: 500 } },

  { id: "thunder_chain",  category: "weapon", name: "サンダー連鎖", maxLevel: 5, desc: "連鎖数 +1 / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 }, pos: { x: 80, y: 600 } },
  { id: "thunder_damage", category: "weapon", name: "サンダー威力", maxLevel: 5, desc: "サンダーダメージ +25% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 }, pos: { x: 80, y: 660 } },
  { id: "thunder_range",  category: "weapon", name: "サンダー射程", maxLevel: 5, desc: "射程 +20% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 }, pos: { x: 150, y: 600 } },
  { id: "thunder_speed",  category: "weapon", name: "サンダー速度", maxLevel: 5, desc: "発動間隔 -15% / Lv",
    requires: { id: "wpn_unlock_thunder", level: 1 }, pos: { x: 150, y: 660 } },

  { id: "homing_count",  category: "weapon", name: "ホーミング数",  maxLevel: 5, desc: "1 回の発射で +1 / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 }, pos: { x: 460, y: 720 } },
  { id: "homing_damage", category: "weapon", name: "ホーミング威力", maxLevel: 5, desc: "ホーミングダメージ +25% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 }, pos: { x: 460, y: 780 } },
  { id: "homing_range",  category: "weapon", name: "ホーミング射程", maxLevel: 5, desc: "追尾射程 +20% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 }, pos: { x: 530, y: 720 } },
  { id: "homing_speed",  category: "weapon", name: "ホーミング速度", maxLevel: 5, desc: "発射間隔 -15% / Lv",
    requires: { id: "wpn_unlock_homing", level: 1 }, pos: { x: 530, y: 780 } },

  { id: "orbital_count", category: "weapon", name: "オービタル数",  maxLevel: 4, desc: "周回弾の個数 +1 / Lv (初期 2)",
    requires: { id: "wpn_unlock_orbital", level: 1 }, pos: { x: 80, y: 780 } },
  { id: "orbital_damage", category: "weapon", name: "オービタル威力", maxLevel: 5, desc: "オービタルダメージ +25% / Lv",
    requires: { id: "wpn_unlock_orbital", level: 1 }, pos: { x: 80, y: 840 } },

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
const CATEGORY_ORDER = ["attack", "weapon", "defense", "economy"];
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

function layoutSkills(skills) {
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const memo = new Map();
  for (const s of skills) computeTier(s, byId, memo);

  // カテゴリ別 + tier 別にグループ化
  const groups = {}; // category -> tier -> skill[]
  for (const s of skills) {
    const t = memo.get(s.id);
    if (!groups[s.category]) groups[s.category] = {};
    if (!groups[s.category][t]) groups[s.category][t] = [];
    groups[s.category][t].push(s);
  }

  SECTION_HEADERS.length = 0;
  let cursorY = 30;
  for (const cat of CATEGORY_ORDER) {
    const tiers = groups[cat] || {};
    const tierKeys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
    if (tierKeys.length === 0) continue;
    SECTION_HEADERS.push({
      category: cat,
      label: CATEGORIES[cat]?.label || cat,
      y: cursorY,
    });
    cursorY += SECTION_TOP_PAD;
    for (const tier of tierKeys) {
      const arr = tiers[tier];
      // MAX_PER_ROW で折返し
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
    damageMul:        1 + lv("atk_power")  * 0.20,
    pistolCritChance: lv("pistol_crit") * 0.10,
    pierce:           lv("atk_pierce"),
    bulletCount:      1 + lv("atk_multi"),
    backBulletCount:  [0, 1, 3, 5][lv("atk_back")] || 0,
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
