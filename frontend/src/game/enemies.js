// 敵タイプ定義。MainScene からテーブル参照される。
export const ENEMY_TYPES = {
  grunt: {
    color: 0xef4444,
    size: 24,
    hp: 3,
    speed: 90,
    contactDamage: 1,
    coinDrop: 1,
    canShoot: false,
  },
  swift: {
    color: 0x60a5fa,
    size: 18,
    hp: 2,
    speed: 130,
    contactDamage: 1,
    coinDrop: 1,
    canShoot: false,
  },
  tank: {
    color: 0xa855f7,
    size: 36,
    hp: 15,
    speed: 55,
    contactDamage: 2,
    coinDrop: 4,
    canShoot: false,
  },
  shooter: {
    color: 0xfbbf24,
    size: 22,
    hp: 5,
    speed: 70,
    contactDamage: 1,
    coinDrop: 2,
    canShoot: true,
    shootIntervalMs: 1800,
    shotSpeed: 220,
    preferredDistance: 240, // この距離で止まる
  },
};

// 経過時間 (秒) とステージ番号に応じて出現可能な敵タイプを返す。
// ステージが進むほど解禁が早まる。
export function availableTypes(elapsedSec, stageNumber = 1) {
  const acc = Math.max(0, (stageNumber - 1) * 12); // st2 で +12s 分加速
  const t = elapsedSec + acc;
  const types = ["grunt"];
  if (t >= 30) types.push("swift");
  if (t >= 70) types.push("tank");
  if (t >= 130) types.push("shooter");
  return types;
}

// 経過秒に応じてスポーン間隔 (ms)。後半ほど短く。最小 250ms (難易度倍率で更に短縮可)。
export function spawnIntervalMs(elapsedSec) {
  const t = Math.min(1, elapsedSec / 90);
  return Math.round(900 - t * 600); // 0s: 900ms → 90s: 300ms
}

// 1 回のスポーンで何体出すか。後半・後ステージほど多い。
export function spawnBatchSize(elapsedSec, stageNumber = 1) {
  let n = 1;
  if (elapsedSec >= 50) n += 1;
  if (elapsedSec >= 80) n += 1;
  if (stageNumber >= 5) n += 1;
  if (stageNumber >= 8) n += 1;
  return Math.min(6, n);
}

// 出現タイプの重み付き選択 (経過秒+ステージ番号で強い敵の出現率も上がる)。
export function pickEnemyType(elapsedSec, stageNumber = 1, rng = Math.random) {
  const types = availableTypes(elapsedSec, stageNumber);
  // ステージ後半は強い敵 (後ろのもの) の重みを上げる
  const stageBoost = Math.min(3, (stageNumber - 1) * 0.3);
  const weights = types.map((_, i) => Math.max(1, 4 - i + i * stageBoost));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r < 0) return types[i];
  }
  return types[0];
}
