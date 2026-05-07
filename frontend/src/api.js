// 進捗は全部ブラウザの localStorage に保存。サーバー不要。
// 関数シグネチャはサーバー版と同じに保つ (App.jsx 側を変えなくて済むように)。

import { SKILLS, SKILL_BY_ID, isUnlockable, totalSpent, COST_TABLE } from "./game/skills";
import { TOTAL_STAGES } from "./game/stages";

const USER_ID_KEY = "skill-tree-shooter:user-id";
const COINS_KEY = "skill-tree-shooter:coins";
const SKILLS_KEY = "skill-tree-shooter:skill-levels";
const STAGES_KEY = "skill-tree-shooter:cleared-stages";

function generateId() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

function readCoins() {
  const raw = localStorage.getItem(COINS_KEY);
  const n = raw == null ? 0 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function writeCoins(n) {
  localStorage.setItem(COINS_KEY, String(Math.max(0, Math.floor(n))));
}

function readSkills() {
  const raw = localStorage.getItem(SKILLS_KEY);
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeSkills(skills) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

function readClearedStages() {
  const raw = localStorage.getItem(STAGES_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((n) => Number.isInteger(n) && n >= 1).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function writeClearedStages(arr) {
  localStorage.setItem(STAGES_KEY, JSON.stringify(arr));
}

// 廃止された旧スキル ID。所持していたら自動でコイン全額返金 + 削除する。
const RETIRED_SKILL_IDS = [
  "atk_speed", "atk_crit",
  "atk_power", "atk_pierce", "atk_multi", "atk_back",
];

// maxLevel が下げられたスキル ID -> 新 maxLevel。超過 lv 分のコストを返金。
const REDUCED_MAX_LEVELS = {
  pistol_multi: 2, // 新ID
  pistol_back: 1,
};

function migrateRetiredSkills() {
  const skills = readSkills();
  let refund = 0;
  let changed = false;

  for (const id of RETIRED_SKILL_IDS) {
    const lv = skills[id] || 0;
    if (lv > 0) {
      for (let i = 0; i < lv && i < COST_TABLE.length; i++) refund += COST_TABLE[i];
      delete skills[id];
      changed = true;
    } else if (id in skills) {
      delete skills[id];
      changed = true;
    }
  }

  for (const [id, newMax] of Object.entries(REDUCED_MAX_LEVELS)) {
    const lv = skills[id] || 0;
    if (lv > newMax) {
      for (let i = newMax; i < lv && i < COST_TABLE.length; i++) refund += COST_TABLE[i];
      skills[id] = newMax;
      changed = true;
    }
  }

  if (changed) {
    writeSkills(skills);
    if (refund > 0) writeCoins(readCoins() + refund);
  }
}

// API は Promise を返す形を維持 (将来クラウド同期に戻す余地)。
export async function fetchProgress(userId) {
  migrateRetiredSkills();
  return {
    user_id: userId,
    coins: readCoins(),
    skill_levels: readSkills(),
    cleared_stages: readClearedStages(),
  };
}

// 全スキルを Lv0 にリセット。これまでに支払ったコインを全額返す。
export async function resetSkills(userId) {
  const skills = readSkills();
  let refund = 0;
  for (const def of SKILLS) {
    const lv = skills[def.id] || 0;
    if (lv > 0) refund += totalSpent(def, lv);
  }
  writeSkills({});
  const next = readCoins() + refund;
  writeCoins(next);
  return { user_id: userId, coins: next, refund };
}

export async function markStageCleared(userId, stageNumber) {
  const cleared = new Set(readClearedStages());
  cleared.add(stageNumber);
  const next = Array.from(cleared).sort((a, b) => a - b);
  writeClearedStages(next);
  return { user_id: userId, cleared_stages: next };
}

export async function addCoins(userId, coins) {
  if (!Number.isFinite(coins) || coins < 0) {
    throw new Error("coins must be a non-negative number");
  }
  const next = readCoins() + Math.floor(coins);
  writeCoins(next);
  return { user_id: userId, coins: next };
}

// 進捗を全部消す。設定は維持。再起動相当の初期状態に戻す。
export async function wipeProgress() {
  localStorage.removeItem(COINS_KEY);
  localStorage.removeItem(SKILLS_KEY);
  localStorage.removeItem(STAGES_KEY);
  // user_id と settings は意図的に残す
  return { coins: 0, skill_levels: {}, cleared_stages: [] };
}

// === 開発者向けチート (申請前に削除予定) ===

export async function cheatAddCoins(amount) {
  const next = readCoins() + amount;
  writeCoins(next);
  return { coins: next };
}

export async function cheatUnlockAllStages() {
  const all = [];
  // クリア済みは「次のステージを解放するため」のフラグなので、最終ステージ前まで
  // 全部 cleared にすれば全解放扱いになる。最終ステージはクリア済み扱いにしないと
  // 「全ステージ解放」と言いにくいので含める。
  for (let i = 1; i <= TOTAL_STAGES; i++) all.push(i);
  writeClearedStages(all);
  return { cleared_stages: all };
}

export async function upgradeSkill(userId, skillId, cost) {
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("cost must be a non-negative number");
  }
  const skillDef = SKILL_BY_ID[skillId];
  if (!skillDef) throw new Error(`unknown skill: ${skillId}`);
  const skills = readSkills();
  if (!isUnlockable(skillDef, skills)) {
    throw new Error("前提条件を満たしていません");
  }
  if ((skills[skillId] ?? 0) >= skillDef.maxLevel) {
    throw new Error("already maxed");
  }
  const coins = readCoins();
  if (coins < cost) {
    throw new Error("コインが足りません");
  }
  writeCoins(coins - cost);
  const nextLevel = (skills[skillId] ?? 0) + 1;
  skills[skillId] = nextLevel;
  writeSkills(skills);
  return {
    user_id: userId,
    coins: coins - cost,
    skill_id: skillId,
    level: nextLevel,
  };
}
