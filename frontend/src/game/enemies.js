// 敵タイプ定義。MainScene からテーブル参照される。
export const ENEMY_TYPES = {
  grunt: {
    color: 0xef4444,
    size: 24,
    hp: 1,
    speed: 90,
    contactDamage: 1,
    coinDrop: 1,
    canShoot: false,
  },
  swift: {
    color: 0x60a5fa,
    size: 18,
    hp: 1,
    speed: 170,
    contactDamage: 1,
    coinDrop: 1,
    canShoot: false,
  },
  tank: {
    color: 0xa855f7,
    size: 36,
    hp: 6,
    speed: 55,
    contactDamage: 2,
    coinDrop: 4,
    canShoot: false,
  },
  shooter: {
    color: 0xfbbf24,
    size: 22,
    hp: 2,
    speed: 70,
    contactDamage: 1,
    coinDrop: 2,
    canShoot: true,
    shootIntervalMs: 1800,
    shotSpeed: 220,
    preferredDistance: 240, // この距離で止まる
  },
};

// 経過時間 (秒) に応じて出現可能な敵タイプを返す。
export function availableTypes(elapsedSec) {
  const types = ["grunt"];
  if (elapsedSec >= 30) types.push("swift");
  if (elapsedSec >= 90) types.push("tank");
  if (elapsedSec >= 180) types.push("shooter");
  return types;
}

// 経過秒に応じてスポーン間隔 (ms) を線形補間。1.0s → 0.4s を 5 分かけて。
export function spawnIntervalMs(elapsedSec) {
  const t = Math.min(1, elapsedSec / 300);
  return Math.round(1000 - t * 600);
}

// 1 回のスポーンで何体出すか。後半は群れで出る。
export function spawnBatchSize(elapsedSec) {
  if (elapsedSec >= 240) return 3;
  if (elapsedSec >= 120) return 2;
  return 1;
}

// 出現タイプの重み付き選択 (時間が進むと強い敵の出現率も上がる)。
export function pickEnemyType(elapsedSec, rng = Math.random) {
  const types = availableTypes(elapsedSec);
  // 単純: 後から解禁された敵ほど重みを少し下げる
  const weights = types.map((_, i) => Math.max(1, 4 - i));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r < 0) return types[i];
  }
  return types[0];
}
