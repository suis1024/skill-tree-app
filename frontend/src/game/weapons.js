// 武器定義テーブル。各武器は MainScene が呼ぶ fire(scene, opts) を持つ。
// fire は「scene の現在状態」を読んで、弾やエフェクトを生成する責務。
//
// scene からは以下を期待:
//   scene.player (Phaser.GameObject), scene.aimDir (Vector2),
//   scene.bullets (Group), scene.enemies (Group),
//   scene.stats (computeStats の結果) を持つこと。

import Phaser from "phaser";
import { spawnExplosion } from "./effects";
import { AUDIO_KEYS, playSe } from "./audio";

const BULLET_LIFETIME_MS = 2000;
const BOMB_LIFETIME_MS = 3000;

function findNearestEnemy(scene, fromX, fromY) {
  let best = null;
  let bestDist = Infinity;
  scene.enemies.children.iterate((e) => {
    if (!e || !e.active) return;
    const d = Phaser.Math.Distance.Squared(fromX, fromY, e.x, e.y);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  });
  return best;
}

// ピストル: 移動方向に扇撃ち。bulletCount スキル (atk_multi) で扇が広がる。
function firePistol(scene) {
  playSe(scene, AUDIO_KEYS.sePistol.key, { volume: 0.18, minIntervalMs: 80 });
  const stats = scene.stats;
  const count = stats.bulletCount;
  const spread = (count - 1) * 0.18;
  const baseAngle = Math.atan2(scene.aimDir.y, scene.aimDir.x);
  const start = baseAngle - spread / 2;
  const baseDamage = 10 * stats.damageMul;
  const speed = 500;
  for (let i = 0; i < count; i++) {
    const angle = count === 1 ? baseAngle : start + (spread * i) / (count - 1);
    const isCrit = Math.random() < stats.critChance;
    const damage = baseDamage * (isCrit ? 2 : 1);
    const color = isCrit ? 0xfb923c : 0xfacc15;
    const size = isCrit ? 10 : 8;
    const bullet = scene.add.rectangle(scene.player.x, scene.player.y, size, size, color);
    scene.bullets.add(bullet);
    bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.damage = damage;
    bullet.isCrit = isCrit;
    bullet.pierceLeft = stats.pierce;
    scene.time.delayedCall(BULLET_LIFETIME_MS, () => bullet.destroy());
  }
}

// 爆弾: 一番近い敵の位置に放物線アニメで飛んで着弾、範囲爆発。
function fireBomb(scene) {
  const stats = scene.stats;
  const target = findNearestEnemy(scene, scene.player.x, scene.player.y);
  if (!target) return;
  // 射程外なら撃たない
  const distToTarget = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, target.x, target.y);
  if (distToTarget > (stats.bombRange ?? Infinity)) return;
  const tx = target.x;
  const ty = target.y;
  const startX = scene.player.x;
  const startY = scene.player.y;
  const radius = 90 * (stats.bombRadiusMul ?? 1);
  const damage = 30 * stats.damageMul * (stats.bombDamageMul ?? 1);
  const flightMs = 600;
  const peakOffset = -60;

  const bomb = scene.add.circle(startX, startY, 6, 0x44403c).setStrokeStyle(2, 0xfacc15);
  bomb.setDepth(50);

  // 放物線: y は中点で peakOffset 分浮く (見た目だけの演出)
  scene.tweens.add({
    targets: bomb,
    x: tx,
    y: ty,
    duration: flightMs,
    onUpdate: (tween, t) => {
      const p = tween.progress;
      const arc = Math.sin(p * Math.PI) * peakOffset;
      t.y = startY + (ty - startY) * p + arc;
    },
    onComplete: () => {
      spawnExplosion(scene, tx, ty, radius);
      playSe(scene, AUDIO_KEYS.seExplosion.key, { volume: 0.45, minIntervalMs: 100 });
      bomb.destroy();
      scene.enemies.children.iterate((e) => {
        if (!e || !e.active) return;
        const d = Phaser.Math.Distance.Between(tx, ty, e.x, e.y);
        if (d <= radius) scene.damageEnemy(e, damage);
      });
    },
  });
  scene.time.delayedCall(BOMB_LIFETIME_MS, () => { if (bomb.active) bomb.destroy(); });
}

