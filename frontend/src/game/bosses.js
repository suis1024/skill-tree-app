// ボス定義。ステージ番号からテーブル参照する。

const BASE_BOSSES = [
  // st1
  { color: 0xb91c1c, size: 60, hp: 30, speed: 60, contactDamage: 2, pattern: "chase" },
  // st2
  { color: 0x2563eb, size: 56, hp: 45, speed: 130, contactDamage: 2, pattern: "chase" },
  // st3
  { color: 0xf59e0b, size: 60, hp: 60, speed: 70, contactDamage: 2, pattern: "shoot3way", shotSpeed: 200, shotIntervalMs: 1500, preferredDistance: 240 },
  // st4
  { color: 0x9333ea, size: 70, hp: 90, speed: 55, contactDamage: 3, pattern: "chase" },
  // st5
  { color: 0xdb2777, size: 64, hp: 110, speed: 90, contactDamage: 3, pattern: "shoot5way", shotSpeed: 220, shotIntervalMs: 1400, preferredDistance: 220 },
  // st6
  { color: 0x10b981, size: 60, hp: 130, speed: 150, contactDamage: 3, pattern: "chase" },
  // st7
  { color: 0x06b6d4, size: 70, hp: 160, speed: 80, contactDamage: 3, pattern: "shoot3way", shotSpeed: 250, shotIntervalMs: 1100, preferredDistance: 240 },
  // st8
  { color: 0xf97316, size: 80, hp: 200, speed: 70, contactDamage: 4, pattern: "chase_burst" },
  // st9
  { color: 0xa3e635, size: 76, hp: 240, speed: 110, contactDamage: 4, pattern: "shoot5way", shotSpeed: 260, shotIntervalMs: 1000, preferredDistance: 230 },
  // st10
  { color: 0xe11d48, size: 90, hp: 320, speed: 100, contactDamage: 5, pattern: "shoot8way", shotSpeed: 240, shotIntervalMs: 900, preferredDistance: 260 },
];

export function bossForStage(stageNumber) {
  const idx = Math.min(BASE_BOSSES.length - 1, Math.max(0, stageNumber - 1));
  return { ...BASE_BOSSES[idx], stageNumber };
}
