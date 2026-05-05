// 設定画面。タイトルから開く。

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

  const handleResetSkills = async () => {
    if (!confirm("全スキルをリセットして、支払ったコインを全額返却します。よろしいですか？")) return;
    setWorking(true);
    try { await onResetSkills(); } finally { setWorking(false); }
  };

  const handleWipe = async () => {
    if (!confirm("コイン・スキル・ステージ進捗をすべて消去します。元に戻せません。本当に？")) return;
    if (!confirm("最終確認: すべての進捗を消去します。よろしいですか？")) return;
    setWorking(true);
    try { await onWipeProgress(); } finally { setWorking(false); }
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
};
