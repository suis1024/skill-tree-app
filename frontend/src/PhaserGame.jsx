import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GAME_CONFIG } from "./game/MainScene";

export default function PhaserGame({ skillLevels, onRunEnded }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onRunEndedRef = useRef(onRunEnded);

  useEffect(() => {
    onRunEndedRef.current = onRunEnded;
  }, [onRunEnded]);

  useEffect(() => {
    const game = new Phaser.Game({ ...GAME_CONFIG, parent: containerRef.current });
    game.registry.set("skillLevels", skillLevels || {});
    game.events.on("run-ended", (data) => onRunEndedRef.current?.(data));
    gameRef.current = game;
    return () => game.destroy(true);
  }, [skillLevels]);

  return <div ref={containerRef} style={{ display: "flex", justifyContent: "center" }} />;
}
