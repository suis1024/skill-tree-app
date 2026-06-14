// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// 実装方針 (iOS WebView 対策):
// - HTMLAudioElement + MediaElementAudioSourceNode は使わない
//   (iOS で復帰時に sample rate ドリフトして音階が高くなる既知バグ)
// - 起動時に MP3 を fetch → decodeAudioData で AudioBuffer 化 (1 度だけ)
// - 再生時は AudioBufferSourceNode を毎回生成 (loop=true、破棄時は stop)
// - GainNode 1 個で音量制御
// - AudioContext は audioContext.js の共有 ctx を使う (uiSe と統一)
//
// バックグラウンド復帰時の対策:
// - AudioContext.state が "interrupted" のまま固まるバグがあるので、
//   visible 時に state を見て、interrupted/suspended なら ctx を完全に閉じて
//   作り直す。AudioBuffer 自体はファイルとして再 decode する必要があるので
//   キャッシュを使い回し、新 ctx で再 decode する (iOS は ctx ごとに buffer
//   を持つ必要があるため)

import { getCtx, ensureRunning, onRebuild } from "./audioContext";

const TRACKS = {
  stage: "audio/bgm/stage.mp3",
  menu: "audio/bgm/menu.mp3",
};

let gainNode = null;
let gainCtx = null; // gainNode が属する ctx (作り直し検知用)
let enabled = true;
let volume = 0.25;
let currentKey = null;
let currentSource = null; // 再生中の AudioBufferSourceNode
const arrayBuffers = new Map(); // key -> ArrayBuffer (生 MP3 データ、ctx を超えて使い回せる)
const fetching = new Map(); // key -> Promise<ArrayBuffer>
let decodedFor = null; // どの ctx に対して buffers をデコードしたか
const buffers = new Map(); // key -> AudioBuffer (decodedFor 専用)

function ensureGain() {
  const c = getCtx();
  if (!c) return null;
  if (!gainNode || gainCtx !== c) {
    gainNode = c.createGain();
    gainNode.gain.value = enabled ? volume : 0;
    gainNode.connect(c.destination);
    gainCtx = c;
  }
  return gainNode;
}

// ctx が作り直されたら buffers と gainNode を破棄
onRebuild(() => {
  buffers.clear();
  decodedFor = null;
  gainNode = null;
  gainCtx = null;
  currentSource = null;
});

async function fetchArrayBuffer(key) {
  if (arrayBuffers.has(key)) return arrayBuffers.get(key);
  if (fetching.has(key)) return fetching.get(key);
  const url = TRACKS[key];
  if (!url) return null;
  const promise = (async () => {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    arrayBuffers.set(key, arr);
    fetching.delete(key);
    return arr;
  })();
  fetching.set(key, promise);
  return promise;
}

async function getBuffer(key) {
  const c = getCtx();
  if (!c) return null;
  if (decodedFor !== c) {
    buffers.clear();
    decodedFor = c;
  }
  if (buffers.has(key)) return buffers.get(key);
  const arr = await fetchArrayBuffer(key);
  if (!arr) return null;
  const copy = arr.slice(0);
  const buf = await new Promise((resolve, reject) => {
    try {
      const p = c.decodeAudioData(copy, resolve, reject);
      if (p && typeof p.then === "function") p.then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
  buffers.set(key, buf);
  return buf;
}

function stopCurrentSource() {
  if (currentSource) {
    try { currentSource.stop(); } catch {}
    try { currentSource.disconnect(); } catch {}
    currentSource = null;
  }
}

function startSource(buf) {
  const c = getCtx();
  const g = ensureGain();
  if (!c || !g) return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(g);
  try { src.start(0); } catch {}
  return src;
}

function applyVolume() {
  const g = ensureGain();
  if (g) g.gain.value = enabled ? volume : 0;
}

// 並行実行された playTrack 同士の競合を防ぐため、最後に発行された要求のみを有効に
// する。各 playTrack 開始時に token を発行し、await ごとに「自分の token が最新か」
// 確認して無効ならその時点で抜ける。
let playToken = 0;

let resumeKey = null;
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      resumeKey = currentKey;
      stopCurrentSource();
    } else if (document.visibilityState === "visible") {
      if (!resumeKey) return;
      const k = resumeKey;
      resumeKey = null;
      currentKey = null;
      playTrack(k);
      setTimeout(() => {
        if (currentKey === k && !currentSource) playTrack(k);
      }, 400);
    }
  });
}

export async function playTrack(key) {
  if (!TRACKS[key]) return;
  if (currentKey === key && currentSource) return;
  const myToken = ++playToken;
  currentKey = key;
  stopCurrentSource();
  await ensureRunning();
  if (myToken !== playToken) return;
  let buf;
  try {
    buf = await getBuffer(key);
  } catch {
    return;
  }
  if (myToken !== playToken) return;
  if (currentKey !== key) return;
  if (!buf) return;
  stopCurrentSource();
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
