// 進捗は全部ブラウザの localStorage に保存。サーバー不要。
// 関数シグネチャはサーバー版と同じに保つ (App.jsx 側を変えなくて済むように)。

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

// API は Promise を返す形を維持 (将来クラウド同期に戻す余地)。
export async function fetchProgress(userId) {
  return {
    user_id: userId,
    coins: readCoins(),
    skill_levels: readSkills(),
    cleared_stages: readClearedStages(),
  };
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

export async function upgradeSkill(userId, skillId, cost) {
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("cost must be a non-negative number");
  }
  const coins = readCoins();
  if (coins < cost) {
    throw new Error("not enough coins");
  }
  writeCoins(coins - cost);
  const skills = readSkills();
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
