// ボス定義。ステージ番号からテーブル参照する。

const BASE_BOSSES = [
  // st1
  { color: 0xb91c1c, size: 64, hp: 80, speed: 75, contactDamage: 2, pattern: "chase" },
  // st2
  { color: 0x2563eb, size: 60, hp: 130, speed: 150, contactDamage: 2, pattern: "chase" },
  // st3
  { color: 0xf59e0b, size: 64, hp: 180, speed: 80, contactDamage: 3, pattern: "shoot3way", shotSpeed: 250, shotIntervalMs: 1000, preferredDistance: 260 },
  // st4
  { color: 0x9333ea, size: 74, hp: 250, speed: 70, contactDamage: 3, pattern: "chase" },
  // st5
  { color: 0xdb2777, size: 68, hp: 320, speed: 105, contactDamage: 3, pattern: "shoot5way", shotSpeed: 260, shotIntervalMs: 900, preferredDistance: 240 },
  // st6
  { color: 0x10b981, size: 64, hp: 400, speed: 170, contactDamage: 4, pattern: "chase" },
  // st7
  { color: 0x06b6d4, size: 74, hp: 480, speed: 95, contactDamage: 4, pattern: "shoot3way", shotSpeed: 300, shotIntervalMs: 700, preferredDistance: 260 },
  // st8
  { color: 0xf97316, size: 84, hp: 600, speed: 85, contactDamage: 5, pattern: "chase_burst" },
  // st9
  { color: 0xa3e635, size: 80, hp: 720, speed: 130, contactDamage: 5, pattern: "shoot5way", shotSpeed: 310, shotIntervalMs: 650, preferredDistance: 250 },
  // st10
  { color: 0xe11d48, size: 96, hp: 950, speed: 115, contactDamage: 6, pattern: "shoot8way", shotSpeed: 290, shotIntervalMs: 550, preferredDistance: 280 },
];

export function bossForStage(stageNumber) {
  const idx = Math.min(BASE_BOSSES.length - 1, Math.max(0, stageNumber - 1));
  return { ...BASE_BOSSES[idx], stageNumber };
}
