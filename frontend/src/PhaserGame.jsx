import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { makeGameConfig } from "./game/MainScene";
import { readSettings } from "./settings";

export default function PhaserGame({ skillLevels, stageNumber = 1, onRunEnded, onAbort }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onRunEndedRef = useRef(onRunEnded);
  const [paused, setPaused] = useState(false);

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
          ⏸
        </button>
      )}
      {paused && (
        <div style={overlayStyle}>
          <div style={menuStyle}>
            <h2 style={{ margin: "0 0 12px" }}>一時停止</h2>
            <button style={primaryBtn} onClick={handleResume}>▶ 再開</button>
            <button style={secondaryBtn} onClick={handleAbort}>放棄してスキルツリーへ</button>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              放棄すると今回稼いだコインは破棄されます。
            </p>
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
  width: 44,
  height: 44,
  borderRadius: 22,
  background: "rgba(15, 23, 42, 0.7)",
  border: "1px solid #475569",
  color: "#e2e8f0",
  fontSize: 20,
  zIndex: 100,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const menuStyle = {
  background: "#1e293b",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "20px 24px",
  minWidth: 260,
  maxWidth: 360,
  textAlign: "center",
  color: "#e2e8f0",
};

const primaryBtn = {
  display: "block",
  width: "100%",
  background: "#22c55e",
  color: "#0f172a",
  border: "none",
  padding: "12px",
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 8,
};

const secondaryBtn = {
  display: "block",
  width: "100%",
  background: "#334155",
  color: "#e2e8f0",
  border: "none",
  padding: "10px",
  fontSize: 14,
  borderRadius: 6,
  cursor: "pointer",
};
