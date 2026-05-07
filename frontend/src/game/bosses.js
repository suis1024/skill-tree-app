// ボス定義。ステージ番号からテーブル参照する。

// HP / contactDamage は ×10 スケール。
// shape は shapes.js のキー。未指定なら rect。
const BASE_BOSSES = [
  // st1: ベーシック追跡
  { color: 0xb91c1c, size: 64, hp: 800,  speed: 75,  contactDamage: 20, pattern: "chase",       shape: "rect" },
  // st2: 軽快な追跡 (青三角)
  { color: 0x2563eb, size: 60, hp: 1300, speed: 150, contactDamage: 20, pattern: "chase",       shape: "triangle" },
  // st3: 砲台型 (3way)
  { color: 0xf59e0b, size: 64, hp: 1800, speed: 80,  contactDamage: 30, pattern: "shoot3way",   shape: "pentagon", shotSpeed: 250, shotIntervalMs: 1000, preferredDistance: 260 },
  // st4: 重量級
  { color: 0x9333ea, size: 74, hp: 2500, speed: 70,  contactDamage: 30, pattern: "chase",       shape: "hexagon" },
  // st5: 弾撒き機 (5way)
  { color: 0xdb2777, size: 68, hp: 3200, speed: 105, contactDamage: 30, pattern: "shoot5way",   shape: "diamond",  shotSpeed: 260, shotIntervalMs: 900,  preferredDistance: 240 },
  // st6: 高速突進
  { color: 0x10b981, size: 64, hp: 4000, speed: 170, contactDamage: 40, pattern: "chase",       shape: "triangle" },
  // st7: 中盤砲台 (3way 速め)
  { color: 0x06b6d4, size: 74, hp: 4800, speed: 95,  contactDamage: 40, pattern: "shoot3way",   shape: "pentagon", shotSpeed: 300, shotIntervalMs: 700,  preferredDistance: 260 },
  // st8: 重量級弾撒き
  { color: 0xf97316, size: 84, hp: 6000, speed: 85,  contactDamage: 50, pattern: "chase_burst", shape: "hexagon" },
  // st9: 中ボス的弾撒き
  { color: 0xa3e635, size: 80, hp: 7200, speed: 130, contactDamage: 50, pattern: "shoot5way",   shape: "octagon",  shotSpeed: 310, shotIntervalMs: 650,  preferredDistance: 250 },
  // st10: ラスボス、星型
  { color: 0xe11d48, size: 96, hp: 9500, speed: 115, contactDamage: 60, pattern: "shoot8way",   shape: "star",     shotSpeed: 290, shotIntervalMs: 550,  preferredDistance: 280 },
];

export function bossForStage(stageNumber) {
  const idx = Math.min(BASE_BOSSES.length - 1, Math.max(0, stageNumber - 1));
  return { ...BASE_BOSSES[idx], stageNumber };
}
