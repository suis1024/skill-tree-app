export const COST_TABLE = [10, 25, 50, 100, 200];

export const CATEGORIES = {
  attack: { label: "攻撃", color: "#ef4444" },
  defense: { label: "防御", color: "#3b82f6" },
  economy: { label: "経済", color: "#22c55e" },
};

export const SKILLS = [
  // 攻撃系
  { id: "atk_power",   category: "attack",  name: "攻撃力アップ",      maxLevel: 5, perLevel: 0.20, desc: "弾のダメージが増える (+20% / Lv)" },
  { id: "atk_speed",   category: "attack",  name: "攻撃速度アップ",    maxLevel: 5, perLevel: 0.20, desc: "弾の発射間隔が短くなる (-20% / Lv に近づく)" },
  { id: "atk_crit",    category: "attack",  name: "クリティカル率",    maxLevel: 5, perLevel: 0.10, desc: "クリティカル発生率 (+10% / Lv)。クリ時 ×2 ダメージ" },
  { id: "atk_pierce",  category: "attack",  name: "弾の貫通",          maxLevel: 5, perLevel: 1,    desc: "弾が貫通する敵数 (+1 / Lv)" },
  { id: "atk_multi",   category: "attack",  name: "弾数追加",          maxLevel: 5, perLevel: 1,    desc: "1回の発射で出る弾数 (+1 / Lv)。扇状に拡散" },

  // 防御系
  { id: "def_hp",      category: "defense", name: "最大HPアップ",      maxLevel: 5, perLevel: 2,    desc: "最大HP (+2 / Lv)" },
  { id: "def_regen",   category: "defense", name: "HP自然回復",        maxLevel: 5, perLevel: 0.5,  desc: "HP自然回復 (+0.5 HP/秒 / Lv)" },
  { id: "def_speed",   category: "defense", name: "移動速度アップ",    maxLevel: 5, perLevel: 0.20, desc: "移動速度 (+20% / Lv)" },
  { id: "def_armor",   category: "defense", name: "被ダメージ軽減",    maxLevel: 5, perLevel: 0.10, desc: "被ダメージ軽減 (-10% / Lv、最大-50%)" },
  { id: "def_revive",  category: "defense", name: "復活",              maxLevel: 1, perLevel: 1,    desc: "HP0で1回だけ自動復活（HP満タンで再開）" },

  // 経済系
  { id: "eco_coin",    category: "economy", name: "コイン獲得アップ",  maxLevel: 5, perLevel: 0.20, desc: "敵から得られるコイン (+20% / Lv)" },
  { id: "eco_magnet",  category: "economy", name: "コイン磁力アップ",  maxLevel: 5, perLevel: 0.30, desc: "コインを引き寄せる範囲 (+30% / Lv)" },
  { id: "eco_start",   category: "economy", name: "開始時ボーナス",    maxLevel: 5, perLevel: 5,    desc: "ラン開始時に手持ちコイン +5 / Lv" },
  { id: "eco_retry",   category: "economy", name: "リトライボーナス",  maxLevel: 5, perLevel: 0.10, desc: "死亡時、未獲得コインの (10% / Lv) を追加で得る" },
  { id: "eco_lucky",   category: "economy", name: "幸運コイン",        maxLevel: 5, perLevel: 0.05, desc: "敵が金コイン(×3)を落とす確率 (+5% / Lv)" },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function nextCost(skill, currentLevel) {
  if (currentLevel >= skill.maxLevel) return null;
  return COST_TABLE[currentLevel];
}

export function totalSpent(skill, level) {
  let sum = 0;
  for (let i = 0; i < level; i++) sum += COST_TABLE[i];
  return sum;
}

export function computeStats(skillLevels) {
  const lv = (id) => skillLevels[id] || 0;
  return {
    damageMul:        1 + lv("atk_power")  * 0.20,
    fireRateMul:      1 + lv("atk_speed")  * 0.20,
    critChance:       lv("atk_crit")  * 0.10,
    pierce:           lv("atk_pierce"),
    bulletCount:      1 + lv("atk_multi"),
    maxHp:            5 + lv("def_hp")    * 2,
    regenPerSec:      lv("def_regen") * 0.5,
    speedMul:         1 + lv("def_speed") * 0.20,
    damageReduction:  Math.min(0.5, lv("def_armor") * 0.10),
    hasRevive:        lv("def_revive") >= 1,
    coinMul:          1 + lv("eco_coin")  * 0.20,
    magnetMul:        1 + lv("eco_magnet") * 0.30,
    startBonus:       lv("eco_start")   * 5,
    retryRate:        lv("eco_retry")   * 0.10,
    luckyChance:      lv("eco_lucky")   * 0.05,
  };
}
