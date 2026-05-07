// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// iOS WebView 対策:
// 1. <audio>.volume が iOS で効かないことがあるので、Web Audio API の GainNode で
//    音量制御する。再生は <audio> 要素経由なのでループ等の制御は楽。
// 2. BGM オフ時は pause() するとオーディオセッション全体に影響する場合があるので、
//    再生は続けたまま gain を 0 にする。
//
// 複数トラック対応: トラック URL ごとに <audio> 要素を生成・キャッシュする。
// playTrack(url) で現曲を pause、対象を play。同じ URL なら no-op。

const TRACKS = {
  stage: "audio/bgm/stage.mp3",
  menu: "audio/bgm/menu.mp3",
};

let ctx = null;
let gainNode = null;
let enabled = true;
let volume = 0.25;
let currentKey = null;
const audioByKey = new Map(); // key -> HTMLAudioElement

function ensureCtx() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ctx = new AC();
      gainNode = ctx.createGain();
      gainNode.gain.value = enabled ? volume : 0;
      gainNode.connect(ctx.destination);
    }
  } catch {
    // AudioContext が貼れなくても <audio>.volume で fallback
  }
}

function ensureAudio(key) {
  if (audioByKey.has(key)) return audioByKey.get(key);
  const url = TRACKS[key];
  if (!url) return null;
  const el = new Audio(url);
  el.loop = true;
  el.crossOrigin = "anonymous";
  ensureCtx();
  if (ctx && gainNode) {
    try {
      const src = ctx.createMediaElementSource(el);
      src.connect(gainNode);
    } catch {
      el.volume = enabled ? volume : 0;
    }
  } else {
    el.volume = enabled ? volume : 0;
  }
  audioByKey.set(key, el);
  return el;
}

function applyVolume() {
  const v = enabled ? volume : 0;
  if (gainNode) {
    gainNode.gain.value = v;
  } else {
    audioByKey.forEach((el) => { el.volume = v; });
  }
}

// iOS WebView は アプリがバックグラウンドに入ると <audio> をサスペンドし、
// 復帰時に勝手に再開する (しかも複数のトラックが同時再開して二重再生になることが
// 観察されている)。なので:
//  - hidden になった瞬間に「全トラックを完全停止」(currentKey は別変数で覚えておく)
//  - visible に戻った瞬間に「currentKey のトラックだけ再生」
// で「再生中なのは currentKey の 1 本だけ」を強制する。
let resumeKey = null;
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      resumeKey = currentKey;
      audioByKey.forEach((el) => {
        if (!el.paused) el.pause();
        el.currentTime = 0;
      });
    } else if (document.visibilityState === "visible") {
      // まず全トラック停止 (iOS が勝手に再開していたら掃除)
      audioByKey.forEach((el) => {
        if (!el.paused) el.pause();
        el.currentTime = 0;
      });
      if (resumeKey) {
        const el = audioByKey.get(resumeKey);
        if (el) {
          if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
          el.play().catch(() => {});
        }
        currentKey = resumeKey;
        resumeKey = null;
      }
    }
  });
}

function stopAllExcept(keepKey) {
  audioByKey.forEach((el, key) => {
    if (key === keepKey) return;
    if (!el.paused) el.pause();
    el.currentTime = 0;
  });
}

// 指定キーのトラックに切り替えて再生する。同じキーなら no-op (ただし他トラックが
// iOS の勝手な再開で鳴っていたら掃除する)。
export function playTrack(key) {
  if (!TRACKS[key]) return;
  // 念のため、対象 key 以外を全停止
  stopAllExcept(key);
  if (currentKey === key) {
    const el = audioByKey.get(key);
    if (el && el.paused) {
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      el.play().catch(() => {});
    }
    return;
  }
  currentKey = key;
  const el = ensureAudio(key);
  if (!el) return;
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  el.play().catch(() => {
    // ユーザー操作前だとここに来る。次のタップ時に再試行される想定。
  });
  // 保険: 1 フレ後に再度「対象以外を停止」(iOS が遅延で他トラックを再開する場合)
  setTimeout(() => stopAllExcept(currentKey), 50);
  setTimeout(() => stopAllExcept(currentKey), 300);
}

// 互換維持: 旧 startBgm は menu トラックを開始する想定
export function startBgm() {
  playTrack("menu");
}

export function stopBgm() {
  if (!currentKey) return;
  const el = audioByKey.get(currentKey);
  if (el) {
    el.pause();
    el.currentTime = 0;
  }
  currentKey = null;
}

export function setBgmVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  applyVolume();
}

export function setBgmEnabled(v) {
  enabled = !!v;
  applyVolume();
  // 再生自体は止めず、gain だけ 0/復帰させる。これで他の音への影響を防ぐ。
}
