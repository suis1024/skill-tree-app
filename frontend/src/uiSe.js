// React 画面用の SE 再生。Phaser 内 SE は game/audio.js が担当。
//
// 配置先: frontend/public/audio/se/ui_click.mp3, ui_upgrade.mp3
// settings の seEnabled=false なら no-op。volume は seVolume (0..1) を反映。
//
// 実装: Web Audio API、bgm.js と同じ AudioContext を共有 (audioContext.js)。
//   理由: HTMLAudioElement (new Audio()) は iOS で AudioContext (BGM 用) と
//   オーディオセッションを取り合い、SE 再生のたびに BGM が止まる事象が起きる
//   (iPhone SE2 等で再現)。ctx を統一すれば 1 つのセッションで競合しない。

import { readSettings } from "./settings";
import { getCtx, onRebuild } from "./audioContext";

const TRACKS = {
  click:   { url: "audio/se/ui_click.mp3", volume: 1.0 },
  upgrade: { url: "audio/se/ui_upgrade.mp3", volume: 0.7 },
};

const arrayBuffers = new Map(); // key -> ArrayBuffer (ctx を超えて使い回せる)
const fetching = new Map();
let decodedFor = null;
const buffers = new Map(); // key -> AudioBuffer (decodedFor 専用)

onRebuild(() => {
  buffers.clear();
  decodedFor = null;
});

async function fetchArrayBuffer(key) {
  if (arrayBuffers.has(key)) return arrayBuffers.get(key);
  if (fetching.has(key)) return fetching.get(key);
  const def = TRACKS[key];
  if (!def) return null;
  const p = (async () => {
    const res = await fetch(def.url);
    const arr = await res.arrayBuffer();
    arrayBuffers.set(key, arr);
    fetching.delete(key);
    return arr;
  })();
  fetching.set(key, p);
  return p;
}

async function loadBuffer(key) {
  const c = getCtx();
  if (!c) return null;
  if (decodedFor !== c) {
    buffers.clear();
    decodedFor = c;
  }
  if (buffers.has(key)) return buffers.get(key);
  const arr = await fetchArrayBuffer(key);
  if (!arr) return null;
  const buf = await new Promise((resolve, reject) => {
    try {
      const pr = c.decodeAudioData(arr.slice(0), resolve, reject);
      if (pr && typeof pr.then === "function") pr.then(resolve, reject);
    } catch (e) { reject(e); }
  });
  buffers.set(key, buf);
  return buf;
}

export function playUiSe(key) {
  try {
    const s = readSettings();
    if (s.seEnabled === false) return;
    const def = TRACKS[key];
    if (!def) return;
    const c = getCtx();
    if (!c) return;
    // suspended なら resume を試みる (タップ起点なので通常成功する)
    if (c.state === "suspended") { try { c.resume(); } catch {} }
    loadBuffer(key).then((buf) => {
      const cur = getCtx();
      if (!buf || !cur) return;
      const src = cur.createBufferSource();
      const gain = cur.createGain();
      gain.gain.value = Math.max(0, Math.min(1, def.volume * (s.seVolume ?? 1)));
      src.buffer = buf;
      src.connect(gain).connect(cur.destination);
      try { src.start(0); } catch {}
    }).catch(() => {});
  } catch {
    // 設定取得失敗等は無視
  }
}
