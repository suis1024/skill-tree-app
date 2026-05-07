// React 画面 (タイトル / スキルツリー / 設定 / 結果 / ポーズ) 用の SE 再生。
// Phaser 内の SE は game/audio.js が担当する。こっちは <audio> 要素を毎回生成して
// クリック音や購入音を鳴らすだけのシンプル実装。
//
// 配置先 (任意): frontend/public/audio/se/
//   - ui_click.mp3   ボタン押下
//   - ui_upgrade.mp3 スキル購入成功
//
// 設定が seEnabled=false なら no-op。volume は seVolume (0..1) を反映。
// ファイルが置かれていない場合は静かに失敗する。

import { readSettings } from "./settings";

const TRACKS = {
  click:   { url: "audio/se/ui_click.mp3", volume: 1.0 },
  upgrade: { url: "audio/se/ui_upgrade.mp3", volume: 0.7 },
};

// 同時多発を防ぐためのインスタンスプール (キーごと)
const pool = new Map();

function getEl(key) {
  const def = TRACKS[key];
  if (!def) return null;
  if (!pool.has(key)) {
    const el = new Audio(def.url);
    el.preload = "auto";
    el.addEventListener("error", () => {
      // ファイル未配置時は黙って諦める
    });
    pool.set(key, el);
  }
  return pool.get(key);
}

export function playUiSe(key) {
  try {
    const s = readSettings();
    if (s.seEnabled === false) return;
    const def = TRACKS[key];
    if (!def) return;
    const el = getEl(key);
    if (!el) return;
    el.currentTime = 0;
    el.volume = Math.max(0, Math.min(1, def.volume * (s.seVolume ?? 1)));
    el.play().catch(() => {
      // ユーザー操作前 / ファイル不在で失敗 → 無視
    });
  } catch {
    // settings 取得失敗等は無視
  }
}
