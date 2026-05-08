// 敵タイプ定義。MainScene からテーブル参照される。
// coinDrop は「敵 1 体撃破あたりの雑魚コイン数」。
// 後で stats.coinMul (eco_coin) と Math.round で倍掛けされる。
// HP / contactDamage は ×10 単位 (例: grunt 30 = 旧 3)。
// プレイヤー側ダメージも同じスケールにそろえてある (weapons.js, skills.js)。
export const ENEMY_TYPES = {
  grunt: {
    color: 0xef4444,
    size: 24,
    hp: 20,
    speed: 90,
    contactDamage: 18,
    coinDrop: 1,
    canShoot: false,
    shape: "rect",
    isFlocker: true, // 群れボーナス対象
    isWanderer: true, // 通常は壁反射の直進、近づいたら追跡に切替
    wanderHomingRange: 200,
  },
  swift: {
    color: 0x60a5fa,
    size: 18,
    hp: 20,
    speed: 130,
    contactDamage: 10,
    coinDrop: 1,
    canShoot: false,
    shape: "triangle",
    aimByVelocity: true,
  },
  tank: {
    color: 0xa855f7,
    size: 36,
    hp: 100,
    speed: 55,
    contactDamage: 20,
    coinDrop: 2,
    canShoot: false,
    shape: "rect",
    leadAim: true, // プレイヤーの未来位置を狙うリード追跡
  },
  shooter: {
    color: 0xfbbf24,
    size: 22,
    hp: 50,
    speed: 0,
    contactDamage: 10,
    coinDrop: 1,
    canShoot: true,
    shootIntervalMs: 1800,
    shotSpeed: 220,
    shape: "diamond",
    alwaysSpin: true, // 見映え用にゆっくり自転
  },
  bouncer: {
    color: 0x14b8a6,
    size: 22,
    hp: 100,
    speed: 180,
    contactDamage: 10,
    coinDrop: 2,
    canShoot: false,
    isBouncer: true,
    shape: "circle",
  },
  turret: {
    color: 0x9333ea,
    size: 26,
    hp: 40,
    speed: 0,
    contactDamage: 10,
    coinDrop: 2,
    canShoot: false,
    isTurret: true,
    turretShotIntervalMs: 1800,
    turretShotSpeed: 180,
    turretRotateRate: 0.018,
    shape: "pentagon",
  },
  charger: {
    color: 0xfb923c,
    size: 26,
    hp: 80,
    speed: 60,
    contactDamage: 30,
    coinDrop: 2,
    canShoot: false,
    isCharger: true,
    chargeDetectRange: 240,
    chargeTelegraphMs: 500,
    chargeDurationMs: 800,
    chargeSpeed: 380,
    shape: "triangle_wide",
  },
};

// 旧来の availableTypes / pickEnemyType / spawnIntervalMs / spawnBatchSize は
// ステージごとの wave 制 (waves.js) に置き換えたため削除した。
