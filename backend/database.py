import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_progress (
                    user_id TEXT PRIMARY KEY,
                    coins INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_skill_levels (
                    user_id TEXT NOT NULL,
                    skill_id TEXT NOT NULL,
                    level INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (user_id, skill_id)
                )
            """)
        conn.commit()
