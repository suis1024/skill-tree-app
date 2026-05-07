// 敵の見た目を生成するヘルパー。
// 各形状は size × size の bounding box に収まる Polygon を返す。
//
// 重要: Phaser Polygon は **points の (0, 0)** を回転中心として扱う。
// なので「中心で回転」させるには points を中心対称 (-h..h) で渡す必要がある。
// (centered() で 0..size にシフトすると、回転中心が左上にずれて、サイズの違う
//  glow/core が rotation で軌道ズレを起こす — これがハマりどころ。)
//
// 物理 body は GameObject の width/height を見るので、setSize(size, size) を
// 明示して、setDisplayOrigin を size の中央に置く。

import Phaser from "phaser";

const STROKE_COLOR = 0x0a0612;
const STROKE_WIDTH = 2.5;

// 中心対称 (-h..h) の points を、(0,0) 中心の Polygon として作る。
// width/height = size を明示し、displayOrigin を中央に固定。
function polygonCentered(scene, x, y, size, points, color) {
  const obj = scene.add.polygon(x, y, points, color);
  obj.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, 1);
  obj.setSize(size, size);
  // points が (-h..h) なので、Phaser 内部で displayOrigin を size/2 にシフト
  // しないと描画位置がズレる。明示的に中央に固定する。
  obj.setDisplayOrigin(size / 2, size / 2);
  return obj;
}

function makeRect(scene, x, y, size, color) {
  const h = size / 2;
  return polygonCentered(scene, x, y, size, [-h, -h, h, -h, h, h, -h, h], color);
}

function makeTriangle(scene, x, y, size, color) {
  const h = size / 2;
  // 右向き矢じり (rotation 0 = +x)
  return polygonCentered(scene, x, y, size, [h, 0, -h, -h * 0.7, -h, h * 0.7], color);
}

function makeTriangleWide(scene, x, y, size, color) {
  const h = size / 2;
  return polygonCentered(scene, x, y, size, [h, 0, -h * 0.8, -h, -h * 0.8, h], color);
}

function makeHexagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonCentered(scene, x, y, size, pts, color);
}

function makePentagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonCentered(scene, x, y, size, pts, color);
}

function makeOctagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonCentered(scene, x, y, size, pts, color);
}

function makeStar(scene, x, y, size, color) {
  const outer = size / 2;
  const inner = outer * 0.45;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonCentered(scene, x, y, size, pts, color);
}

function makeDiamond(scene, x, y, size, color) {
  const h = size / 2;
  return polygonCentered(scene, x, y, size, [0, -h, h, 0, 0, h, -h, 0], color);
}

function makeCircle(scene, x, y, size, color) {
  const obj = scene.add.circle(x, y, size / 2, color);
  obj.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, 1);
  return obj;
}

const SHAPE_FACTORIES = {
  rect: makeRect,
  triangle: makeTriangle,
  triangle_wide: makeTriangleWide,
  hexagon: makeHexagon,
  pentagon: makePentagon,
  octagon: makeOctagon,
  star: makeStar,
  diamond: makeDiamond,
  circle: makeCircle,
};

export function makeEnemyShape(scene, x, y, size, color, shape = "rect") {
  const factory = SHAPE_FACTORIES[shape] || makeRect;
  return factory(scene, x, y, size, color);
}

const PARCHMENT_COLOR = 0xe8d9b8;
export function makeNeonDecor(scene, x, y, size, color, shape = "rect") {
  const factory = SHAPE_FACTORIES[shape] || makeRect;
  const glow = factory(scene, x, y, size * 1.3, color);
  glow.setStrokeStyle(0, 0, 0);
  glow.setAlpha(0.35);
  glow.setBlendMode(Phaser.BlendModes.ADD);
  glow.setDepth(-1);
  const core = factory(scene, x, y, size * 0.45, PARCHMENT_COLOR);
  core.setStrokeStyle(0, 0, 0);
  core.setAlpha(0.7);
  return { glow, core };
}

export const BODY_RADIUS_RATIO = 0.45;

// box の中心に円判定を置く。
// circle (Arc) は origin 0.5 がデフォルト → offset 0,0 で中心。
// polygon は setDisplayOrigin(size/2) しているので、body box は (0..size) と揃う。
// → 中央に r 半径の円を置くため offset = size/2 - r。
export function setCircleBody(gameObject, size) {
  if (!gameObject.body) return;
  const r = size * BODY_RADIUS_RATIO;
  const isArc = typeof gameObject.radius === "number";
  const offset = isArc ? 0 : size / 2 - r;
  gameObject.body.setCircle(r, offset, offset);
}
