// Capacitor Haptics の薄いラッパー。
// - Web ブラウザでは no-op
// - Capacitor が無い環境でも壊れないように import を遅延
// - 設定で OFF にされていたら何もしない

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const isNative = Capacitor.isNativePlatform();

let enabled = true;
export function setHapticsEnabled(v) { enabled = !!v; }

// 軽い (コイン、雑魚撃破)。連発抑制のため最小間隔を設ける。
let lastLightAt = 0;
const LIGHT_MIN_INTERVAL_MS = 80;
export function hapticLight() {
  if (!enabled || !isNative) return;
  const now = Date.now();
  if (now - lastLightAt < LIGHT_MIN_INTERVAL_MS) return;
  lastLightAt = now;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

// 中 (被弾、爆発)
export function hapticMedium() {
  if (!enabled || !isNative) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

// 強 (ボス撃破、ステージクリア)
export function hapticHeavy() {
  if (!enabled || !isNative) return;
  Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
}

// 成功 (ステージクリア用に取っておくが、まだ未使用)
export function hapticSuccess() {
  if (!enabled || !isNative) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
