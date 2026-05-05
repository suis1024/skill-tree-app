// アプリ設定の永続化。今のところは画面シェイクの ON/OFF だけ。

const KEY = "skill-tree-shooter:settings";

const DEFAULTS = {
  screenShake: true,
  haptics: true,
};

export function readSettings() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { ...DEFAULTS };
  try {
    const obj = JSON.parse(raw);
    return { ...DEFAULTS, ...(obj && typeof obj === "object" ? obj : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
