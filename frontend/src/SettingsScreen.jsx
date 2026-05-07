// 設定画面。タイトルから開く。
// 注意: ネイティブ confirm()/alert() は iOS WebView で BGM を止める副作用があるため
// HTML モーダル (ConfirmModal) を使うこと。

import { useState } from "react";
import { ResetIcon, WarnIcon, CoinIcon, UnlockIcon, BackIcon } from "./icons";
import { PAL, PX_FONT, JP_FONT } from "./pixel/PixelArt";

export default function SettingsScreen({
  settings,
  onChangeSettings,
  onResetSkills,
  onWipeProgress,
  onCheatAddCoins,
  onCheatUnlockAllStages,
  onBack,
  backLabel = "戻る",
  busy,
}) {
  const [working, setWorking] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const handleResetSkills = () => {
    setConfirmState({
      message: "全スキルをリセットして、支払ったコインを全額返却します。よろしいですか？",
      danger: false,
      onConfirm: async () => {
        setWorking(true);
        try { await onResetSkills(); } finally { setWorking(false); }
      },
    });
  };

  const handleWipe = () => {
    setConfirmState({
      message: "コイン・スキル・ステージ進捗をすべて消去します。元に戻せません。本当に？",
      danger: true,
      onConfirm: () => {
        setConfirmState({
          message: "最終確認: すべての進捗を消去します。よろしいですか？",
          danger: true,
          onConfirm: async () => {
            setWorking(true);
            try { await onWipeProgress(); } finally { setWorking(false); }
          },
        });
      },
    });
  };

  const disabled = busy || working;

  return (
    <div style={styles.wrap}>
      <div style={styles.headerBox}>
        <div style={styles.headerTop}>
          <button type="button" onClick={onBack} style={styles.headerSideBtn} aria-label="戻る">
            <BackIcon width={14} height={14} /><span>BACK</span>
          </button>
          <div style={styles.headerTitle}>SETTINGS</div>
          <span style={{ width: 60, flexShrink: 0 }} />
        </div>
      </div>

      <div style={styles.body}>
        <Section title="表示 / DISPLAY">
          <Toggle
            label="画面シェイク"
            description="被弾や爆発で画面が揺れる演出"
            checked={settings.screenShake}
            onChange={(v) => onChangeSettings({ ...settings, screenShake: v })}
          />
          <Toggle
            label="ダメージ数表示"
            description="敵への被ダメ数を表示。OFF で動作が軽くなる"
            checked={settings.damageNumbers}
            onChange={(v) => onChangeSettings({ ...settings, damageNumbers: v })}
          />
        </Section>

        <Section title="フィードバック / HAPTICS">
          <Toggle
            label="バイブレーション"
            description="被弾や撃破などで端末を振動させる (iOS のみ)"
            checked={settings.haptics}
            onChange={(v) => onChangeSettings({ ...settings, haptics: v })}
          />
        </Section>

        <Section title="サウンド / SOUND">
          <Toggle
            label="BGM"
            checked={settings.bgmEnabled}
            onChange={(v) => onChangeSettings({ ...settings, bgmEnabled: v })}
          />
          <Slider
            label="BGM 音量"
            value={settings.bgmVolume}
            disabled={!settings.bgmEnabled}
            onChange={(v) => onChangeSettings({ ...settings, bgmVolume: v })}
          />
          <Toggle
            label="効果音"
            checked={settings.seEnabled}
            onChange={(v) => onChangeSettings({ ...settings, seEnabled: v })}
          />
          <Slider
            label="効果音 音量"
            value={settings.seVolume}
            disabled={!settings.seEnabled}
            onChange={(v) => onChangeSettings({ ...settings, seVolume: v })}
          />
        </Section>

        <Section title="進捗管理 / PROGRESS" tone="moss">
          <PixelButton onClick={handleResetSkills} disabled={disabled} tone="warn">
            <ResetIcon width={14} height={14} />
            <span>スキルをリセット (コイン返却)</span>
          </PixelButton>
          <p style={styles.note}>
            すべてのスキルを Lv0 に戻します。支払ったコインは全額戻ります。
          </p>
          <PixelButton onClick={handleWipe} disabled={disabled} tone="danger">
            <WarnIcon width={14} height={14} />
            <span>進捗をすべて消去</span>
          </PixelButton>
          <p style={styles.note}>
            コイン・スキル・クリア状況を全消去。完全に最初からやり直す場合のみ。
          </p>
        </Section>

        <Section title="開発者 / DEV" tone="rune">
          <p style={{ ...styles.note, marginTop: 0 }}>動作確認用。申請前に削除予定。</p>
          <PixelButton
            onClick={() => onCheatAddCoins && onCheatAddCoins(1000)}
            disabled={disabled || !onCheatAddCoins}
            tone="rune"
          >
            <CoinIcon width={14} height={14} />
            <span>コイン +1000</span>
          </PixelButton>
          <PixelButton
            onClick={() => onCheatUnlockAllStages && onCheatUnlockAllStages()}
            disabled={disabled || !onCheatUnlockAllStages}
            tone="rune"
          >
            <UnlockIcon width={14} height={14} />
            <span>全ステージ解放</span>
          </PixelButton>
        </Section>
      </div>

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          danger={confirmState.danger}
          onConfirm={() => {
            const cb = confirmState.onConfirm;
            setConfirmState(null);
            cb();
          }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, danger }) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div
        style={{
          ...styles.modalBox,
          boxShadow: danger
            ? `4px 4px 0 ${PAL.bloodDark}, 0 0 0 2px ${PAL.blood}, 0 0 24px rgba(198,56,56,0.3)`
            : `4px 4px 0 ${PAL.goldDark}, 0 0 0 2px ${PAL.gold}, 0 0 24px rgba(240,196,74,0.3)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={styles.modalMessage}>{message}</p>
        <div style={styles.modalButtons}>
          <button type="button" onClick={onCancel} style={styles.modalCancel}>CANCEL</button>
          <button
            type="button"
            onClick={onConfirm}
            style={danger ? styles.modalDanger : styles.modalConfirm}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, tone }) {
  const accent =
    tone === "moss" ? PAL.moss :
    tone === "rune" ? PAL.rune :
    PAL.gold;
  return (
    <section style={{ ...styles.section, boxShadow: `0 0 0 2px ${accent}, 4px 4px 0 ${PAL.ink2}` }}>
      <h3 style={{ ...styles.sectionTitle, color: accent }}>◆ {title} ◆</h3>
      <div>{children}</div>
    </section>
  );
}

function PixelButton({ onClick, disabled, tone = "warn", children }) {
  const palette =
    tone === "danger" ? { fg: PAL.bone, bg: PAL.blood, sh: PAL.bloodDark } :
    tone === "rune"   ? { fg: "#e0e7ff", bg: "#3730a3", sh: "#1e1b4b" } :
                        { fg: PAL.bone, bg: PAL.shadow, sh: PAL.ink2 };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: palette.bg, color: palette.fg, border: "none",
        padding: "11px 12px", marginTop: 6,
        fontFamily: PX_FONT, fontSize: 11, letterSpacing: 1.5,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: `3px 3px 0 ${palette.sh}, 0 0 0 2px ${PAL.ink}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {children}
    </button>
  );
}

function Slider({ label, value, onChange, disabled }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ ...styles.toggleRow, opacity: disabled ? 0.4 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={styles.toggleLabel}>{label}</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: 120, accentColor: PAL.gold }}
      />
      <div style={styles.sliderValue}>{pct}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label style={styles.toggleRow}>
      <div style={{ flex: 1 }}>
        <div style={styles.toggleLabel}>{label}</div>
        {description && <div style={styles.toggleDesc}>{description}</div>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={styles.checkbox}
      />
    </label>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
    color: PAL.bone,
    background: PAL.ink,
    fontFamily: JP_FONT,
  },
  headerBox: {
    padding: "12px 16px 10px",
    borderBottom: `2px solid ${PAL.ink2}`,
    background: `linear-gradient(180deg, ${PAL.ink2}, ${PAL.ink})`,
  },
  headerTop: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 8,
  },
  headerTitle: {
    fontFamily: PX_FONT,
    fontSize: 12,
    color: PAL.gold,
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
    minWidth: 0,
    textShadow: "0 0 8px rgba(240,196,74,0.5)",
  },
  headerSideBtn: {
    background: PAL.ink2, border: "none",
    color: PAL.bone2, cursor: "pointer",
    fontFamily: PX_FONT, fontSize: 9, letterSpacing: 2,
    padding: "6px 10px",
    display: "inline-flex", alignItems: "center", gap: 5,
    flexShrink: 0,
    boxShadow: `2px 2px 0 #050309, 0 0 0 1.5px ${PAL.shadow}`,
  },
  body: {
    padding: "16px 16px",
    maxWidth: 520, margin: "0 auto",
  },
  section: {
    background: PAL.ink2,
    padding: "14px 14px 12px",
    marginBottom: 22,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontFamily: PX_FONT, fontSize: 10, letterSpacing: 2,
  },
  toggleRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 0", cursor: "pointer",
  },
  toggleLabel: { fontFamily: JP_FONT, fontSize: 14, color: PAL.bone },
  toggleDesc: { fontSize: 11, color: PAL.bone2, marginTop: 2 },
  checkbox: { width: 18, height: 18, accentColor: PAL.gold, cursor: "pointer" },
  sliderValue: {
    width: 32, textAlign: "right",
    fontFamily: PX_FONT, fontSize: 9, color: PAL.bone2,
  },
  note: {
    fontSize: 11, color: PAL.bone2,
    margin: "6px 0 4px", lineHeight: 1.5,
  },

  // モーダル
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 9999,
  },
  modalBox: {
    background: PAL.ink2, padding: "20px 18px",
    maxWidth: 360, width: "100%",
  },
  modalMessage: {
    margin: "0 0 18px",
    fontFamily: JP_FONT,
    fontSize: 14, lineHeight: 1.6, color: PAL.bone,
  },
  modalButtons: {
    display: "flex", gap: 10, justifyContent: "flex-end",
  },
  modalCancel: {
    background: PAL.shadow, color: PAL.bone, border: "none",
    padding: "10px 18px", fontSize: 11,
    fontFamily: PX_FONT, letterSpacing: 2, cursor: "pointer",
    boxShadow: `2px 2px 0 ${PAL.ink}`,
  },
  modalConfirm: {
    background: PAL.gold, color: PAL.ink, border: "none",
    padding: "10px 18px", fontSize: 11,
    fontFamily: PX_FONT, letterSpacing: 2, cursor: "pointer", fontWeight: 700,
    boxShadow: `2px 2px 0 ${PAL.goldDark}`,
  },
  modalDanger: {
    background: PAL.blood, color: PAL.bone, border: "none",
    padding: "10px 18px", fontSize: 11,
    fontFamily: PX_FONT, letterSpacing: 2, cursor: "pointer", fontWeight: 700,
    boxShadow: `2px 2px 0 ${PAL.bloodDark}`,
  },
};
