import { useEffect, useState } from "react";
import PhaserGame from "./PhaserGame";
import SkillTreeScreen from "./SkillTreeScreen";
import StageSelectScreen from "./StageSelectScreen";
import TitleScreen from "./TitleScreen";
import SettingsScreen from "./SettingsScreen";
import { getUserId, fetchProgress, addCoins, upgradeSkill, markStageCleared, resetSkills, wipeProgress, cheatAddCoins, cheatUnlockAllStages } from "./api";
import { PAL, PX_FONT, JP_FONT, Coin } from "./pixel/PixelArt";
import { readSettings, writeSettings } from "./settings";
import { setHapticsEnabled } from "./haptics";
import { startBgm, setBgmEnabled, setBgmVolume, playTrack } from "./bgm";

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

  const handleCheatAddCoins = async (amount) => {
    const res = await cheatAddCoins(amount);
    setCoins(res.coins);
  };

  const handleCheatUnlockAllStages = async () => {
    const res = await cheatUnlockAllStages();
    setClearedStages(res.cleared_stages);
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

  // 画面に応じて BGM トラック切替。GAME / RESULT は stage、それ以外は menu。
  useEffect(() => {
    if (screen === SCREEN.LOADING || screen === SCREEN.ERROR) return;
    if (screen === SCREEN.GAME || screen === SCREEN.RESULT) {
      playTrack("stage");
    } else {
      playTrack("menu");
    }
  }, [screen]);

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
        onCheatAddCoins={handleCheatAddCoins}
        onCheatUnlockAllStages={handleCheatUnlockAllStages}
        onBack={() => setScreen(SCREEN.TREE)}
        backLabel="スキルツリー"
        busy={busy}
      />
    );
  }

  return (
    <div style={styles.app}>

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
        <div style={styles.resultScreen}>
          <div style={styles.resultBox}>
            <div style={{
              ...styles.resultBanner,
              color: lastResult.cleared ? PAL.gold : PAL.blood,
              textShadow: lastResult.cleared
                ? "0 0 18px rgba(240,196,74,0.7), 3px 3px 0 #4a2a0a"
                : "0 0 18px rgba(198,56,56,0.7), 3px 3px 0 #4a0a0a",
            }}>
              {lastResult.cleared ? `STAGE ${String(lastResult.stageNumber).padStart(2, "0")}` : "RUN"}
            </div>
            <div style={{
              ...styles.resultStatus,
              color: lastResult.cleared ? PAL.gold : PAL.blood,
            }}>
              {lastResult.cleared ? "◆ CLEAR ◆" : "◆ ENDED ◆"}
            </div>

            <div style={styles.resultStats}>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>生存時間 / TIME</span>
                <span style={styles.statValue}>{formatTime(lastResult.survivedSec)}</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>獲得コイン / EARNED</span>
                <span style={{ ...styles.statValue, color: PAL.gold, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Coin scale={2} />
                  {lastResult.coins}
                </span>
              </div>
              {lastResult.clearBonus > 0 && (
                <div style={styles.bonusRow}>
                  <span style={styles.bonusLabel}>CLEAR BONUS</span>
                  <span style={{ ...styles.bonusValue, color: PAL.gold }}>+{lastResult.clearBonus}</span>
                </div>
              )}
              {lastResult.retryBonus > 0 && (
                <div style={styles.bonusRow}>
                  <span style={styles.bonusLabel}>RETRY BONUS</span>
                  <span style={styles.bonusValue}>+{lastResult.retryBonus}</span>
                </div>
              )}
              <div style={styles.statRow}>
                <span style={styles.statLabel}>所持コイン / TOTAL</span>
                <span style={{ ...styles.statValue, color: PAL.gold }}>{coins.toLocaleString()}</span>
              </div>
            </div>

            <div style={styles.resultButtons}>
              <button style={styles.primaryBtn} onClick={handleBackToTree}>SKILL TREE</button>
              <button style={styles.secondaryBtn} onClick={() => setScreen(SCREEN.STAGE_SELECT)}>STAGE</button>
              <button style={styles.secondaryBtn} onClick={() => handleStartStage(selectedStage)}>RETRY</button>
            </div>
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
    minHeight: "100vh",
    background: PAL.ink,
    color: PAL.bone,
    fontFamily: JP_FONT,
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  center: { textAlign: "center", color: PAL.bone2, padding: 40, fontFamily: JP_FONT },
  resultScreen: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  resultBox: {
    background: PAL.ink2,
    boxShadow: `4px 4px 0 #050309, 0 0 0 2px ${PAL.gold}`,
    padding: "24px 22px",
    maxWidth: 420, width: "100%",
    textAlign: "center",
  },
  resultBanner: {
    fontFamily: PX_FONT, fontSize: 30, letterSpacing: 4,
    margin: 0, lineHeight: 1.1,
  },
  resultStatus: {
    fontFamily: PX_FONT, fontSize: 14, letterSpacing: 4,
    margin: "8px 0 24px",
  },
  resultStats: {
    background: PAL.ink, padding: "14px 14px 12px",
    boxShadow: `inset 0 0 0 1px ${PAL.shadow}`,
    marginBottom: 20,
  },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 0",
  },
  statLabel: {
    fontFamily: PX_FONT, fontSize: 8, color: PAL.bone2, letterSpacing: 2,
  },
  statValue: {
    fontFamily: PX_FONT, fontSize: 12, color: PAL.bone,
  },
  bonusRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "3px 0",
    borderLeft: `2px solid ${PAL.gold}`,
    paddingLeft: 8, marginLeft: 6,
  },
  bonusLabel: {
    fontFamily: PX_FONT, fontSize: 7, color: PAL.bone2, letterSpacing: 1.5,
  },
  bonusValue: {
    fontFamily: PX_FONT, fontSize: 9, color: PAL.bone,
  },
  resultButtons: {
    display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
  },
  primaryBtn: {
    fontFamily: PX_FONT, fontSize: 11, letterSpacing: 2,
    background: PAL.blood, color: PAL.ink, border: "none",
    padding: "10px 16px", cursor: "pointer",
    boxShadow: `3px 3px 0 ${PAL.bloodDark}, 0 0 0 2px ${PAL.ink}`,
  },
  secondaryBtn: {
    fontFamily: PX_FONT, fontSize: 11, letterSpacing: 2,
    background: PAL.shadow, color: PAL.bone, border: "none",
    padding: "10px 16px", cursor: "pointer",
    boxShadow: `3px 3px 0 ${PAL.ink}, 0 0 0 2px ${PAL.ink}`,
  },
};
