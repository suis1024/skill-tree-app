# Skill Tree Shooter — Design Handoff

このフォルダは **Claude Code (ローカル)** に渡して、デザインを実コードに反映させるためのものです。

## あなた (ローカル Claude Code) への依頼

下記の 4 つの変更を、ユーザーのフロントエンド (Phaser + React) コードベースに反映してください。

### 採用デザイン (確定済み)

| 画面 | 採用案 | ソース参照 (`source/` 内) |
|---|---|---|
| **Title** | C · アーケード (Press Start) | `title-v2.jsx` の `TitleArcade` |
| **Skill Tree** | B · 縦長ピクセル枝分かれ | `screens.jsx` の `SkillTreeB` + `TreeNode` + `CategoryChip` |
| **Gameplay 改修** | C · ネオングロウ + 羊皮紙コア + CRT | `gameplay.jsx` の `GameplayC` (見た目の参考用 — Phaser 側に手で再現) |
| **App Icon** | C · 抽象ノードグラフ | `AppIcon-1024.png` (1024×1024、書き出し済み) |

### 共有パレット (どの画面でも使う)

```js
const PAL = {
  ink:       '#0a0612', // near-black bg
  ink2:      '#1a0f24',
  bone:      '#e8d9b8', // parchment / bone (内側ハイライト)
  bone2:     '#c4b08a',
  blood:     '#c63838', // weapon / hp red
  bloodDark: '#7a1a1a',
  spark:     '#5cb8e8', // thunder / cool accent
  sparkDark: '#2a6f9a',
  moss:      '#8fb068', // economy green
  mossDark:  '#4a6a3a',
  gold:      '#f0c44a',
  goldDark:  '#a87a1c',
  shadow:    '#3a2a4a',
  rune:      '#a06ad4',
};
```

### フォント (全画面共通)

`public/index.html` の `<head>` に追加:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DotGothic16&display=swap" rel="stylesheet" />
```

CSS 変数:
- `--font-px: "Press Start 2P", "DotGothic16", monospace;` — 英数字の見出し / HUD
- `--font-jp: "DotGothic16", "Press Start 2P", monospace;` — 日本語

---

## 作業手順

### 1. ソースの理解

`source/` ディレクトリの `Skill Tree Shooter.html` を開けば、上で参照したすべてのコンポーネントが design_canvas に並んだプロトタイプとして動きます。実装中はこれを正解画像として参照してください。

ファイル構成:
- `source/title-v2.jsx` — Title v2 全 3 案 (採用は `TitleArcade`)
- `source/screens.jsx` — Skill Tree A/B (採用は `SkillTreeB`) + 旧 Title (無視)
- `source/gameplay.jsx` — Gameplay モック A/B/C (採用は `GameplayC` — **見た目の参考のみ**、実装は Phaser 側)
- `source/pixel-art.jsx` — `HeroSprite`, `Coin`, `NodeIcon`, `CrossedWeapons`, `Bug`, `Sparkle`, `PAL` (パレット)
- `source/app-icon.jsx` — Icon C
- `source/design-canvas.jsx` / `source/ios-frame.jsx` — プロトタイプの枠 (実装には不要)

### 2. React 画面の移植 (Title C, Skill Tree B)

`frontend/src/` 配下にコンポーネントを切り出して配置してください。推奨配置:

```
frontend/src/
  pixel/
    PixelArt.jsx         ← pixel-art.jsx から PAL + 必要なコンポーネントを抽出
                            (HeroSprite, NodeIcon, Coin, CrossedWeapons)
  screens/
    TitleScreen.jsx      ← title-v2.jsx の TitleArcade を移植
    SkillTreeScreen.jsx  ← screens.jsx の SkillTreeB + TreeNode + CategoryChip を移植
