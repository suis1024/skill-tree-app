// ステージ定義。各ステージは「雑魚波 90 秒 → ボス」の構成。
// stageNumber は 1-origin。

export const TOTAL_STAGES = 10;
export const WAVE_DURATION_MS = 90 * 1000;

// ステージ番号に応じた難易度倍率 (雑魚波)。
// 1.0 倍 (st1) → 2.0 倍 (st10) を線形補間。spawn 頻度・敵 HP・ダメージに掛ける。
export function difficultyMul(stageNumber) {
  const t = (stageNumber - 1) / (TOTAL_STAGES - 1); // 0..1
  return 1 + t * 1.0;
}

// クリア報酬 (ボス撃破時に入るボーナスコイン)。
export function clearBonusCoins(stageNumber) {
  return 20 + stageNumber * 10;
}
