// 設定画面。タイトルから開く。
// 注意: ネイティブ confirm()/alert() は iOS WebView で BGM を止める副作用があるため
// HTML モーダル (ConfirmModal) を使うこと。

import { useState } from "react";

export default function SettingsScreen({
  settings,
  onChangeSettings,
  onResetSkills,
  onWipeProgress,
  onBack,
  backLabel = "← 戻る",
  busy,
}) {
  const [working, setWorking] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm, danger }

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
    // 1 段目
    setConfirmState({
      message: "コイン・スキル・ステージ進捗をすべて消去します。元に戻せません。本当に？",
      danger: true,
      onConfirm: () => {
        // 2 段目 (最終確認)
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
      <header style={styles.header}>
        <button type="button" onClick={onBack} style={styles.backButton}>{backLabel}</button>
        <h2 style={{ margin: 0 }}>設定</h2>
        <span style={{ width: 100 }} />
      </header>

      <Section title="表示">
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

      <Section title="フィードバック">
        <Toggle
          label="バイブレーション"
          description="被弾や撃破などで端末を振動させる (iOS のみ)"
          checked={settings.haptics}
          onChange={(v) => onChangeSettings({ ...settings, haptics: v })}
        />
      </Section>

      <Section title="サウンド">
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

      <Section title="進捗管理">
        <button type="button" onClick={handleResetSkills} disabled={disabled} style={styles.warnButton}>
          ⟲ スキルをリセット (コイン全額返却)
        </button>
        <p style={styles.note}>
          すべてのスキルを Lv0 に戻します。支払ったコインは全額戻ります。
        </p>
        <button type="button" onClick={handleWipe} disabled={disabled} style={styles.dangerButton}>
          ⚠ 進捗をすべて消去
        </button>
        <p style={styles.note}>
          コイン・スキル・クリア状況を全消去。完全に最初からやり直す場合のみ。
        </p>
      </Section>

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
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <p style={styles.modalMessage}>{message}</p>
        <div style={styles.modalButtons}>
          <button type="button" onClick={onCancel} style={styles.modalCancel}>キャンセル</button>
          <button
            type="button"
            onClick={onConfirm}
            style={danger ? styles.modalDanger : styles.modalConfirm}
          >
            実行
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Slider({ label, value, onChange, disabled }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ ...styles.toggleRow, opacity: disabled ? 0.4 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "#cbd5e1" }}>{label}</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: 140, accentColor: "#22c55e" }}
      />
      <div style={{ width: 32, textAlign: "right", fontSize: 12, color: "#94a3b8" }}>{pct}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label style={styles.toggleRow}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15 }}>{label}</div>
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
    padding: "calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 16px)",
    color: "#e2e8f0", maxWidth: 560, margin: "0 auto",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20, gap: 12,
  },
  backButton: {
    background: "#334155", color: "#e2e8f0", border: "none",
    padding: "8px 14px", borderRadius: 6, fontSize: 14, cursor: "pointer",
    minWidth: 100,
  },
  section: {
    background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
    padding: "12px 16px", marginBottom: 16,
  },
  sectionTitle: {
    margin: "0 0 12px", fontSize: 13, color: "#fde047", letterSpacing: 1,
  },
  toggleRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 0", cursor: "pointer",
  },
  toggleDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  checkbox: { width: 20, height: 20, accentColor: "#22c55e", cursor: "pointer" },
  warnButton: {
    width: "100%", background: "#475569", color: "#e2e8f0", border: "none",
    padding: "10px", borderRadius: 6, fontSize: 14, cursor: "pointer", marginTop: 4,
  },
  dangerButton: {
    width: "100%", background: "#7f1d1d", color: "#fecaca", border: "none",
    padding: "10px", borderRadius: 6, fontSize: 14, cursor: "pointer", marginTop: 12,
  },
  note: { fontSize: 11, color: "#94a3b8", margin: "6px 0 0", lineHeight: 1.5 },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 9999,
  },
  modalBox: {
    background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
    padding: "20px 18px", maxWidth: 360, width: "100%",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
  },
  modalMessage: {
    margin: "0 0 18px", fontSize: 14, lineHeight: 1.6, color: "#e2e8f0",
  },
  modalButtons: {
    display: "flex", gap: 10, justifyContent: "flex-end",
  },
  modalCancel: {
    background: "#334155", color: "#e2e8f0", border: "none",
    padding: "10px 18px", borderRadius: 6, fontSize: 14, cursor: "pointer",
  },
  modalConfirm: {
    background: "#475569", color: "#fde047", border: "none",
    padding: "10px 18px", borderRadius: 6, fontSize: 14, cursor: "pointer",
    fontWeight: "bold",
  },
  modalDanger: {
    background: "#7f1d1d", color: "#fecaca", border: "none",
    padding: "10px 18px", borderRadius: 6, fontSize: 14, cursor: "pointer",
    fontWeight: "bold",
  },
};
