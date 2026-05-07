import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { makeGameConfig } from "./game/MainScene";
import { readSettings, writeSettings } from "./settings";
import { setBgmEnabled, setBgmVolume } from "./bgm";
import { PauseIcon, BossIcon, PlayIcon } from "./icons";
import { PAL, PX_FONT, JP_FONT } from "./pixel/PixelArt";

export default function PhaserGame({ skillLevels, stageNumber = 1, onRunEnded, onAbort }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onRunEndedRef = useRef(onRunEnded);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(() => readSettings());

  // 設定変更時: 永続化 → BGM 反映 → ゲーム中の Phaser registry にも即時反映
  // (SE 側は scene.audio.settings が同じ参照なので mutate でも届くが、
  //  分かりやすさ重視で都度 set し直す)
  const updateSettings = (next) => {
    setSettings(next);
    writeSettings(next);
    setBgmEnabled(next.bgmEnabled);
    setBgmVolume(next.bgmVolume);
    const scene = gameRef.current?.scene?.getScene("MainScene");
    if (scene) {
      gameRef.current.registry.set("settings", next);
      if (scene.audio) scene.audio.settings = next;
      scene.settings = next;
    }
  };

  useEffect(() => {
    onRunEndedRef.current = onRunEnded;
  }, [onRunEnded]);

  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;height:env(safe-area-inset-top);width:0;";
    document.body.appendChild(probe);
    const safeTop = probe.getBoundingClientRect().height || 0;
    document.body.removeChild(probe);

    const game = new Phaser.Game(makeGameConfig(containerRef.current));
    game.registry.set("skillLevels", skillLevels || {});
    game.registry.set("stageNumber", stageNumber);
    game.registry.set("safeAreaTop", Math.max(12, safeTop + 8));
    game.registry.set("settings", readSettings());
    game.events.on("run-ended", (data) => onRunEndedRef.current?.(data));
    gameRef.current = game;
    return () => game.destroy(true);
  }, [skillLevels, stageNumber]);

  const handlePause = () => {
    const scene = gameRef.current?.scene?.getScene("MainScene");
    if (scene) scene.scene.pause();
    setPaused(true);
  };

  const handleResume = () => {
    const scene = gameRef.current?.scene?.getScene("MainScene");
    if (scene) scene.scene.resume();
    setPaused(false);
  };

  const handleAbort = () => {
    setPaused(false);
    onAbort?.();
  };

  // 開発者用: ボス即出し
  const handleSummonBoss = () => {
    const scene = gameRef.current?.scene?.getScene("MainScene");
    if (!scene) return;
    scene.scene.resume();
    setPaused(false);
    if (scene.phase === "wave" && typeof scene.startBossPhase === "function") {
      scene.startBossPhase();
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "#0f172a",
        }}
      />
      {!paused && (
        <button
          type="button"
          onClick={handlePause}
          aria-label="メニュー"
          style={pauseBtnStyle}
        >
          <PauseIcon width={22} height={22} />
        </button>
      )}
      {paused && (
        <div style={overlayStyle}>
          <div style={menuStyle}>
            <h2 style={menuTitle}>◆ PAUSED ◆</h2>
            <button style={primaryBtn} onClick={handleResume}>
              <PlayIcon width={14} height={14} />
              <span>RESUME</span>
            </button>
            <button style={secondaryBtn} onClick={handleAbort}>ABORT</button>

            <div style={settingsBlock}>
              <h3 style={settingsTitle}>◆ SOUND ◆</h3>
              <SettingRow
                label="BGM"
                checked={settings.bgmEnabled}
                onToggle={(v) => updateSettings({ ...settings, bgmEnabled: v })}
                value={settings.bgmVolume}
                onValue={(v) => updateSettings({ ...settings, bgmVolume: v })}
              />
              <SettingRow
                label="SE"
                checked={settings.seEnabled}
                onToggle={(v) => updateSettings({ ...settings, seEnabled: v })}
                value={settings.seVolume}
                onValue={(v) => updateSettings({ ...settings, seVolume: v })}
              />
            </div>

            <p style={menuNote}>
              ABORT すると今回稼いだコインは破棄されます。
            </p>

            <div style={settingsBlock}>
              <h3 style={settingsTitle}>◆ DEV ◆</h3>
              <button style={cheatBtn} onClick={handleSummonBoss}>
                <BossIcon width={14} height={14} />
                <span>SUMMON BOSS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const pauseBtnStyle = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top) + 8px)",
  right: "calc(env(safe-area-inset-right) + 12px)",
  width: 40,
  height: 40,
  background: PAL.ink2,
  border: "none",
  color: PAL.bone,
  zIndex: 100,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `2px 2px 0 ${PAL.ink}, 0 0 0 2px ${PAL.gold}`,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(10, 6, 18, 0.85)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  paddingTop: "calc(env(safe-area-inset-top) + 16px)",
  paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
};