```

#### 移植時のルール

- 元コードは `window.HeroSprite` のようなグローバルを使っているが、**ES Module 化**してください (`export function HeroSprite() {...}` / `import { HeroSprite } from '../pixel/PixelArt';`)
- インラインスタイル (`style={{...}}`) は**そのまま残してOK** — 直接編集容易性のため
- フォント変数 `T_PX` / `T_JP` / `JP_FONT` / `PX_FONT` は CSS 変数にしてもいいし、定数のままでも可
- 既存の React Router / 状態管理に画面遷移を組み込む。Title の START ボタン → ステージ選択 / Skill Tree、Skill Tree の `▶ STAGE SELECT` → ゲームへ

#### Title C (TitleArcade) で使う依存

- 内部で `LogoNeon`, `SubtitleScroll`, `NeonButton`, `BrickFloor`, `CRTScanlines`, `CRTVignette`, `CornerRune` を使う → 同じ `title-v2.jsx` 内にあるのでまとめて移植
- 外部依存はなし (Hero スプライトは未使用)

#### Skill Tree B で使う依存

- `pixel-art.jsx` の `Coin`, `NodeIcon`, `PAL` を使う
- `screens.jsx` 内の `TreeNode`, `CategoryChip` をまとめて移植

### 3. Gameplay 改修 (Phaser 側)

**重要: ロジック・物理判定・武器/敵テーブルには一切触らないでください。** 見た目だけ。`source/gameplay.jsx` の `GameplayC` を最終的な見た目の正解として参照してください。

触るファイルは 3 つだけ:

#### `frontend/src/game/shapes.js`

```js
// 既存の STROKE_COLOR をパレット ink に。stroke を少し太く。
const STROKE_COLOR = 0x0a0612;
const STROKE_WIDTH = 2.5;
```

`makeEnemyShape` (またはその下層 `polygonAt` / `makeCircle`) で、本体を描く前後に「外側グロウ」と「内側羊皮紙コア」を追加します。これらは別の Phaser GameObject として作って、本体と一緒に Container にまとめるのが安全。

```js
// 新規ヘルパー
function addNeonDecor(scene, container, x, y, size, color, shape) {
  // 外側グロウ: 同形状を 1.3 倍, alpha 0.35, blendMode ADD
  const glow = SHAPE_FACTORIES[shape](scene, x, y, size * 1.3, color);
  glow.setStrokeStyle(0);
  glow.setAlpha(0.35);
  glow.setBlendMode(Phaser.BlendModes.ADD);
  glow.setDepth(-1); // 本体より下
  container.add(glow);
  // 内側コア: 同形状を 0.45 倍, 羊皮紙色 (#e8d9b8 = 0xe8d9b8), alpha 0.7
  const core = SHAPE_FACTORIES[shape](scene, x, y, size * 0.45, 0xe8d9b8);
  core.setStrokeStyle(0);
  core.setAlpha(0.7);
  container.add(core);
}
```

`makeEnemyShape` を呼んでいる箇所 (`MainScene.js` で `setCircleBody` の前後) で、glow と core も一緒に追従させる。最も簡単なのは「敵 1 体 = Container にまとめる」リファクタですが、リスクを避けるなら **glow と core を別グループに入れて、敵の `update` で位置同期** でも OK。

#### `frontend/src/game/MainScene.js` `create()`

```js
// 背景色を変更
this.cameras.main.setBackgroundColor("#1a0820");

// レンガパターンの tileSprite (depth 最背面)
// 1. preload で 'brick-tile' を生成 (graphics → texture)
// 2. create で
this.brickFloor = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, 'brick-tile')
  .setOrigin(0, 0).setDepth(-1000).setAlpha(0.4);

// CRT スキャンラインオーバーレイ (depth 最前面)
// 同様に scanline テクスチャを作って tileSprite で全画面に
this.scanlines = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, 'scanline-tile')
  .setOrigin(0, 0).setDepth(9000).setAlpha(0.18).setScrollFactor(0)
  .setBlendMode(Phaser.BlendModes.MULTIPLY);
