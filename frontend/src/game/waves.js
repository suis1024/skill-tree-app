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
  // ============================================================
  // st1: チュートリアル。grunt だけ。序盤少なめ → 中盤やや増 → 終盤少し詰める
  // ============================================================
  1: [
    wave({ type: "grunt", startSec: 0,  endSec: 30, intervalMs: 1500 }), // 序盤: ゆっくり
    wave({ type: "grunt", startSec: 30, endSec: 60, intervalMs: 1100 }), // 中盤: 少し増
    wave({ type: "grunt", startSec: 60, endSec: 90, intervalMs: 800 }),  // 終盤: 詰めてくる
  ],

  // ============================================================
  // st2: swift デビュー。速度差を意識させる。
  //   序盤: grunt だけ → 中盤: swift 投入 → 終盤: swift がメイン
  // ============================================================
  2: [
    wave({ type: "grunt", startSec: 0,  endSec: 60, intervalMs: 1100 }),
    wave({ type: "grunt", startSec: 60, endSec: 90, intervalMs: 700 }),  // 終盤: grunt 増
    wave({ type: "swift", startSec: 30, endSec: 60, intervalMs: 2200 }), // 序チラ見せ
    wave({ type: "swift", startSec: 60, endSec: 90, intervalMs: 1100 }), // 終盤: swift 主役
  ],

  // ============================================================
  // st3: 重装デビュー。tank の HP に手こずる体験。
  //   序盤: 軽快 → 中盤: tank 1 体目 → 終盤: 静寂のあと一気に
  // ============================================================
  3: [
    wave({ type: "grunt", startSec: 0,  endSec: 25, intervalMs: 1000 }),
    wave({ type: "swift", startSec: 15, endSec: 50, intervalMs: 1800 }),
    wave({ type: "tank",  startSec: 30, endSec: 90, intervalMs: 6000 }), // 中盤から定間隔で 1 体ずつ
    wave({ type: "grunt", startSec: 55, endSec: 60, intervalMs: 1500 }), // 静寂 (5 秒だけ少量)
    wave({ type: "grunt", startSec: 65, endSec: 90, intervalMs: 700 }),  // 終盤ラッシュ
    wave({ type: "swift", startSec: 70, endSec: 90, intervalMs: 1400 }),
  ],

  // ============================================================
  // st4: 弾幕デビュー。shooter と bouncer。距離管理を学ぶ。
  //   序盤: 慣らし → 中盤: shooter 追加 → 終盤: bouncer 加わって弾とぶつかり物の両方
  // ============================================================
  4: [
    wave({ type: "grunt",   startSec: 0,  endSec: 30, intervalMs: 950 }),
    wave({ type: "swift",   startSec: 10, endSec: 60, intervalMs: 1400 }),
    wave({ type: "shooter", startSec: 25, endSec: 90, intervalMs: 4000 }),
    wave({ type: "bouncer", startSec: 50, endSec: 90, intervalMs: 4500 }),
    wave({ type: "grunt",   startSec: 70, endSec: 90, intervalMs: 700 }), // 終盤ラッシュ
  ],

  // ============================================================
  // st5: swift ラッシュ。中盤の山場。
  //   構成: 序盤 mix → 中盤 swift だけの嵐 → 終盤 tank が紛れ込む
  // ============================================================
  5: [
    wave({ type: "grunt", startSec: 0,  endSec: 25, intervalMs: 1000 }),
    wave({ type: "swift", startSec: 0,  endSec: 25, intervalMs: 1500 }),
    // 中盤: swift だけ怒涛
    wave({ type: "swift", startSec: 25, endSec: 60, intervalMs: 550, speedMul: 1.05 }),
    wave({ type: "bouncer", startSec: 35, endSec: 70, intervalMs: 5000 }),
    // 終盤: tank が混ざって渋滞
    wave({ type: "tank",  startSec: 60, endSec: 90, intervalMs: 4000 }),
    wave({ type: "swift", startSec: 60, endSec: 90, intervalMs: 900 }),
  ],

  // ============================================================
  // st6: 突進攻勢。charger デビュー。「予兆を見て横ステップ」を要求。
  //   序盤: 通常 → 中盤: charger 投入、密度落とす → 終盤: 一気に詰める
  // ============================================================
  6: [
    wave({ type: "grunt",   startSec: 0,  endSec: 30, intervalMs: 850*2 }),
    wave({ type: "swift",   startSec: 10, endSec: 30, intervalMs: 1500*2 }),
    // 中盤: charger 主体、雑魚は減らす (charger を見れる余白)
    wave({ type: "charger", startSec: 25, endSec: 65, intervalMs: 5000*2 }),
    wave({ type: "grunt",   startSec: 30, endSec: 65, intervalMs: 1300*2 }),
    wave({ type: "shooter", startSec: 35, endSec: 65, intervalMs: 5000*2 }),
    // 終盤: 物量
    wave({ type: "grunt",   startSec: 65, endSec: 90, intervalMs: 600*2 }),
    wave({ type: "swift",   startSec: 65, endSec: 90, intervalMs: 1000*2 }),
    wave({ type: "charger", startSec: 70, endSec: 90, intervalMs: 4000*2 }),
  ],

  // ============================================================
  // st7: 定点砲撃。turret 主体。動き続けないと弾に当たる。
  //   序盤: turret 1 体目 → 中盤: 2 体目で挟まれる → 終盤: shooter 加わってさらに弾増
  // ============================================================
  7: [
    wave({ type: "grunt",   startSec: 0,  endSec: 30, intervalMs: 2000 }),
    wave({ type: "swift",   startSec: 0,  endSec: 90, intervalMs: 3000 }),
    // 中盤: turret 2 体並走
    wave({ type: "turret",  startSec: 15, endSec: 90, intervalMs: 25000, count: 1 }), // 1 体目
    wave({ type: "turret",  startSec: 45, endSec: 90, intervalMs: 25000, count: 1 }), // 2 体目
    wave({ type: "shooter", startSec: 30, endSec: 90, intervalMs: 3500*2 }),
    wave({ type: "bouncer", startSec: 50, endSec: 90, intervalMs: 6000*2 }),
    wave({ type: "grunt",   startSec: 70, endSec: 90, intervalMs: 800*2 }),
  ],

  // ============================================================
  // st8: 重装と突進。tank と charger が並列。固いのと速いのを撃ち分ける。
  //   序盤: tank ばら撒き → 中盤: charger 投入で挟撃 → 終盤: shooter 弾も追加
  // ============================================================
  8: [
    wave({ type: "grunt",   startSec: 0,  endSec: 90, intervalMs: 800 }),
    wave({ type: "tank",    startSec: 0,  endSec: 90, intervalMs: 3500 }),
    // 中盤: charger 加わる
    wave({ type: "charger", startSec: 25, endSec: 90, intervalMs: 4500 }),
    // 終盤: shooter で遠距離プレッシャー
    wave({ type: "shooter", startSec: 55, endSec: 90, intervalMs: 3000 }),
    wave({ type: "swift",   startSec: 70, endSec: 90, intervalMs: 1100 }),
  ],

  // ============================================================
  // st9: 全部混ぜカオス。すべての敵が交錯する。
  //   構成: 序盤から全種ちょい出し → 中盤に turret 追加 → 終盤に密度を倍化
  // ============================================================
  9: [
    wave({ type: "grunt",   startSec: 0,  endSec: 60, intervalMs: 800 }),
    wave({ type: "swift",   startSec: 0,  endSec: 60, intervalMs: 1100 }),
    wave({ type: "tank",    startSec: 5,  endSec: 60, intervalMs: 4500 }),
    wave({ type: "shooter", startSec: 10, endSec: 60, intervalMs: 6000 }),
    wave({ type: "bouncer", startSec: 15, endSec: 60, intervalMs: 5000 }),
    wave({ type: "charger", startSec: 25, endSec: 60, intervalMs: 5500 }),
    wave({ type: "turret",  startSec: 30, endSec: 90, intervalMs: 30000, count: 1 }),
    // 終盤密度倍
    wave({ type: "grunt",   startSec: 60, endSec: 90, intervalMs: 500 }),
    wave({ type: "swift",   startSec: 60, endSec: 90, intervalMs: 700 }),
    wave({ type: "tank",    startSec: 60, endSec: 90, intervalMs: 2500 }),
    wave({ type: "charger", startSec: 65, endSec: 90, intervalMs: 3500 }),
  ],

  // ============================================================
  // st10: 最終決戦。明確な 3 ピーク構成。
  //   0-30: 中ボス級ラッシュ (tank+charger 序盤投入)
  //   30-60: turret 群 + 物量
  //   60-90: 全部全部全部
  // ============================================================
  10: [
    // フェーズ 1: 0-30s, 重装デビュー早出し
    wave({ type: "grunt",   startSec: 0,  endSec: 30, intervalMs: 600 }),
    wave({ type: "swift",   startSec: 0,  endSec: 30, intervalMs: 800 }),
    wave({ type: "tank",    startSec: 5,  endSec: 30, intervalMs: 3000 }),
    wave({ type: "charger", startSec: 10, endSec: 30, intervalMs: 4000 }),

    // フェーズ 2: 30-60s, turret + 弾幕
    wave({ type: "turret",  startSec: 30, endSec: 90, intervalMs: 25000, count: 2 }),
    wave({ type: "shooter", startSec: 30, endSec: 60, intervalMs: 2500 }),
    wave({ type: "bouncer", startSec: 30, endSec: 60, intervalMs: 3500 }),
    wave({ type: "grunt",   startSec: 30, endSec: 60, intervalMs: 700 }),

    // フェーズ 3: 60-90s, 全部全部全部
    wave({ type: "grunt",   startSec: 60, endSec: 90, intervalMs: 400 }),
    wave({ type: "swift",   startSec: 60, endSec: 90, intervalMs: 600 }),
    wave({ type: "tank",    startSec: 60, endSec: 90, intervalMs: 2200 }),
    wave({ type: "charger", startSec: 65, endSec: 90, intervalMs: 3000 }),
    wave({ type: "shooter", startSec: 65, endSec: 90, intervalMs: 6000 }),
    wave({ type: "bouncer", startSec: 70, endSec: 90, intervalMs: 3000 }),
  ],
};

export function getStageWaves(stageNumber) {
  return STAGE_WAVES[stageNumber] || STAGE_WAVES[1];
}
