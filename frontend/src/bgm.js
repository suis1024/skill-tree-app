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

// 指定キーのトラックに切り替えて再生する。同じキーなら何もしない。
export function playTrack(key) {
  if (!TRACKS[key]) return;
  if (currentKey === key) {
    // 既に再生中ならそのまま (iOS で confirm 後に paused 化することがあるので念のため再生試行)
    const el = audioByKey.get(key);
    if (el && el.paused) el.play().catch(() => {});
    return;
  }
  // 既存トラックを停止
  if (currentKey) {
    const prev = audioByKey.get(currentKey);
    if (prev) {
      prev.pause();
      prev.currentTime = 0;
    }
  }
  currentKey = key;
  const el = ensureAudio(key);
  if (!el) return;
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  el.play().catch(() => {
    // ユーザー操作前だとここに来る。次のタップ時に再試行される想定。
  });
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
