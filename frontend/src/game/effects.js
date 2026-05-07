// 視覚エフェクト集。MainScene / weapons から呼ばれる。
// 内部はすべて Phaser の Graphics / Shape + Tween で完結。アセット不要。

import Phaser from "phaser";

// 敵撃破: 色付きの破片を放射状に飛ばす。
export function spawnDeathBurst(scene, x, y, color = 0xffffff, scale = 1) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = (24 + Math.random() * 24) * scale;
    const size = 3 + Math.random() * 2;
    const piece = scene.add.rectangle(x, y, size, size, color).setDepth(1800);
    scene.tweens.add({
      targets: piece,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.4 },
      duration: 360 + Math.random() * 120,
      ease: "Cubic.easeOut",
      onComplete: () => piece.destroy(),
    });
  }
  // 中央フラッシュ
  const flash = scene.add.circle(x, y, 14 * scale, 0xffffff, 0.8).setDepth(1799);
  scene.tweens.add({
    targets: flash,
    alpha: { from: 0.8, to: 0 },
    scale: { from: 0.6, to: 1.4 },
    duration: 180,
    onComplete: () => flash.destroy(),
  });
}

// 爆発リング: 爆弾着弾用。半径まで広がるリングを 2 重で出す。
export function spawnExplosion(scene, x, y, radius) {
  const ring = scene.add.circle(x, y, radius, 0xfca5a5, 0).setStrokeStyle(4, 0xfb923c, 0.9).setDepth(65);
  scene.tweens.add({
    targets: ring,
    scale: { from: 0.2, to: 1.1 },
    alpha: { from: 1, to: 0 },
    duration: 400,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy(),
  });
  const inner = scene.add.circle(x, y, radius * 0.6, 0xfde68a, 0.7).setDepth(64);
  scene.tweens.add({
    targets: inner,
    scale: { from: 0.3, to: 1.0 },
    alpha: { from: 0.7, to: 0 },
    duration: 280,
    ease: "Cubic.easeOut",
    onComplete: () => inner.destroy(),
  });
  // 火の粉
  const sparks = 10;
  for (let i = 0; i < sparks; i++) {
    const ang = (Math.PI * 2 * i) / sparks + Math.random() * 0.3;
    const dist = radius * (0.5 + Math.random() * 0.5);
    const s = scene.add.circle(x, y, 3, 0xfde047).setDepth(66);
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist,
      alpha: { from: 1, to: 0 },
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => s.destroy(),
    });
  }
  if (scene.shake) scene.shake(120, 0.006); else scene.cameras.main.shake(120, 0.006);
}

// コイン拾得ポップ。プレイヤー上に小さく "+N" を浮かす。
export function popCoinText(scene, x, y, amount) {
  const txt = scene.add
    .text(x, y, `+${amount}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#fde047",
      stroke: "#1f2937",
      strokeThickness: 2,
      fontStyle: "bold",
    })
    .setOrigin(0.5, 1)
    .setDepth(1900)
    .setResolution(window.devicePixelRatio || 1);
  scene.tweens.add({
    targets: txt,
    y: y - 24,
    alpha: { from: 1, to: 0 },
    duration: 420,
    ease: "Cubic.easeOut",
    onComplete: () => txt.destroy(),
  });
}

// ダメージ数値ポップ。クリティカルは大きく・色違いで。
export function popDamageText(scene, x, y, dmg, isCrit = false) {
  const value = Math.max(1, Math.round(dmg));
  const fontSize = isCrit ? 22 : 14;
  const color = isCrit ? "#fb923c" : "#fef3c7";
  const stroke = isCrit ? "#7c2d12" : "#1f2937";
  const txt = scene.add
    .text(x + Phaser.Math.Between(-8, 8), y - 10, String(value), {
      fontFamily: "system-ui, sans-serif",
      fontSize: `${fontSize}px`,
      color,
      stroke,
      strokeThickness: 3,
      fontStyle: "bold",
    })
    .setOrigin(0.5, 1)
    .setDepth(1900)
    .setResolution(window.devicePixelRatio || 1);
  scene.tweens.add({
    targets: txt,
    y: y - 40,
    alpha: { from: 1, to: 0 },
    duration: isCrit ? 700 : 500,
    ease: "Cubic.easeOut",
    onComplete: () => txt.destroy(),
  });
  if (isCrit) {
    scene.tweens.add({
      targets: txt,
      scale: { from: 1.4, to: 1 },
      duration: 200,
      ease: "Back.easeOut",
    });
  }
}
