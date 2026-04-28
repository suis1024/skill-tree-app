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
| デプロイ (バックエンド) | Fly.io |

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
2. **Fly.io** にバックエンドをデプロイ → API の URL を取得
3. **GitHub** にリポジトリを作って push
4. **GitHub Actions** が Pages にフロントを自動デプロイ
5. **Fly.io の CORS** に Pages の URL を追加

---

### Step 1: Neon (DB)

1. https://neon.tech にサインアップ
2. プロジェクトを新規作成（リージョンは Asia Pacific (Tokyo) 推奨）
3. ダッシュボードの「Connection string」から接続文字列をコピー
   ```
   postgresql://user:password@xxx.neon.tech/neondb?sslmode=require
   ```
   この文字列を **メモ**しておく（次のステップで使う）。

---

### Step 2: Fly.io (バックエンド)

```bash
# flyctl インストール（未インストールの場合）
brew install flyctl

# ログイン
fly auth login

cd backend

# アプリ作成（fly.toml の name を一意な名前に変更してから）
# 例: name = "skill-tree-backend-suis"
fly launch --no-deploy --copy-config --name skill-tree-backend-<unique>

# 環境変数設定（Step 1 でコピーした文字列）
fly secrets set DATABASE_URL="postgresql://user:password@xxx.neon.tech/neondb?sslmode=require"

# デプロイ
fly deploy
```

成功すると `https://skill-tree-backend-<unique>.fly.dev` の URL が出る。
ブラウザで `https://<your-app>.fly.dev/health` を開いて `{"status":"ok"}` が返れば OK。
**この URL もメモ**しておく。

---

### Step 3: GitHub リポジトリ作成 + push

プロジェクトルートで:

```bash
cd /Users/suis/claude_work/skill-tree-app

# git 初期化
git init
git add .
git commit -m "initial commit"

# GitHub リポジトリ作成（gh コマンドを使う場合）
gh repo create skill-tree-app --public --source=. --remote=origin --push

# gh コマンドを使わない場合は GitHub の Web UI でリポジトリ作成し、
# git remote add origin git@github.com:<user>/skill-tree-app.git
# git branch -M main
# git push -u origin main
```

---

### Step 4: GitHub Pages 設定

1. GitHub のリポジトリ画面 → **Settings → Pages**
2. **Source** を `GitHub Actions` に設定
3. **Settings → Secrets and variables → Actions → Variables** タブ
4. **New repository variable** で以下を追加:
   - Name: `VITE_API_URL`
   - Value: `https://<your-app>.fly.dev` (Step 2 でメモした URL)
5. **Settings → Actions → General → Workflow permissions** で
   `Read and write permissions` にチェック
6. push すると `.github/workflows/deploy-frontend.yml` が走り、Pages にデプロイされる
   - 初回が走らない場合は **Actions タブ → Deploy frontend → Run workflow** で手動実行

デプロイ完了後、`https://<user>.github.io/skill-tree-app/` でアクセスできる。

---

### Step 5: Fly.io の CORS を制限（推奨）

Pages の URL が確定したら、バックエンドで CORS を制限:

```bash
cd backend
fly secrets set CORS_ORIGINS="https://<user>.github.io"
# 自動的に再デプロイされる
```

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
- **API 接続エラー**: ブラウザの Network タブで `VITE_API_URL` が反映されているか確認。値を変えたら再ビルド (push) が必要
- **Fly.io デプロイで失敗**: `fly logs` で確認。`DATABASE_URL` が設定されているか `fly secrets list` で確認
- **Neon で sleep**: 無料プランは数分アクセスがないと sleep する。初回アクセスが数秒遅い
