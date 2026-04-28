# Skill Tree Shooter

全方位シューティング × ローグライト の Web ゲーム。
死亡 → コイン持ち帰り → スキルツリーで永続強化 → 再挑戦、のループで遊ぶ。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| ゲーム | Phaser 3 |
| フロント | React + Vite |
| バックエンド | Python + FastAPI (uv) |
| DB | Neon (PostgreSQL) / ローカルは Docker Compose |
| デプロイ (フロント) | GitHub Pages (GitHub Actions) |
| デプロイ (バックエンド) | Render (Free) |

---

## ローカル起動

### バックエンド

[uv](https://docs.astral.sh/uv/) を使用します。未インストールの場合:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

```bash
cd backend
docker compose up -d              # ローカル Postgres 起動
uv sync                           # 依存インストール
cp .env.example .env              # デフォルトでローカルDBに繋がる
uv run uvicorn main:app --reload  # → http://localhost:8000
```

DB を停止: `docker compose down` / データごと消す: `docker compose down -v`

### フロントエンド

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/skill-tree-app/
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/health` | ヘルスチェック |
| GET | `/users/{userId}/progress` | コイン残高 + スキルレベル取得 |
| POST | `/users/{userId}/coins/add` | コイン加算（ラン終了時） |
| POST | `/users/{userId}/skills/upgrade` | スキル強化（コイン消費） |

---

## デプロイ手順

### 全体の流れ
1. **Neon** で DB を作る → 接続文字列を取得
2. **GitHub** にリポジトリを作って push
3. **Render** にバックエンドをデプロイ → API の URL を取得
4. **GitHub Pages** 設定 + Variables で `VITE_API_URL` を登録 → 自動デプロイ
5. **Render の CORS** に Pages の URL を追加

---

### Step 1: Neon (DB)

1. https://neon.tech にサインアップ
2. プロジェクトを新規作成（リージョンは Asia Pacific 推奨）
3. ダッシュボードの「Connection string」から接続文字列をコピー
   ```
   postgresql://user:password@xxx.neon.tech/neondb?sslmode=require
   ```
4. `backend/.env.production` に保存（git 除外済み）

---

### Step 2: GitHub リポジトリ作成 + push

プロジェクトルートで:

```bash
git init
git add .
git commit -m "initial commit"

# gh コマンドを使う場合
gh repo create skill-tree-app --public --source=. --remote=origin --push

# Web UI で作る場合
# git remote add origin git@github.com:<user>/skill-tree-app.git
# git branch -M main
# git push -u origin main
```

---

### Step 3: Render (バックエンド)

1. https://render.com にサインアップ（GitHub アカウントでログイン）
2. ダッシュボード右上 **New** → **Web Service**
3. 上で push した GitHub リポジトリを選択
4. 設定:
   - **Name**: `skill-tree-backend`（任意、URLの一部になる）
   - **Region**: Singapore（DBに近い）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Plan**: **Free**
5. **Environment Variables** で追加:
   - `DATABASE_URL` = Step 1 でコピーした Neon の接続文字列
6. **Create Web Service** をクリック
7. ビルド開始（数分かかる）。完了すると `https://skill-tree-backend-xxxx.onrender.com` の URL が出る
8. ブラウザで `https://<your-app>.onrender.com/health` → `{"status":"ok"}` を確認
9. **この URL をメモ**

> ⚠️ Render Free は 15 分アクセスがないと sleep する。
> 復帰時に 30〜60 秒待たされる。本番運用するなら有料プラン（$7/月）を検討。

---

### Step 4: GitHub Pages 設定

1. GitHub のリポジトリ画面 → **Settings → Pages**
2. **Source** を `GitHub Actions` に設定
3. **Settings → Secrets and variables → Actions → Variables** タブ
4. **New repository variable** で以下を追加:
   - Name: `VITE_API_URL`
   - Value: `https://<your-app>.onrender.com` (Step 3 でメモした URL)
5. **Settings → Actions → General → Workflow permissions** で
   `Read and write permissions` にチェック
6. **Actions タブ → Deploy frontend → Run workflow** で手動実行
   （Variables 登録後に走らせる必要がある）

デプロイ完了後、`https://<user>.github.io/skill-tree-app/` でアクセスできる。

---

### Step 5: Render の CORS を制限（推奨）

Pages の URL が確定したら、Render ダッシュボードで:

1. 該当サービス → **Environment** タブ
2. 環境変数を追加:
   - `CORS_ORIGINS` = `https://<user>.github.io`
3. **Save** で自動再デプロイ

未設定でも動くが、設定しておくと外部からの API 叩きが防げる。

---

## ディレクトリ構成

```
skill-tree-app/
├── .github/workflows/
│   └── deploy-frontend.yml      # Pages デプロイ用 GitHub Actions
├── frontend/                    # React + Vite + Phaser 3
│   ├── src/
│   │   ├── App.jsx              # シーン遷移管理
│   │   ├── PhaserGame.jsx       # Phaser → React マウント
│   │   ├── SkillTreeScreen.jsx  # スキルツリーUI
│   │   ├── api.js               # API クライアント
│   │   └── game/
│   │       ├── MainScene.js     # ゲーム本体
│   │       └── skills.js        # スキル定義
│   └── vite.config.js
├── backend/                     # FastAPI
│   ├── main.py                  # API
│   ├── database.py              # DB 接続・初期化
│   ├── pyproject.toml           # uv で管理
│   ├── docker-compose.yml       # ローカル Postgres
│   ├── Dockerfile
│   └── fly.toml
└── README.md
```

---

## トラブルシューティング

- **Pages デプロイで 404**: Pages の Source が `GitHub Actions` になっているか確認
- **API 接続エラー**: ブラウザの Network タブで `VITE_API_URL` が反映されているか確認。値を変えたら **Actions タブ → Run workflow** で再デプロイ
- **Render デプロイで失敗**: Render ダッシュボード → Logs で確認。`DATABASE_URL` が Environment に設定されているか確認
- **初回アクセスが遅い**: Render Free は 15 分 sleep する。復帰に 30〜60 秒かかる
- **Neon で sleep**: 無料プランは数分アクセスがないと sleep する
