import { useEffect, useState } from "react";
import PhaserGame from "./PhaserGame";
import SkillTreeScreen from "./SkillTreeScreen";
import StageSelectScreen from "./StageSelectScreen";
import TitleScreen from "./TitleScreen";
import SettingsScreen from "./SettingsScreen";
import { getUserId, fetchProgress, addCoins, upgradeSkill, markStageCleared, resetSkills, wipeProgress } from "./api";
import { readSettings, writeSettings } from "./settings";
import { setHapticsEnabled } from "./haptics";
import { startBgm, setBgmEnabled, setBgmVolume } from "./bgm";

const SCREEN = {
  LOADING: "loading",
  TITLE: "title",
  TREE: "tree",
  STAGE_SELECT: "stageSelect",
  GAME: "game",
  RESULT: "result",
  SETTINGS: "settings",
  ERROR: "error",
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [error, setError] = useState(null);
  const [userId] = useState(() => getUserId());
  const [coins, setCoins] = useState(0);
  const [skillLevels, setSkillLevels] = useState({});
  const [clearedStages, setClearedStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(1);
  const [lastResult, setLastResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(() => {
    const s = readSettings();
    setHapticsEnabled(s.haptics);
    setBgmEnabled(s.bgmEnabled);
    setBgmVolume(s.bgmVolume);
    return s;
  });

  const handleChangeSettings = (next) => {
    setSettings(next);
    writeSettings(next);
    setHapticsEnabled(next.haptics);
    setBgmEnabled(next.bgmEnabled);
    setBgmVolume(next.bgmVolume);
  };

  const handleWipeProgress = async () => {
    setBusy(true);
    try {
      const res = await wipeProgress();
      setCoins(res.coins);
      setSkillLevels(res.skill_levels);
      setClearedStages(res.cleared_stages);
    } finally {
      setBusy(false);
      startBgm();
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchProgress(userId)
      .then((data) => {
        if (cancelled) return;
        setCoins(data.coins);
        setSkillLevels(data.skill_levels || {});
        setClearedStages(data.cleared_stages || []);
        setScreen(SCREEN.TITLE);
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

  const handleGoStageSelect = () => setScreen(SCREEN.STAGE_SELECT);
  const handleBackToTree = () => setScreen(SCREEN.TREE);

  const handleReset = async () => {
    setBusy(true);
    try {
      const res = await resetSkills(userId);
      setSkillLevels({});
      setCoins(res.coins);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
      // iOS WebView の confirm/alert 後に BGM が一時停止することがあるので再 try
      startBgm();
    }
  };

  const handleStartStage = (stageNumber) => {
    setSelectedStage(stageNumber);
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
    if (data.cleared && data.stageNumber) {
      try {
        const res = await markStageCleared(userId, data.stageNumber);
        setClearedStages(res.cleared_stages);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (screen === SCREEN.GAME) {
    return (
      <PhaserGame
        skillLevels={skillLevels}
        stageNumber={selectedStage}
        onRunEnded={handleRunEnded}
        onAbort={() => setScreen(SCREEN.TREE)}
      />
    );
  }

  if (screen === SCREEN.TITLE) {
    return (
      <TitleScreen
        onStart={() => {
          startBgm();
          setScreen(SCREEN.TREE);
        }}
      />
    );
  }

  if (screen === SCREEN.SETTINGS) {
    return (
      <SettingsScreen
        settings={settings}
        onChangeSettings={handleChangeSettings}
        onResetSkills={handleReset}
        onWipeProgress={handleWipeProgress}
        onBack={() => setScreen(SCREEN.TREE)}
        backLabel="← スキルツリー"
        busy={busy}
      />
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Skill Tree Shooter</h1>
        <span style={styles.userId}>ID: {userId}</span>
      </header>

      {screen === SCREEN.LOADING && <p style={styles.center}>読み込み中…</p>}

      {screen === SCREEN.ERROR && (
        <div style={styles.center}>
          <p>エラー: {error}</p>
        </div>
      )}

      {screen === SCREEN.TREE && (
        <SkillTreeScreen
          coins={coins}
          skillLevels={skillLevels}
          onUpgrade={handleUpgrade}
          onStart={handleGoStageSelect}
          onBackToTitle={() => setScreen(SCREEN.TITLE)}
          onOpenSettings={() => setScreen(SCREEN.SETTINGS)}
          busy={busy}
        />
      )}

      {screen === SCREEN.STAGE_SELECT && (
        <StageSelectScreen
          clearedStages={clearedStages}
          onSelect={handleStartStage}
          onBack={handleBackToTree}
        />
      )}

      {screen === SCREEN.RESULT && lastResult && (
        <div style={styles.resultWrap}>
          <h2 style={{ color: lastResult.cleared ? "#fde047" : "#f87171", margin: 0 }}>
            {lastResult.cleared ? `STAGE ${lastResult.stageNumber} CLEAR!` : "RUN ENDED"}
          </h2>
          <p style={styles.resultLine}>
            生存時間: <strong>{formatTime(lastResult.survivedSec)}</strong>
          </p>
          <p style={styles.resultLine}>
            獲得コイン: <strong style={{ color: "#fde047" }}>{lastResult.coins}</strong>
            {lastResult.clearBonus > 0 && (
              <span style={{ color: "#fde047", fontSize: 14, marginLeft: 8 }}>
                (クリアボーナス +{lastResult.clearBonus})
              </span>
            )}
            {lastResult.retryBonus > 0 && (
              <span style={{ color: "#94a3b8", fontSize: 14, marginLeft: 8 }}>
                (リトライボーナス +{lastResult.retryBonus})
              </span>
            )}
          </p>
          <p style={styles.resultLine}>所持コイン: <strong>{coins}</strong></p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button style={styles.primaryBtn} onClick={handleBackToTree}>スキルツリーへ</button>
            <button style={styles.secondaryBtn} onClick={() => setScreen(SCREEN.STAGE_SELECT)}>ステージ選択</button>
            <button style={styles.secondaryBtn} onClick={() => handleStartStage(selectedStage)}>もう一度</button>
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
  app: {
    padding: "calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 16px)",
  },
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
