import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel

from database import init_db, get_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Skill Tree Shooter API", lifespan=lifespan)

# CORS_ORIGINS が未設定なら全許可（ローカル開発用）。
# 本番では "https://<user>.github.io" のようにカンマ区切りで指定する。
_origins_env = os.environ.get("CORS_ORIGINS", "").strip()
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/users/{user_id}/progress")
def get_progress(user_id: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT coins FROM user_progress WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            coins = row["coins"] if row else 0

            cur.execute(
                "SELECT skill_id, level FROM user_skill_levels WHERE user_id = %s",
                (user_id,),
            )
            levels = {r["skill_id"]: r["level"] for r in cur.fetchall()}

    return {"user_id": user_id, "coins": coins, "skill_levels": levels}


class AddCoinsBody(BaseModel):
    coins: int


@app.post("/users/{user_id}/coins/add")
def add_coins(user_id: str, body: AddCoinsBody):
    if body.coins < 0:
        raise HTTPException(status_code=400, detail="coins must be >= 0")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO user_progress (user_id, coins, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE
                  SET coins = user_progress.coins + EXCLUDED.coins,
                      updated_at = NOW()
                RETURNING coins
                """,
                (user_id, body.coins),
            )
            coins = cur.fetchone()["coins"]
        conn.commit()
    return {"user_id": user_id, "coins": coins}


class UpgradeBody(BaseModel):
    skill_id: str
    cost: int


@app.post("/users/{user_id}/skills/upgrade")
def upgrade_skill(user_id: str, body: UpgradeBody):
    if body.cost < 0:
        raise HTTPException(status_code=400, detail="cost must be >= 0")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT coins FROM user_progress WHERE user_id = %s FOR UPDATE",
                (user_id,),
            )
            row = cur.fetchone()
            current_coins = row["coins"] if row else 0
            if current_coins < body.cost:
                raise HTTPException(status_code=400, detail="not enough coins")

            cur.execute(
                """
                UPDATE user_progress
                   SET coins = coins - %s, updated_at = NOW()
                 WHERE user_id = %s
                """,
                (body.cost, user_id),
            )

            cur.execute(
                """
                INSERT INTO user_skill_levels (user_id, skill_id, level)
                VALUES (%s, %s, 1)
                ON CONFLICT (user_id, skill_id) DO UPDATE
                  SET level = user_skill_levels.level + 1
                RETURNING level
                """,
                (user_id, body.skill_id),
            )
            new_level = cur.fetchone()["level"]

            cur.execute(
                "SELECT coins FROM user_progress WHERE user_id = %s",
                (user_id,),
            )
            coins = cur.fetchone()["coins"]
        conn.commit()

    return {"user_id": user_id, "coins": coins, "skill_id": body.skill_id, "level": new_level}
