import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { makeGameConfig } from "./game/MainScene";

export default function PhaserGame({ skillLevels, stageNumber = 1, onRunEnded }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onRunEndedRef = useRef(onRunEnded);

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
    game.events.on("run-ended", (data) => onRunEndedRef.current?.(data));
    gameRef.current = game;
    return () => game.destroy(true);
  }, [skillLevels, stageNumber]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f172a",
      }}
    />
  );
}
