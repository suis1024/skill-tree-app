import { useEffect, useState } from "react";
import PhaserGame from "./PhaserGame";
import SkillTreeScreen from "./SkillTreeScreen";
import { getUserId, fetchProgress, addCoins, upgradeSkill } from "./api";

const SCREEN = { LOADING: "loading", TREE: "tree", GAME: "game", RESULT: "result", ERROR: "error" };

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [error, setError] = useState(null);
  const [userId] = useState(() => getUserId());
  const [coins, setCoins] = useState(0);
  const [skillLevels, setSkillLevels] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProgress(userId)
      .then((data) => {
        if (cancelled) return;
        setCoins(data.coins);
        setSkillLevels(data.skill_levels || {});
        setScreen(SCREEN.TREE);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setScreen(SCREEN.ERROR);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const handleUpgrade = async (skillId, cost) => {
    setBusy(true);
    try {
      const data = await upgradeSkill(userId, skillId, cost);
      setCoins(data.coins);
      setSkillLevels((prev) => ({ ...prev, [skillId]: data.level }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () => {
    setLastResult(null);
    setScreen(SCREEN.GAME);
  };

  const handleRunEnded = async (data) => {
    setLastResult(data);
    setScreen(SCREEN.RESULT);
    if (data.coins > 0) {
      try {
        const res = await addCoins(userId, data.coins);
        setCoins(res.coins);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBackToTree = () => setScreen(SCREEN.TREE);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Skill Tree Shooter</h1>
        <span style={styles.userId}>ID: {userId}</span>
      </header>

      {screen === SCREEN.LOADING && <p style={styles.center}>読み込み中…</p>}

      {screen === SCREEN.ERROR && (
        <div style={styles.center}>
          <p>サーバーに接続できません: {error}</p>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>
            backend を起動してください: <code>cd backend && uv run uvicorn main:app --reload</code>
          </p>
        </div>
      )}

      {screen === SCREEN.TREE && (
        <SkillTreeScreen
          coins={coins}
          skillLevels={skillLevels}
          onUpgrade={handleUpgrade}
          onStart={handleStart}
          busy={busy}
        />
      )}

      {screen === SCREEN.GAME && (
        <div>
          <p style={{ textAlign: "center", color: "#94a3b8", margin: "0 0 12px" }}>
            WASD で移動 / 武器は自動発射
          </p>
          <PhaserGame skillLevels={skillLevels} onRunEnded={handleRunEnded} />
        </div>
      )}

      {screen === SCREEN.RESULT && lastResult && (
        <div style={styles.resultWrap}>
          <h2 style={{ color: "#f87171", margin: 0 }}>RUN ENDED</h2>
          <p style={styles.resultLine}>
            生存時間: <strong>{formatTime(lastResult.survivedSec)}</strong>
          </p>
          <p style={styles.resultLine}>
            獲得コイン: <strong style={{ color: "#fde047" }}>{lastResult.coins}</strong>
            {lastResult.retryBonus > 0 && (
              <span style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>
                (リトライボーナス +{lastResult.retryBonus})
              </span>
            )}
          </p>
          <p style={styles.resultLine}>所持コイン: <strong>{coins}</strong></p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
            <button style={styles.primaryBtn} onClick={handleBackToTree}>スキルツリーへ</button>
            <button style={styles.secondaryBtn} onClick={handleStart}>もう一度</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const styles = {
  app: { padding: 16 },
  header: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, padding: "0 8px" },
  title: { margin: 0, fontSize: 22 },
  userId: { fontSize: 12, color: "#64748b" },
  center: { textAlign: "center", color: "#cbd5e1" },
  resultWrap: {
    maxWidth: 480, margin: "40px auto", textAlign: "center",
    background: "#1e293b", padding: 24, borderRadius: 8, border: "1px solid #334155",
  },
  resultLine: { fontSize: 18, margin: "8px 0" },
  primaryBtn: {
    background: "#22c55e", color: "#0f172a", border: "none",
    padding: "10px 20px", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: "pointer",
  },
  secondaryBtn: {
    background: "#334155", color: "#e2e8f0", border: "none",
    padding: "10px 20px", borderRadius: 6, fontSize: 15, cursor: "pointer",
  },
};