const menuStyle = {
  background: PAL.ink2,
  padding: "20px 22px",
  minWidth: 280,
  maxWidth: 380,
  textAlign: "center",
  color: PAL.bone,
  fontFamily: JP_FONT,
  boxShadow: `4px 4px 0 #050309, 0 0 0 2px ${PAL.gold}`,
  maxHeight: "100%",
  overflowY: "auto",
};

const menuTitle = {
  margin: "0 0 16px",
  fontFamily: PX_FONT,
  fontSize: 14, letterSpacing: 4,
  color: PAL.gold,
  textShadow: "0 0 12px rgba(240,196,74,0.6)",
};

const menuNote = {
  fontSize: 11, color: PAL.bone2, marginTop: 12, marginBottom: 0,
};

const primaryBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%",
  background: PAL.blood, color: PAL.bone, border: "none",
  padding: "12px",
  fontFamily: PX_FONT, fontSize: 12, letterSpacing: 2,
  cursor: "pointer",
  marginBottom: 8,
  boxShadow: `3px 3px 0 ${PAL.bloodDark}, 0 0 0 2px ${PAL.ink}`,
};

const secondaryBtn = {
  display: "block", width: "100%",
  background: PAL.shadow, color: PAL.bone, border: "none",
  padding: "10px",
  fontFamily: PX_FONT, fontSize: 11, letterSpacing: 2,
  cursor: "pointer",
  boxShadow: `3px 3px 0 ${PAL.ink}, 0 0 0 2px ${PAL.ink}`,
};

const cheatBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%",
  background: "#3730a3", color: "#e0e7ff", border: "none",
  padding: "10px",
  fontFamily: PX_FONT, fontSize: 11, letterSpacing: 2,
  cursor: "pointer",
  marginTop: 4,
  boxShadow: `3px 3px 0 #1e1b4b, 0 0 0 2px ${PAL.ink}`,
};

const settingsBlock = {
  marginTop: 18,
  paddingTop: 12,
  borderTop: `1px solid ${PAL.shadow}`,
  textAlign: "left",
};

const settingsTitle = {
  margin: "0 0 8px",
  fontFamily: PX_FONT, fontSize: 9, letterSpacing: 2,
  color: PAL.gold,
};

function SettingRow({ label, checked, onToggle, value, onValue }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 6, minWidth: 64,
        fontFamily: PX_FONT, fontSize: 10, color: PAL.bone, letterSpacing: 1,
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ accentColor: PAL.gold }}
        />
        {label}
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={!checked}
        onChange={(e) => onValue(Number(e.target.value) / 100)}
        style={{ flex: 1, accentColor: PAL.gold, opacity: checked ? 1 : 0.4 }}
      />
      <span style={{
        width: 28, textAlign: "right",
        fontFamily: PX_FONT, fontSize: 9, color: PAL.bone2,
      }}>{pct}</span>
    </div>
  );
}
