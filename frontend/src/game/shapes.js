// 敵の見た目を生成するヘルパー。
// 本体 + ネオン装飾 (外側グロウ + 内側羊皮紙コア) を 1 つの Container に
// まとめて返す。Container を動かす / 回すだけで中身全部が一緒に動くので、
// 個別に位置 / 回転を同期する必要がない (ズレも生まれない)。
//
// 物理 body は Container 自身に貼る (Container.body)。
// body のサイズは setSize(size, size) + setCircle(r) で円判定。

import Phaser from "phaser";

const STROKE_COLOR = 0x0a0612;
const STROKE_WIDTH = 2.5;
const PARCHMENT_COLOR = 0xe8d9b8;

// 中心対称 (-h..h) の points で Polygon を作る (rotation 中心 = 図形中心)。
function makePolygon(scene, points, color, withStroke) {
  const obj = scene.add.polygon(0, 0, points, color);
  if (withStroke) obj.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, 1);
  // Polygon は points の bbox から自動 width/height を計算するので
  // (-h..h) で渡せば中心が rotation pivot になる。
  return obj;
}

// shape 名 → 中心対称 points を返す関数。
const POINTS_FOR = {
  rect: (size) => {
    const h = size / 2;
    return [-h, -h, h, -h, h, h, -h, h];
  },
  triangle: (size) => {
    const h = size / 2;
    return [h, 0, -h, -h * 0.7, -h, h * 0.7];
  },
  triangle_wide: (size) => {
    const h = size / 2;
    return [h, 0, -h * 0.8, -h, -h * 0.8, h];
  },
  hexagon: (size) => {
    const r = size / 2;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    return pts;
  },
  pentagon: (size) => {
    const r = size / 2;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    return pts;
  },
  octagon: (size) => {
    const r = size / 2;
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    return pts;
  },
  star: (size) => {
    const outer = size / 2;
    const inner = outer * 0.45;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    return pts;
  },
  diamond: (size) => {
    const h = size / 2;
    return [0, -h, h, 0, 0, h, -h, 0];
  },
};

// 円形は Polygon ではなく Phaser Arc (circle) を使う。
function makeCircleBody(scene, size, color, withStroke) {
  const c = scene.add.circle(0, 0, size / 2, color);
  if (withStroke) c.setStrokeStyle(STROKE_WIDTH, STROKE_COLOR, 1);
  return c;
}

function makeShapeAt(scene, size, color, shape, withStroke) {
  if (shape === "circle") return makeCircleBody(scene, size, color, withStroke);
  const fn = POINTS_FOR[shape] || POINTS_FOR.rect;
  return makePolygon(scene, fn(size), color, withStroke);
}

// 敵 / 自機の見た目: glow + body + core を Container にまとめて返す。
// Container.x / Container.y / Container.rotation を動かすと中身全部が追従する。
//
// 互換のため Container に以下のプロパティを露出:
//   .bodyShape  本体オブジェクト (fillColor 参照などに使う)
//   .glow       外側グロウ
//   .core       内側コア
//   .size       元のサイズ
//   .shape      shape 名
//   .fillColor  bodyShape.fillColor の薄いプロキシ (effects 側互換)
export function makeEnemyShape(scene, x, y, size, color, shape = "rect") {
  const glow = makeShapeAt(scene, size * 1.3, color, shape, false);
  glow.setAlpha(0.35);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  const body = makeShapeAt(scene, size, color, shape, true);

  const core = makeShapeAt(scene, size * 0.45, PARCHMENT_COLOR, shape, false);
  core.setAlpha(0.7);

  const container = scene.add.container(x, y, [glow, body, core]);
  container.setSize(size, size);
  container.bodyShape = body;
  container.glow = glow;
  container.core = core;
  container.size = size;
  container.shape = shape;
  // 既存コードが enemy.fillColor を参照している箇所がある (effects.js 等)
  // -> プロキシで body の色を返す。
  Object.defineProperty(container, "fillColor", {
    get() { return body.fillColor; },
    set(v) { body.fillColor = v; if (glow) glow.fillColor = v; },
  });
  return container;
}

// makeNeonDecor は Container 化に伴い不要 (本体 1 つに集約された)。
// 互換のため空の no-op を返す。
export function makeNeonDecor() {
  return { glow: null, core: null };
}

export const BODY_RADIUS_RATIO = 0.45;

// Container に円判定 body を貼る。
// Container は setSize(size, size) 済みで、ローカル原点が中心 (子は (-h..h) で配置)
// なので、body box は中心 (0, 0) の周りに対称に伸びる必要がある。
// Phaser arcade body の setCircle(radius, offX, offY) の offX/offY は body box の
// 左上を起点に円を置く位置。Container の body box は左上が (-size/2, -size/2)
// なので、円の中心を box 中央に置くには offset = size/2 - r と同じ。
export function setCircleBody(gameObject, size) {
  if (!gameObject.body) return;
  const r = size * BODY_RADIUS_RATIO;
  // arcade body は GameObject.x/y を中心とする。Container は中心原点なので
  // offset (0,0) で box の左上が (x - size/2, y - size/2) になる。
  // box の中心に r 半径の円を置くには offset = size/2 - r。
  const offset = size / 2 - r;
  gameObject.body.setCircle(r, offset, offset);
}
