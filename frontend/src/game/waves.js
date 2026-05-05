// ステージごとの敵 wave 定義。
//
// 各 wave は以下のフィールドを持つ:
//   type:        ENEMY_TYPES のキー
//   startSec:    ステージ開始からの秒。これに達するまでスポーンしない (デフォ 0)
//   endSec:      この秒に達したらスポーン停止 (デフォ 90 = ステージ終了時)
//   intervalMs:  この間隔で連続スポーン (デフォ 1000)
//   count:       指定するとこの体数だけ出して打ち止め (省略時は startSec..endSec ずっと)
//   hpMul:       基礎 HP に対する倍率 (デフォ 1.0)
//   speedMul:    基礎速度に対する倍率 (デフォ 1.0)
//   damageMul:   接触ダメ倍率 (デフォ 1.0)
//
// 同じステージに複数の wave があれば並行で動く。

function wave(opts) {
  return {
    type: "grunt",
    startSec: 0,
    endSec: 90,
    intervalMs: 1000,
    hpMul: 1,
    speedMul: 1,
    damageMul: 1,
    ...opts,
  };
}

export const STAGE_WAVES = {
  // st1: 入門。grunt のみゆっくり。
  1: [
    wave({ type: "grunt", startSec: 0,  endSec: 90, intervalMs: 1100 }),
  ],
  // st2: swift デビュー。
  2: [
    wave({ type: "grunt", startSec: 0,  endSec: 90, intervalMs: 950 }),
    wave({ type: "swift", startSec: 30, endSec: 90, intervalMs: 1800 }),
  ],
  // st3: tank デビュー。grunt は前半のみ。
  3: [
    wave({ type: "grunt", startSec: 0,  endSec: 60, intervalMs: 850 }),
    wave({ type: "swift", startSec: 20, endSec: 90, intervalMs: 1600 }),
    wave({ type: "tank",  startSec: 45, endSec: 90, intervalMs: 6000, hpMul: 1.0 }),
  ],
  // st4: shooter デビュー + bouncer デビュー。
  4: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 800 }),
    wave({ type: "swift",   startSec: 15, endSec: 90, intervalMs: 1400 }),
    wave({ type: "shooter", startSec: 30, endSec: 90, intervalMs: 5000 }),
    wave({ type: "bouncer", startSec: 45, endSec: 90, intervalMs: 7000 }),
  ],
  // st5: swift ラッシュ。中盤の山場。bouncer 増。
  5: [
    wave({ type: "grunt",   startSec: 0,  endSec: 30, intervalMs: 800 }),
    wave({ type: "swift",   startSec: 0,  endSec: 90, intervalMs: 700, speedMul: 1.05 }),
    wave({ type: "bouncer", startSec: 30, endSec: 90, intervalMs: 5500 }),
    wave({ type: "tank",    startSec: 60, endSec: 90, intervalMs: 5000, hpMul: 1.1 }),
  ],
  // st6: charger デビュー。物量増加。
  6: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 700, hpMul: 1.1 }),
    wave({ type: "swift",   startSec: 20, endSec: 90, intervalMs: 1100 }),
    wave({ type: "tank",    startSec: 30, endSec: 90, intervalMs: 4500, hpMul: 1.15 }),
    wave({ type: "shooter", startSec: 50, endSec: 90, intervalMs: 4500 }),
    wave({ type: "charger", startSec: 30, endSec: 90, intervalMs: 7000 }),
  ],
  // st7: turret デビュー。位置取り重視。
  7: [
    wave({ type: "grunt",   startSec: 0,  endSec: 60, intervalMs: 700, hpMul: 1.1 }),
    wave({ type: "swift",   startSec: 30, endSec: 90, intervalMs: 900,  speedMul: 1.05 }),
    wave({ type: "shooter", startSec: 0,  endSec: 90, intervalMs: 3500, hpMul: 1.1 }),
    wave({ type: "turret",  startSec: 25, endSec: 90, intervalMs: 12000 }),
    wave({ type: "bouncer", startSec: 40, endSec: 90, intervalMs: 6000 }),
  ],
  // st8: tank の壁 + charger ラッシュ。
  8: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 700, hpMul: 1.15 }),
    wave({ type: "tank",    startSec: 0,  endSec: 90, intervalMs: 3000, hpMul: 1.2 }),
    wave({ type: "shooter", startSec: 30, endSec: 90, intervalMs: 4000, hpMul: 1.1 }),
    wave({ type: "charger", startSec: 20, endSec: 90, intervalMs: 5500 }),
  ],
  // st9: 全部混ぜたカオス。
  9: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 600, hpMul: 1.2 }),
    wave({ type: "swift",   startSec: 0,  endSec: 90, intervalMs: 800, hpMul: 1.1, speedMul: 1.1 }),
    wave({ type: "tank",    startSec: 20, endSec: 90, intervalMs: 3500, hpMul: 1.25 }),
    wave({ type: "shooter", startSec: 30, endSec: 90, intervalMs: 3500, hpMul: 1.15 }),
    wave({ type: "bouncer", startSec: 0,  endSec: 90, intervalMs: 5000, hpMul: 1.1 }),
    wave({ type: "turret",  startSec: 40, endSec: 90, intervalMs: 10000 }),
  ],
  // st10: 最終ステージ。生き残れ。
  10: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 500, hpMul: 1.3, speedMul: 1.05 }),
    wave({ type: "swift",   startSec: 0,  endSec: 90, intervalMs: 700, hpMul: 1.2, speedMul: 1.15 }),
    wave({ type: "tank",    startSec: 10, endSec: 90, intervalMs: 2800, hpMul: 1.3 }),
    wave({ type: "shooter", startSec: 20, endSec: 90, intervalMs: 3000, hpMul: 1.2 }),
    wave({ type: "bouncer", startSec: 0,  endSec: 90, intervalMs: 4000, hpMul: 1.2 }),
    wave({ type: "charger", startSec: 15, endSec: 90, intervalMs: 4500, hpMul: 1.15 }),
    wave({ type: "turret",  startSec: 30, endSec: 90, intervalMs: 8000 }),
  ],
};

export function getStageWaves(stageNumber) {
  return STAGE_WAVES[stageNumber] || STAGE_WAVES[1];
}
