# Skill Tree Shooter

全方位シューティング × ローグライト の Web / iOS ゲーム。
死亡 → コイン持ち帰り → スキルツリーで永続強化 → 再挑戦、のループで遊ぶ。

進捗 (コイン・スキルレベル) はブラウザ / 端末ローカルに保存。サーバー不要。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| ゲーム | Phaser 3 |
| フロント | React + Vite |
| ストレージ | localStorage |
| iOS ラッパー | Capacitor |
| デプロイ (Web) | GitHub Pages (GitHub Actions) |

---

## ローカル起動 (Web)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/skill-tree-app/
```

---

## iOS シミュレータで起動

事前に Xcode + iOS シミュレータが必要 (App Store から Xcode をインストール後、`xcodebuild -downloadPlatform iOS`)。

```bash
cd frontend
VITE_BASE=./ npm run build   # iOS 用 base path でビルド
npx cap sync ios             # web 成果物を iOS プロジェクトに反映
npx cap open ios             # Xcode 起動 → ▶ で実行
```

ビルド + sync を 1 行で (Xcode はすでに開いている前提でコード変更だけ反映したいとき):

```bash
cd ~/claude_work/skill-tree-app/frontend && VITE_BASE=./ npm run build && npx cap sync ios
```

`vite.config.js` の base path は `VITE_BASE` 環境変数で上書きできる:
- Web (GitHub Pages): デフォルトの `/skill-tree-app/`
- iOS (Capacitor): `./` (ファイル相対)

---

## Web デプロイ

`main` への push で GitHub Actions が自動的に GitHub Pages にデプロイする
(`.github/workflows/deploy-frontend.yml`)。

公開 URL: `https://<user>.github.io/skill-tree-app/`

---

## ディレクトリ構成

```
skill-tree-app/
├── .github/workflows/
│   └── deploy-frontend.yml      # Pages デプロイ用 GitHub Actions
└── frontend/                    # React + Vite + Phaser 3
    ├── src/
    │   ├── App.jsx              # シーン遷移管理
    │   ├── PhaserGame.jsx       # Phaser → React マウント
    │   ├── SkillTreeScreen.jsx  # スキルツリーUI
    │   ├── api.js               # localStorage ベースの進捗保存
    │   └── game/
    │       ├── MainScene.js     # ゲーム本体
    │       └── skills.js        # スキル定義
    ├── ios/                     # Capacitor が生成した iOS プロジェクト
    ├── capacitor.config.json
    └── vite.config.js
```