// サンダー: 一番近い敵に落雷、その後 chainCount まで近隣に連鎖。
function fireThunder(scene) {
  const stats = scene.stats;
  const first = findNearestEnemy(scene, scene.player.x, scene.player.y);
  if (!first) return;
  const distToFirst = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, first.x, first.y);
  if (distToFirst > (stats.thunderRange ?? Infinity)) return;
  playSe(scene, AUDIO_KEYS.seThunder.key, { volume: 0.4, minIntervalMs: 150 });
  const damage = 20 * stats.damageMul * (stats.thunderDamageMul ?? 1);
  const chainCount = 3 + (stats.thunderChainAdd ?? 0);
  const chainRadius = 160;

  const hit = new Set();
  let prev = scene.player;
  let current = first;
  for (let i = 0; i <= chainCount; i++) {
    if (!current || hit.has(current)) break;
    hit.add(current);
    drawLightning(scene, prev.x, prev.y, current.x, current.y);
    scene.damageEnemy(current, damage);
    prev = current;
    // 次のターゲット = 近隣でまだヒットしてない敵
    let next = null;
    let bestDist = chainRadius * chainRadius;
    scene.enemies.children.iterate((e) => {
      if (!e || !e.active || hit.has(e)) return;
      const d = Phaser.Math.Distance.Squared(prev.x, prev.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        next = e;
      }
    });
    current = next;
  }
}

function drawLightning(scene, x1, y1, x2, y2) {
  // ジグザグの折れ点を一度生成して、太い→細い→白芯の 3 重ストロークで重ね描き。
  const segments = 8;
  const points = [{ x: x1, y: y1 }];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const lx = x1 + (x2 - x1) * t + Phaser.Math.Between(-16, 16);
    const ly = y1 + (y2 - y1) * t + Phaser.Math.Between(-16, 16);
    points.push({ x: lx, y: ly });
  }
  points.push({ x: x2, y: y2 });

  const drawPath = (g, width, color, alpha) => {
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();
  };

  const glow = scene.add.graphics().setDepth(70);
  drawPath(glow, 10, 0x3b82f6, 0.35);
  const mid = scene.add.graphics().setDepth(71);
  drawPath(mid, 5, 0x60a5fa, 0.85);
  const core = scene.add.graphics().setDepth(72);
  drawPath(core, 2, 0xffffff, 1);

  // 着弾点に小さなスパーク
  const spark = scene.add.circle(x2, y2, 12, 0xbfdbfe, 0.9).setDepth(73);
  scene.tweens.add({
    targets: spark,
    scale: { from: 0.6, to: 1.6 },
    alpha: { from: 0.9, to: 0 },
    duration: 220,
    onComplete: () => spark.destroy(),
  });

  scene.tweens.add({
    targets: [glow, mid, core],
    alpha: { from: 1, to: 0 },
    duration: 260,
    onComplete: () => {
      glow.destroy();
      mid.destroy();
      core.destroy();
    },
  });
}

// ホーミング: 一番近い敵を追尾する弾を 1 + homingCountAdd 発放つ。
function fireHoming(scene) {
  const stats = scene.stats;
  // 射程内に敵がいなければ何もしない (タイマーは消費される)
  const nearest = findNearestEnemy(scene, scene.player.x, scene.player.y);
  if (!nearest) return;
  const distNearest = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, nearest.x, nearest.y);
  if (distNearest > (stats.homingRange ?? Infinity)) return;
  const damage = 10 * stats.damageMul * (stats.homingDamageMul ?? 1);
  const speed = 280;
  const count = 1 + (stats.homingCountAdd ?? 0);
  if (count > 0) playSe(scene, AUDIO_KEYS.seHoming.key, { volume: 0.3, minIntervalMs: 150 });
  for (let i = 0; i < count; i++) {
    const target = findNearestEnemy(scene, scene.player.x, scene.player.y);
    if (!target) break;
    // ばらけて初速の方向を変える
    const initAng = (Math.PI * 2 * i) / Math.max(1, count) + Math.random() * 0.3;
    const bullet = scene.add.circle(scene.player.x, scene.player.y, 6, 0xa78bfa);
    scene.bullets.add(bullet);
    bullet.body.setCircle(bullet.radius);
    bullet.body.setVelocity(Math.cos(initAng) * speed, Math.sin(initAng) * speed);
    bullet.damage = damage;
    bullet.pierceLeft = 0;
    bullet.homing = { target, speed };
    scene.time.delayedCall(3500, () => { if (bullet.active) bullet.destroy(); });
  }
}

