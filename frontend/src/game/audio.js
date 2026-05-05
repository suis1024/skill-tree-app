// Phaser シーン用の SE 再生ヘルパー。BGM は React 側 (bgm.js) で管理する。

// 音源カタログ。パスは public/audio/ 配下を想定。
export const AUDIO_KEYS = {
  sePistol: { key: "se_pistol", url: "audio/se/shoot_pistol.mp3" },
  seExplosion: { key: "se_explosion", url: "audio/se/explosion.mp3" },
  sePlayerHit: { key: "se_player_hit", url: "audio/se/player_hit.mp3" },
  seThunder: { key: "se_thunder", url: "audio/se/thunder.mp3" },
  seHoming: { key: "se_homing", url: "audio/se/shoot_homing.mp3" },
  seBossAppear: { key: "se_boss_appear", url: "audio/se/boss_appear.mp3" },
  seStageClear: { key: "se_stage_clear", url: "audio/se/stage_clear.mp3" },
};

// 連発抑制用クールダウン (キーごと)。
const lastPlayedAt = {};

export function preloadAllAudio(scene) {
  for (const v of Object.values(AUDIO_KEYS)) {
    if (!scene.cache.audio.exists(v.key)) {
      scene.load.audio(v.key, v.url);
    }
  }
}

// SE 再生。settings の seEnabled が false なら no-op。
// minIntervalMs 指定で連射時の音割れ/うるさすぎ対策。
// volume は呼び出し側のベース倍率に、settings.seVolume (0..1) が掛かる。
export function playSe(scene, key, opts = {}) {
  const s = scene.audio?.settings;
  if (!s || s.seEnabled === false) return;
  const minInterval = opts.minIntervalMs ?? 0;
  const now = Date.now();
  if (minInterval > 0) {
    if ((now - (lastPlayedAt[key] || 0)) < minInterval) return;
    lastPlayedAt[key] = now;
  }
  const baseVol = opts.volume ?? 0.5;
  const userVol = s.seVolume ?? 1;
  try {
    scene.sound.play(key, { volume: baseVol * userVol });
  } catch {
    // 再生失敗は無視 (未ロード等)
  }
}
