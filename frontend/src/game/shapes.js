// 敵の見た目を生成するヘルパー。
// 各形状は size × size の bounding box に収まる Polygon を返す。
//
// Phaser Polygon の挙動:
//   - 渡した points の min(x), min(y) を (0, 0) として正規化される
//   - ローカル原点 (0, 0) は bounding box の左上
//   - rotation はローカル原点を中心に回る
// なので「中心で回転」「中心に座標を置く」ためには
//   - points は (0..size, 0..size) で渡す
//   - setOrigin(0.5, 0.5) で displayOrigin を box 中心に
//   - すると rotation も box 中心基準になる
//
// 物理 body は setCircleBody で size * BODY_RATIO の円に揃える。

import Phaser from "phaser";

const STROKE_COLOR = 0x0a0612;
const STROKE_WIDTH = 2.5;

// points: (0..size, 0..size) 範囲で渡すこと。
function polygonAt(scene, x, y, size, points, color) {
  const obj = scene.add.polygon(x, y, points, color);
  obj.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, 1);
  // Phaser Polygon は内部で points を再正規化したり bbox を勝手に縮めたりするので、
  // 明示的に size×size を指定して displayOrigin を中心 (size/2, size/2) に固定。
  obj.setSize(size, size);
  obj.setDisplayOrigin(size / 2, size / 2);
  return obj;
}

// 中心 (0,0) ベースの点を size/2 だけシフトして box 内に収める
function centered(points, size) {
  const half = size / 2;
  const shifted = [];
  for (let i = 0; i < points.length; i++) {
    shifted.push(points[i] + half);
  }
  return shifted;
}

function makeRect(scene, x, y, size, color) {
  const h = size / 2;
  const pts = centered([-h, -h, h, -h, h, h, -h, h], size);
  return polygonAt(scene, x, y, size, pts, color);
}

function makeTriangle(scene, x, y, size, color) {
  const h = size / 2;
  // 右向き矢じり (rotation 0 = +x)
  const pts = centered([h, 0, -h, -h * 0.7, -h, h * 0.7], size);
  return polygonAt(scene, x, y, size, pts, color);
}

function makeTriangleWide(scene, x, y, size, color) {
  const h = size / 2;
  const pts = centered([h, 0, -h * 0.8, -h, -h * 0.8, h], size);
  return polygonAt(scene, x, y, size, pts, color);
}

function makeHexagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonAt(scene, x, y, size, centered(pts, size), color);
}

function makePentagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonAt(scene, x, y, size, centered(pts, size), color);
}

function makeOctagon(scene, x, y, size, color) {
  const r = size / 2;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 - Math.PI / 8; // 上を平らに
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return polygonAt(scene, x, y, size, centered(pts, size), color);
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
  return polygonAt(scene, x, y, size, centered(pts, size), color);
}

function makeDiamond(scene, x, y, size, color) {
  const h = size / 2;
  const pts = centered([0, -h, h, 0, 0, h, -h, 0], size);
  return polygonAt(scene, x, y, size, pts, color);
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

// 本体を装飾するネオン要素 (外側グロウ + 内側羊皮紙コア) を生成して返す。
// 呼び出し側で本体オブジェクトの位置 / 回転に追従させること。
//
// 重要: glow / core を本体と同じ scene.add.polygon で作ると、
// Phaser の bbox 自動再正規化のせいでサイズによって中心がズレることがある。
// 確実に中心一致させるため、Container を作って本体含めて中に入れる方式が一番硬い
// が、敵側の物理 body が body.setCircle 直接で完結している都合があるので、
// ここでは「本体の transform を毎フレ追従する」素朴な方式を維持しつつ、
// glow/core は本体と「全く同じ centered() 座標系で作る」ことだけ保証する。
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

// box (width=size, height=size) の中心に円判定を置く。
// circle (Arc) は origin 0.5 がデフォルトなので offset 0,0 でちょうど中央。
// polygon は origin 0.5 + box (0..size) なので、body 自体は左上基準。
// setCircle(r, offX, offY) の offX/offY は body box の左上を起点に円を置く位置。
// box の中央に r 半径の円を置くため offset = size/2 - r。
export function setCircleBody(gameObject, size) {
  if (!gameObject.body) return;
  const r = size * BODY_RADIUS_RATIO;
  const isArc = typeof gameObject.radius === "number"; // circle (Arc) かどうか
  const offset = isArc ? 0 : size / 2 - r;
  gameObject.body.setCircle(r, offset, offset);
}
