// ボス定義。ステージ番号からテーブル参照する。

// HP / contactDamage は ×10 スケール。
// shape は shapes.js のキー。未指定なら rect。
//
// pattern (移動 + 攻撃のセット):
//   - pendulum:        左右に振り子。両端で停止 → 扇撃ち → 移動再開
//   - figure8:         中央で 8 の字に動き続ける + 周期リング弾
//   - circle_orbit:    中心軸の周りを円運動 + 放射状弾
//   - anchored_ring:   中央固定 + リング弾を周期的に撒く
//   - zigzag_descend:  画面上端で横揺れしながら上下動 + 周期的に下方向扇撃ち
//
// 各 pattern が読むパラメータ:
//   - shotSpeed:        弾速度
//   - shotIntervalMs:   主攻撃の周期 (扇 / リング / 放射)
//   - moveSpeed:        移動速度 (px/s)
//   - amplitude:        パターンに応じた振幅 (px)
//   - bulletCount:      撃つ弾の数 (扇/リング)
const BASE_BOSSES = [
  // st1: 振り子。基本練習用
  { color: 0xb91c1c, size: 64, hp: 800,  contactDamage: 20, shape: "rect",
    pattern: "pendulum", moveSpeed: 110, amplitude: 220, shotSpeed: 230, shotIntervalMs: 1100, bulletCount: 3 },
  // st2: 8 の字、軽快
  { color: 0x2563eb, size: 60, hp: 1300, contactDamage: 20, shape: "triangle",
    pattern: "figure8", moveSpeed: 130, amplitude: 180, shotSpeed: 240, shotIntervalMs: 1300, bulletCount: 8 },
  // st3: 中央固定でリング弾
  { color: 0xf59e0b, size: 64, hp: 1800, contactDamage: 30, shape: "pentagon",
    pattern: "anchored_ring", shotSpeed: 230, shotIntervalMs: 1400, bulletCount: 8 },
  // st4: 振り子 (速め、扇広め)
  { color: 0x9333ea, size: 74, hp: 2500, contactDamage: 30, shape: "hexagon",
    pattern: "pendulum", moveSpeed: 140, amplitude: 240, shotSpeed: 250, shotIntervalMs: 950,  bulletCount: 5 },
  // st5: 円軌道 + 放射
  { color: 0xdb2777, size: 68, hp: 3200, contactDamage: 30, shape: "diamond",
    pattern: "circle_orbit", moveSpeed: 100, amplitude: 180, shotSpeed: 240, shotIntervalMs: 900,  bulletCount: 5 },
  // st6: 8 の字 (速)、リング多め
  { color: 0x10b981, size: 64, hp: 4000, contactDamage: 40, shape: "triangle",
    pattern: "figure8", moveSpeed: 180, amplitude: 200, shotSpeed: 270, shotIntervalMs: 1100, bulletCount: 12 },
  // st7: ジグザグ降下 (上端で横揺れ)、扇撃ち
  { color: 0x06b6d4, size: 74, hp: 4800, contactDamage: 40, shape: "pentagon",
    pattern: "zigzag_descend", moveSpeed: 150, amplitude: 260, shotSpeed: 290, shotIntervalMs: 700, bulletCount: 5 },
  // st8: 中央固定リング (高密度)
  { color: 0xf97316, size: 84, hp: 6000, contactDamage: 50, shape: "hexagon",
    pattern: "anchored_ring", shotSpeed: 240, shotIntervalMs: 850,  bulletCount: 14 },
  // st9: 円軌道 (高速、放射 7way)
  { color: 0xa3e635, size: 80, hp: 7200, contactDamage: 50, shape: "octagon",
    pattern: "circle_orbit", moveSpeed: 140, amplitude: 200, shotSpeed: 290, shotIntervalMs: 700,  bulletCount: 7 },
  // st10: ラスボス、ジグザグ降下 + リング多重
  { color: 0xe11d48, size: 96, hp: 9500, contactDamage: 60, shape: "star",
    pattern: "zigzag_descend", moveSpeed: 170, amplitude: 280, shotSpeed: 290, shotIntervalMs: 550, bulletCount: 8 },
];

export function bossForStage(stageNumber) {
  const idx = Math.min(BASE_BOSSES.length - 1, Math.max(0, stageNumber - 1));
  return { ...BASE_BOSSES[idx], stageNumber };
}