// オービタル: 周囲を回る弾を一定数生成 (初回のみ)、以降は維持。
// fire 関数は「初期化」役。実際の周回は scene.update で位置更新。
function ensureOrbital(scene) {
  const stats = scene.stats;
  const expectedCount = 2 + (stats.orbitalCountAdd ?? 0);
  const damage = 10 * stats.damageMul * (stats.orbitalDamageMul ?? 1);
  if (scene.orbitalGroup && scene.orbitalGroup.length === expectedCount) return;
  // 数が変わったら作り直し (実戦中はスキル変動しないので初回のみここに来る)
  if (scene.orbitalGroup) scene.orbitalGroup.forEach((o) => o.destroy());
  scene.orbitalGroup = [];
  for (let i = 0; i < expectedCount; i++) {
    const o = scene.add.circle(scene.player.x, scene.player.y, 5, 0x22d3ee);
    scene.bullets.add(o);
    o.body.setCircle(o.radius);
    o.damage = damage;
    o.pierceLeft = Infinity;
    o.isOrbital = true;
    o.orbitAngle = (Math.PI * 2 * i) / expectedCount;
    scene.orbitalGroup.push(o);
  }
}

export const WEAPONS = {
  pistol:  { id: "pistol",  name: "ピストル",   fireIntervalMs: 350, fire: firePistol },
  bomb:    { id: "bomb",    name: "爆弾",       fireIntervalMs: 1400, fire: fireBomb },
  thunder: { id: "thunder", name: "サンダー",   fireIntervalMs: 1100, fire: fireThunder },
  homing:  { id: "homing",  name: "ホーミング", fireIntervalMs: 700, fire: fireHoming },
  orbital: { id: "orbital", name: "オービタル", fireIntervalMs: 250, fire: ensureOrbital }, // fire は ensure 用 (短間隔で呼んでも no-op)
};

// 周回弾の位置更新 (毎フレーム呼ぶ)。プレイヤー座標から radius=50 で回る。
export function updateOrbitals(scene, dtMs) {
  if (!scene.orbitalGroup || scene.orbitalGroup.length === 0) return;
  const radius = 110;
  const angularSpeed = 0.005; // rad/ms
  for (const o of scene.orbitalGroup) {
    if (!o.active) continue;
    o.orbitAngle += angularSpeed * dtMs;
    o.x = scene.player.x + Math.cos(o.orbitAngle) * radius;
    o.y = scene.player.y + Math.sin(o.orbitAngle) * radius;
    if (o.body) o.body.reset(o.x, o.y);
  }
}

// ホーミング弾の追尾更新 (毎フレーム呼ぶ)。
// 現在速度から「ターゲット方向へ少しずつ旋回」する形にして、
// ターゲット切り替え時の急なカクつきを抑える。
const HOMING_TURN_RATE = 0.12; // ラジアン/フレーム (~7度)

export function updateHomingBullets(scene) {
  scene.bullets.children.iterate((b) => {
    if (!b || !b.active || !b.homing) return;
    let t = b.homing.target;
    if (!t || !t.active) {
      const next = findNearestEnemy(scene, b.x, b.y);
      if (!next) return; // 敵がいなければ現在の進行方向を維持
      b.homing.target = next;
      t = next;
    }
    const desiredAng = Math.atan2(t.y - b.y, t.x - b.x);
    const vx = b.body.velocity.x;
    const vy = b.body.velocity.y;
    const currentAng = Math.atan2(vy, vx);
    // 現在角→目標角の差を [-π, π] に正規化
    let diff = desiredAng - currentAng;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turn = Math.max(-HOMING_TURN_RATE, Math.min(HOMING_TURN_RATE, diff));
    const newAng = currentAng + turn;
    b.body.setVelocity(Math.cos(newAng) * b.homing.speed, Math.sin(newAng) * b.homing.speed);
  });
}
