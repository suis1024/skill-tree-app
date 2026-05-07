// ステージ定義。各ステージは「雑魚波 90 秒 → ボス」の構成。
// stageNumber は 1-origin。

export const TOTAL_STAGES = 10;
export const WAVE_DURATION_MS = 90 * 1000;

// ステージごとの全体倍率テーブル。
// hp/speed/damage は雑魚 (waves.js 個別倍率と乗算される)。
// ボス HP は別途 boss.hpMul (こちらは bosses.js 既定値に乗算)。
// coin は敵ドロップ 1 枚あたりの value に乗算 (枚数は据え置き)。
const DEFAULT_MUL = { hp: 1.0, speed: 1.0, damage: 1.0, bossHp: 1.0, coin: 1.0 };

export const STAGE_MUL = {
  1:  { hp: 1.00, speed: 1.00, damage: 1.00, bossHp: 1.00, coin: 1.0 },
  2:  { hp: 2,    speed: 1.00, damage: 1.05, bossHp: 1.05, coin: 1.22 },
  3:  { hp: 4,    speed: 1.00, damage: 1.15, bossHp: 1.10, coin: 1.44 },
  4:  { hp: 5,    speed: 1.00, damage: 1.30, bossHp: 1.15, coin: 1.67 },
  5:  { hp: 10,   speed: 1.00, damage: 1.50, bossHp: 1.20, coin: 1.89 },
  6:  { hp: 15,   speed: 1.00, damage: 1.75, bossHp: 1.30, coin: 2.11 },
  7:  { hp: 30,   speed: 1.00, damage: 2.00, bossHp: 1.40, coin: 2.33 },
  8:  { hp: 40,   speed: 1.00, damage: 2.25, bossHp: 1.50, coin: 2.56 },
  9:  { hp: 50,   speed: 1.00, damage: 2.50, bossHp: 1.65, coin: 2.78 },
  10: { hp: 60,   speed: 1.00, damage: 2.75, bossHp: 1.80, coin: 3.0 },
};

export function stageMul(stageNumber) {
  return STAGE_MUL[stageNumber] || DEFAULT_MUL;
}

// クリア報酬 (ボス撃破時に入るボーナスコイン)。
export function clearBonusCoins(stageNumber) {
  return 20 + stageNumber * 10;
}
