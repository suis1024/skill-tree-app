// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは playTrack/setVolume/setEnabled だけ呼ぶ。
//
// Web Audio (AudioContext + MediaElementAudioSourceNode) を経由すると、
// iOS WebView でサンプルレート不一致による「BGM がやや高音化する」問題があったため
// シンプルに <audio>.volume だけで制御する方式に変更。
// 複数トラック対応: トラック URL ごとに <audio> 要素を生成・キャッシュ。

const TRACKS = {
  stage: "audio/bgm/stage.mp3",
  menu: "audio/bgm/menu.mp3",
};

let enabled = true;
let volume = 0.25;
let currentKey = null;
const audioByKey = new Map(); // key -> HTMLAudioElement

function ensureAudio(key) {
  if (audioByKey.has(key)) return audioByKey.get(key);
  const url = TRACKS[key];
  if (!url) return null;
  const el = new Audio(url);
  el.loop = true;
  el.preload = "auto";
  el.volume = enabled ? volume : 0;
  audioByKey.set(key, el);
  return el;
}

function applyVolume() {
  const v = enabled ? volume : 0;
  audioByKey.forEach((el) => { el.volume = v; });
}

// iOS WebView は アプリがバックグラウンドに入ると <audio> をサスペンドし、
// 復帰時に勝手に再開する (複数トラックが同時再開して二重再生)。
// hidden 時に全停止 → visible 時に currentKey だけ再生 を強制する。
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
      audioByKey.forEach((el) => {
        if (!el.paused) el.pause();
        el.currentTime = 0;
      });
      if (resumeKey) {
        const el = audioByKey.get(resumeKey);
        if (el) {
          el.currentTime = 0;
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
  stopAllExcept(key);
  if (currentKey === key) {
    const el = audioByKey.get(key);
    if (el && el.paused) {
      el.play().catch(() => {});
    }
    return;
  }
  currentKey = key;
  const el = ensureAudio(key);
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {
    // ユーザー操作前だとここに来る。次のタップ時に再試行される想定。
  });
  // 保険: 遅れて他トラックが再開する場合に備えて掃除
  setTimeout(() => stopAllExcept(currentKey), 50);
  setTimeout(() => stopAllExcept(currentKey), 300);
}

// 互換維持
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
}
