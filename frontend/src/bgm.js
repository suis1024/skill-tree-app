// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// 実装方針 (iOS WebView 対策):
// - HTMLAudioElement + MediaElementAudioSourceNode は使わない
//   (iOS で復帰時に sample rate ドリフトして音階が高くなる既知バグ)
// - 起動時に MP3 を fetch → decodeAudioData で AudioBuffer 化 (1 度だけ)
// - 再生時は AudioBufferSourceNode を毎回生成 (loop=true、破棄時は stop)
// - GainNode 1 個で音量制御
//
// バックグラウンド復帰時の対策:
// - AudioContext.state が "interrupted" のまま固まるバグがあるので、
//   visible 時に state を見て、interrupted/suspended なら ctx を完全に閉じて
//   作り直す。AudioBuffer 自体はファイルとして再 decode する必要があるので
//   キャッシュを使い回し、新 ctx で再 decode する (iOS は ctx ごとに buffer
//   を持つ必要があるため)
//
// 制約:
// - 復帰時に短い decode 待ち (数百 ms 程度)

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
const arrayBuffers = new Map(); // key -> ArrayBuffer (生 MP3 データ、ctx を超えて使い回せる)
const fetching = new Map(); // key -> Promise<ArrayBuffer>
let decodedFor = null; // どの ctx に対して buffers をデコードしたか
const buffers = new Map(); // key -> AudioBuffer (decodedFor 専用)

function createCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = new AC();
    return c;
  } catch {
    return null;
  }
}

function ensureCtx() {
  if (ctx) return ctx;
  ctx = createCtx();
  if (ctx) {
    gainNode = ctx.createGain();
    gainNode.gain.value = enabled ? volume : 0;
    gainNode.connect(ctx.destination);
    decodedFor = ctx;
    buffers.clear();
  }
  return ctx;
}

// ctx が壊れている (interrupted) 場合に閉じて作り直す。
async function rebuildCtx() {
  if (ctx) {
    try { await ctx.close(); } catch {}
  }
  ctx = null;
  gainNode = null;
  decodedFor = null;
  buffers.clear();
  return ensureCtx();
}

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
  const c = ensureCtx();
  if (!c) return null;
  // ctx が変わっていたら buffers を破棄
  if (decodedFor !== c) {
    buffers.clear();
    decodedFor = c;
  }
  if (buffers.has(key)) return buffers.get(key);
  const arr = await fetchArrayBuffer(key);
  if (!arr) return null;
  // decodeAudioData は ArrayBuffer を中で消費 (detach) するブラウザがあるので copy
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
  if (!ctx || !gainNode) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(gainNode);
  try { src.start(0); } catch {}
  return src;
}

function applyVolume() {
  if (gainNode) gainNode.gain.value = enabled ? volume : 0;
}

// ctx を再生可能な状態に戻す。interrupted で固まってたら作り直し。
async function ensureCtxRunning() {
  ensureCtx();
  if (!ctx) return false;
  // iOS の interrupted は resume が効かないので close + 再生成
  if (ctx.state === "interrupted") {
    await rebuildCtx();
  } else if (ctx.state === "suspended" || ctx.state === "closed") {
    if (ctx.state === "closed") {
      await rebuildCtx();
    } else {
      try { await ctx.resume(); } catch {}
      // resume しても running にならなかったら作り直し
      if (ctx.state !== "running") {
        await rebuildCtx();
      }
    }
  }
  return ctx && ctx.state === "running";
}

// 並行実行された playTrack 同士の競合を防ぐため、最後に発行された要求のみを有効に
// する。各 playTrack 開始時に token を発行し、await ごとに「自分の token が最新か」
// 確認して無効ならその時点で抜ける。
let playToken = 0;

// 復帰時に「BGM 再開を試みた key」を覚えておく。UI が isBgmStuck() で問い合わせて
// 復帰ボタンを出すため。
let lastResumeAttemptAt = 0;
let lastResumeKey = null;

export function isBgmStuck() {
  // 復帰試行から 2 秒以上経って、まだ source が起き上がっていない場合は stuck 扱い
  if (!lastResumeKey) return false;
  if (currentSource) return false;
  return Date.now() - lastResumeAttemptAt > 2000;
}

export function forceResumeBgm() {
  if (!lastResumeKey) return;
  const k = lastResumeKey;
  currentKey = null;
  playTrack(k);
  lastResumeAttemptAt = Date.now();
}

let resumeKey = null;
function tryResume(k, attempt = 0) {
  currentKey = null;
  playTrack(k);
  lastResumeAttemptAt = Date.now();
  lastResumeKey = k;
  // iOS WebKit の interrupted state を踏むと resume が確率的に失敗する
  // (https://bugs.webkit.org/show_bug.cgi?id=263627)。
  // 100 / 500 / 1500ms で複数回リトライする。
  const delays = [100, 500, 1500];
  if (attempt < delays.length) {
    setTimeout(() => {
      if (currentKey === k && !currentSource) tryResume(k, attempt + 1);
    }, delays[attempt]);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      resumeKey = currentKey;
      stopCurrentSource();
    } else if (document.visibilityState === "visible") {
      if (!resumeKey) return;
      const k = resumeKey;
      resumeKey = null;
      tryResume(k);
    }
  });
}

export async function playTrack(key) {
  if (!TRACKS[key]) return;
  if (currentKey === key && currentSource) return;
  const myToken = ++playToken;
  currentKey = key;
  stopCurrentSource();
  await ensureCtxRunning();
  if (myToken !== playToken) return; // 別の playTrack が走った
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