```

`brick-tile` / `scanline-tile` テクスチャは `preload()` で `Phaser.Textures.Manager.generate` か `Graphics.generateTexture` で動的生成してください。

#### `frontend/src/game/MainScene.js` `createHud()`

`source/gameplay.jsx` の `GpHudC` をそのまま Phaser テキスト/Graphics に翻訳してください。要点:

- すべての text に `fontFamily: '"Press Start 2P", monospace'` を指定
- HP は heart `♥` テキスト + ネオン枠の細バー (`#c63838` + glow は `setBlendMode(ADD)` の半透明 rect で代用)
- コインは右上、丸 + 光彩、`{coin}` 数値
- ステージ/タイマーは中央上、`◆ {time} ◆` フォーマット、ゴールド + シャドウ
- プレイヤーの直下 HP バーは細く (高さ 4px)、ネオン色
- 左下 `WAVE 7 / 12` (DotGothic16, スレートグレー)
- 右下 `✦ COMBO x12` (Press Start 2P, ルーン紫 `#a06ad4` + glow)

色付き光彩は `Graphics.fillStyle(color, 0.5).fillRect(...).setBlendMode(ADD)` の組み合わせで擬似的に出せます。

### 4. アプリアイコンの差し替え

`AppIcon-1024.png` (このフォルダ内) を iOS のアセットカタログに登録してください。Capacitor / Cordova / React Native / native の各フレームワークで手順が違うので、ユーザーのプロジェクト構成を確認してから配置してください。

iOS なら `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 配下に配置 + `Contents.json` を更新するのが一般的です。Xcode の「App Icon Generator」を使ってサイズ展開してもよい。

### 5. 動作確認

- `yarn dev` (or `npm start`) で起動
- Title → START → Skill Tree → STAGE → ゲームプレイ の遷移が壊れていないこと
- Phaser のゲーム自体 (敵 spawn / 武器 / ボス / コイン) は**見た目以外何も変わっていない**こと
- フォント `Press Start 2P` / `DotGothic16` がロードされていること (DevTools → Network)

### チェックリスト

- [ ] Google Fonts を `index.html` に追加
- [ ] `frontend/src/pixel/PixelArt.jsx` に `PAL` + 必要コンポーネントを ESM 化して配置
- [ ] `frontend/src/screens/TitleScreen.jsx` を作成、ルーティング接続
- [ ] `frontend/src/screens/SkillTreeScreen.jsx` を作成、ルーティング接続
- [ ] `frontend/src/game/shapes.js` のストローク色変更 + neon decor ヘルパー追加
- [ ] `frontend/src/game/MainScene.js` の背景にレンガ + スキャンライン
- [ ] `frontend/src/game/MainScene.js` の HUD を ピクセルネオン HUD に置換
- [ ] `AppIcon-1024.png` を iOS アセットに登録
- [ ] ゲームプレイのロジックが変わっていないことを動作確認

### 補足: 実装上の注意

1. **Phaser の Graphics で動的にテクスチャ生成する例 (preload):**
   ```js
   const g = this.make.graphics({ x: 0, y: 0, add: false });
   g.fillStyle(0x3a2a4a, 1);
   // 48x20 の brick pattern (1 unit)
   g.fillRect(0, 0, 48, 1); g.fillRect(0, 10, 48, 1);
   g.fillRect(24, 0, 1, 10); g.fillRect(0, 10, 1, 10); g.fillRect(48, 10, 1, 10);
   g.fillRect(12, 10, 1, 10); g.fillRect(36, 10, 1, 10);
   g.generateTexture('brick-tile', 48, 20);
   g.destroy();
   ```

2. **画面遷移 (既存コード調査が必要):** 既存のページルーティングが React Router か独自ステートか確認してから組み込んでください。Phaser の `MainScene` を起動する箇所 (`new Phaser.Game(...)` か `this.scene.start('MainScene')`) は変えない。

3. **レスポンシブ:** Title / Skill Tree は `iPhone 390×844` で設計されています。画面幅に合わせて `viewport meta` + `100vw/100vh` でフィットさせてください。Phaser 側は元々 `scale.on('resize', ...)` を持っているのでそのまま。

4. **Tweaks / 動的編集が必要なら:** インラインスタイルのままにすることで、後から CSS/直接編集で色や spacing の微調整がしやすくなっています。

---

困ったら `Skill Tree Shooter.html` をブラウザで開いて、design_canvas 上で各画面の挙動を確認してください。
