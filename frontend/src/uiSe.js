// React 画面用の SE 再生。Phaser 内 SE は game/audio.js が担当。
//
// 配置先: frontend/public/audio/se/ui_click.mp3, ui_upgrade.mp3
// settings の seEnabled=false なら no-op。volume は seVolume (0..1) を反映。
//
// 連打時のばらつき防止のため、再生のたびに new Audio(url) する (pool しない)。
// インスタンス使い回しは iOS WebView でサンプル断片化や前回 currentTime の
// 残留で「破裂音」「無音」「半端な切り出し」を起こすことがある。

import { readSettings } from "./settings";

const TRACKS = {
  click:   { url: "audio/se/ui_click.mp3", volume: 1.0 },
  upgrade: { url: "audio/se/ui_upgrade.mp3", volume: 0.7 },
};

export function playUiSe(key) {
  try {
    const s = readSettings();
    if (s.seEnabled === false) return;
    const def = TRACKS[key];
    if (!def) return;
    const el = new Audio(def.url);
    el.volume = Math.max(0, Math.min(1, def.volume * (s.seVolume ?? 1)));
    el.play().catch(() => {});
    // 終わったら自動で破棄させる (Audio オブジェクトはガベコレ任せでも OK)
    el.addEventListener("ended", () => {
      try { el.src = ""; } catch {}
    });
  } catch {
    // 設定取得失敗等は無視
  }
}
