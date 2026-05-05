// 敵タイプ定義。MainScene からテーブル参照される。
// coinDrop は「敵 1 体撃破あたりの雑魚コイン数」。
// 後で stats.coinMul (eco_coin) と Math.round で倍掛けされる。
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
    coinDrop: 2,
    canShoot: false,
  },
  shooter: {
    color: 0xfbbf24,
    size: 22,
    hp: 5,
    speed: 70,
    contactDamage: 1,
    coinDrop: 1,
    canShoot: true,
    shootIntervalMs: 1800,
    shotSpeed: 220,
    preferredDistance: 240,
  },
  // 跳ね返り: 壁で完全反射しながら直線移動。攻撃なし、ホーミングなし、HP 多め。
  bouncer: {
    color: 0x14b8a6,
    size: 22,
    hp: 8,
    speed: 180,    // 反射するので速度高め
    contactDamage: 1,
    coinDrop: 2,
    canShoot: false,
    isBouncer: true,
  },
  // タレット: その場停止、回転しながら 5 方向に弾撒き。
  turret: {
    color: 0x9333ea,
    size: 26,
    hp: 6,
    speed: 0,
    contactDamage: 1,
    coinDrop: 2,
    canShoot: false, // 通常の単発射撃ではなく専用パターン
    isTurret: true,
    turretShotIntervalMs: 1800,
    turretShotSpeed: 180,
    turretRotateRate: 0.018, // rad/frame
  },
  // 突進: 一定距離で予兆 → 急加速突進。
  charger: {
    color: 0xfb923c,
    size: 26,
    hp: 8,
    speed: 60,           // 通常時
    contactDamage: 3,    // 突進時は痛い
    coinDrop: 2,
    canShoot: false,
    isCharger: true,
    chargeDetectRange: 240,
    chargeTelegraphMs: 500,
    chargeDurationMs: 800,
    chargeSpeed: 380,
  },
};

// 旧来の availableTypes / pickEnemyType / spawnIntervalMs / spawnBatchSize は
// ステージごとの wave 制 (waves.js) に置き換えたため削除した。
