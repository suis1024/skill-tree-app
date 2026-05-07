// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// iOS WebView 制約:
// 1. <audio>.volume は無視される (常に最大音量) → 音量制御には Web Audio が要る
// 2. しかし AudioContext のデフォルト sampleRate (48000) で 44.1k の MP3 を再生すると
//    リサンプリングで音がやや高くなる
//   → AudioContext を sampleRate: 44100 で明示的に作って一致させる
//
// 複数トラック対応: トラック URL ごとに <audio> 要素を生成・キャッシュ。

const TRACKS = {
  stage: "audio/bgm/stage.mp3",
  menu: "audio/bgm/menu.mp3",
};

const TARGET_SAMPLE_RATE = 44100;

let ctx = null;
let gainNode = null;
let enabled = true;
let volume = 0.25;
let currentKey = null;
const audioByKey = new Map(); // key -> { el, src }

function ensureCtx() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // 注意: sampleRate を明示すると MP3 ファイル側のレートと不一致のとき
    // リサンプリングで音階がずれる (44.1k と 48k が混在しているため)。
    // デフォルトに任せて再生中の playback rate ドリフトのみ抑制する。
    ctx = new AC();
    gainNode = ctx.createGain();
    gainNode.gain.value = enabled ? volume : 0;
    gainNode.connect(ctx.destination);
  } catch {
    // AudioContext が貼れない場合のフォールバック
  }
}

function ensureAudio(key) {
  const cached = audioByKey.get(key);
  if (cached) return cached;
  const url = TRACKS[key];
  if (!url) return null;
  const el = new Audio(url);
  el.loop = true;
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  ensureCtx();
  let src = null;
  if (ctx && gainNode) {
    try {
      src = ctx.createMediaElementSource(el);
      src.connect(gainNode);
    } catch {
      // 失敗したら <audio>.volume にフォールバック (iOS では効かないことが多いが…)
      el.volume = enabled ? volume : 0;
    }
  } else {
    el.volume = enabled ? volume : 0;
  }
  const entry = { el, src };
  audioByKey.set(key, entry);
  return entry;
}

function applyVolume() {
  const v = enabled ? volume : 0;
  if (gainNode) {
    gainNode.gain.value = v;
  } else {
    audioByKey.forEach(({ el }) => { el.volume = v; });
  }
}

let resumeKey = null;
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      resumeKey = currentKey;
      audioByKey.forEach(({ el }) => {
        if (!el.paused) el.pause();
        el.currentTime = 0;
      });
    } else if (document.visibilityState === "visible") {
      audioByKey.forEach(({ el }) => {
        if (!el.paused) el.pause();
        el.currentTime = 0;
      });
      if (resumeKey) {
        const entry = audioByKey.get(resumeKey);
        if (entry) {
          if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
          entry.el.currentTime = 0;
          entry.el.play().catch(() => {});
        }
        currentKey = resumeKey;
        resumeKey = null;
      }
    }
  });
}

function stopAllExcept(keepKey) {
  audioByKey.forEach(({ el }, key) => {
    if (key === keepKey) return;
    if (!el.paused) el.pause();
    el.currentTime = 0;
  });
}

export function playTrack(key) {
  if (!TRACKS[key]) return;
  stopAllExcept(key);
  if (currentKey === key) {
    const entry = audioByKey.get(key);
    if (entry && entry.el.paused) {
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      entry.el.play().catch(() => {});
    }
    return;
  }
  currentKey = key;
  const entry = ensureAudio(key);
  if (!entry) return;
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  entry.el.currentTime = 0;
  entry.el.play().catch(() => {});
  setTimeout(() => stopAllExcept(currentKey), 50);
  setTimeout(() => stopAllExcept(currentKey), 300);
}

export function startBgm() {
  playTrack("menu");
}

export function stopBgm() {
  if (!currentKey) return;
  const entry = audioByKey.get(currentKey);
  if (entry) {
    entry.el.pause();
    entry.el.currentTime = 0;
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
}
