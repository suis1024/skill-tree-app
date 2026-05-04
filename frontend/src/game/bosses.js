// ボス定義。ステージ番号からテーブル参照する。

const BASE_BOSSES = [
  // st1
  { color: 0xb91c1c, size: 64, hp: 60, speed: 70, contactDamage: 2, pattern: "chase" },
  // st2
  { color: 0x2563eb, size: 60, hp: 90, speed: 140, contactDamage: 2, pattern: "chase" },
  // st3
  { color: 0xf59e0b, size: 64, hp: 120, speed: 80, contactDamage: 3, pattern: "shoot3way", shotSpeed: 230, shotIntervalMs: 1200, preferredDistance: 260 },
  // st4
  { color: 0x9333ea, size: 74, hp: 170, speed: 65, contactDamage: 3, pattern: "chase" },
  // st5
  { color: 0xdb2777, size: 68, hp: 220, speed: 100, contactDamage: 3, pattern: "shoot5way", shotSpeed: 240, shotIntervalMs: 1100, preferredDistance: 240 },
  // st6
  { color: 0x10b981, size: 64, hp: 270, speed: 160, contactDamage: 4, pattern: "chase" },
  // st7
  { color: 0x06b6d4, size: 74, hp: 320, speed: 90, contactDamage: 4, pattern: "shoot3way", shotSpeed: 280, shotIntervalMs: 850, preferredDistance: 260 },
  // st8
  { color: 0xf97316, size: 84, hp: 400, speed: 80, contactDamage: 5, pattern: "chase_burst" },
  // st9
  { color: 0xa3e635, size: 80, hp: 480, speed: 120, contactDamage: 5, pattern: "shoot5way", shotSpeed: 290, shotIntervalMs: 800, preferredDistance: 250 },
  // st10
  { color: 0xe11d48, size: 96, hp: 640, speed: 110, contactDamage: 6, pattern: "shoot8way", shotSpeed: 270, shotIntervalMs: 700, preferredDistance: 280 },
];

export function bossForStage(stageNumber) {
  const idx = Math.min(BASE_BOSSES.length - 1, Math.max(0, stageNumber - 1));
  return { ...BASE_BOSSES[idx], stageNumber };
}
