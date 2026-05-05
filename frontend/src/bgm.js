// アプリ全体で 1 本だけ流す BGM のコントローラ。
// 画面遷移しても再生が途切れない。React からは start/setVolume/setEnabled だけ呼ぶ。
//
// iOS WebView 対策:
// 1. <audio>.volume が iOS で効かないことがあるので、Web Audio API の GainNode で
//    音量制御する。再生は <audio> 要素経由なのでループ等の制御は楽。
// 2. BGM オフ時は pause() するとオーディオセッション全体に影響する場合があるので、
//    再生は続けたまま gain を 0 にする。

const STAGE_BGM_URL = "audio/bgm/stage.mp3";

let audioEl = null;
let ctx = null;
let gainNode = null;
let enabled = true;
let volume = 0.25;
let started = false;

function ensure() {
  if (audioEl) return;
  audioEl = new Audio(STAGE_BGM_URL);
  audioEl.loop = true;
  audioEl.crossOrigin = "anonymous";
  // iOS WebView は AudioContext がユーザー操作後にしか再開しないので、suspended のまま作る
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ctx = new AC();
      const src = ctx.createMediaElementSource(audioEl);
      gainNode = ctx.createGain();
      gainNode.gain.value = enabled ? volume : 0;
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
    } else {
      // Web Audio が無ければ素の volume を使う
      audioEl.volume = enabled ? volume : 0;
    }
  } catch {
    // AudioContext が貼れなくても <audio> 単体で再生は試みる
    audioEl.volume = enabled ? volume : 0;
  }
}

function applyVolume() {
  const v = enabled ? volume : 0;
  if (gainNode) {
    gainNode.gain.value = v;
  } else if (audioEl) {
    audioEl.volume = v;
  }
}

export function startBgm() {
  ensure();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (started && !audioEl.paused) return;
  started = true;
  audioEl.play().catch(() => {
    // ユーザー操作前だとここに来る。次のタップ時に再試行される想定。
  });
}

export function stopBgm() {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
  started = false;
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
