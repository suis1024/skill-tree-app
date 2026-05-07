// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// 実装方針 (iOS WebView 対策):
// - HTMLAudioElement + MediaElementAudioSourceNode は使わない
//   (iOS で復帰時に sample rate ドリフトして音階が高くなる既知バグ)
// - 起動時に MP3 を fetch → decodeAudioData で AudioBuffer 化
// - 再生時は AudioBufferSourceNode を毎回生成 (loop=true、破棄時は stop)
// - GainNode 1 個で音量制御
//
// 制約:
// - decode の間は無音 (数百 ms〜数秒)。decode 完了後に自動再生開始
// - <audio>.volume は使わないので iOS の volume 無視問題も回避

const TRACKS = {
  stage: "audio/bgm/stage.mp3",
  menu: "audio/bgm/menu.mp3",
};

let ctx = null;
let gainNode = null;
let enabled = true;
let volume = 0.25;
let currentKey = null;
let currentSource = null; // 再生中の AudioBufferSourceNode
const buffers = new Map(); // key -> AudioBuffer
const decoding = new Map(); // key -> Promise<AudioBuffer>

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    gainNode = ctx.createGain();
    gainNode.gain.value = enabled ? volume : 0;
    gainNode.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

async function loadBuffer(key) {
  if (buffers.has(key)) return buffers.get(key);
  if (decoding.has(key)) return decoding.get(key);
  const url = TRACKS[key];
  if (!url) return null;
  const c = ensureCtx();
  if (!c) return null;
  const promise = (async () => {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buf = await new Promise((resolve, reject) => {
      // Safari は callback 形式しか実装してない時期もあったので両対応
      try {
        const p = c.decodeAudioData(arr, resolve, reject);
        if (p && typeof p.then === "function") p.then(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
    buffers.set(key, buf);
    decoding.delete(key);
    return buf;
  })();
  decoding.set(key, promise);
  return promise;
}

function stopCurrentSource() {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    try { currentSource.disconnect(); } catch {}
    currentSource = null;
  }
}

function startSource(buf) {
  const c = ensureCtx();
  if (!c || !gainNode) return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(gainNode);
  try { src.start(0); } catch {}
  return src;
}

function applyVolume() {
  if (gainNode) gainNode.gain.value = enabled ? volume : 0;
}

let resumeKey = null;
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      resumeKey = currentKey;
      // 念のため source を停止 (二重再生防止)
      stopCurrentSource();
    } else if (document.visibilityState === "visible") {
      if (resumeKey) {
        const k = resumeKey;
        resumeKey = null;
        // ctx を resume してから新規 source で再生
        const c = ensureCtx();
        if (c && c.state === "suspended") c.resume().catch(() => {});
        playTrack(k);
      }
    }
  });
}

export async function playTrack(key) {
  if (!TRACKS[key]) return;
  if (currentKey === key && currentSource) return; // 既に再生中
  currentKey = key;
  // 別 key を停止
  stopCurrentSource();
  const c = ensureCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
  let buf = buffers.get(key);
  if (!buf) {
    try {
      buf = await loadBuffer(key);
    } catch {
      return;
    }
    // 待ってる間に別 track に切り替わってたら何もしない
    if (currentKey !== key) return;
  }
  if (!buf) return;
  stopCurrentSource(); // 念のため
  currentSource = startSource(buf);
}

// 互換維持
export function startBgm() {
  playTrack("menu");
}

export function stopBgm() {
  stopCurrentSource();
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
