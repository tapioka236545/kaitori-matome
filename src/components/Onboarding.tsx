"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    icon: "🏠",
    title: "買取くんへようこそ",
    desc: "不動産の買取価格を複数の業者に一括照会・管理できるアプリです。",
  },
  {
    icon: "👤",
    title: "STEP 1：業者を登録する",
    desc: "まず買取業者を登録しましょう。名刺を撮影するだけで自動入力できます。",
    hint: "→ トップ画面の「業者登録」から",
  },
  {
    icon: "📋",
    title: "STEP 2：物件を登録して紹介する",
    desc: "物件を追加し、紹介した業者にチェックを入れましょう。",
    hint: "→ 「物件一覧」から新規追加",
  },
  {
    icon: "💰",
    title: "STEP 3：回答金額を入力する",
    desc: "業者から回答が届いたら金額を入力。最高値がひと目でわかります。",
    hint: "→ 物件詳細の「金額入力」から",
  },
];

export default function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("onboarding_done");
      if (!done) setVisible(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem("onboarding_done", "1");
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--bg1)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 28,
          display: "grid",
          gap: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: i === step ? "var(--accent)" : "var(--border)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{current.icon}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "var(--text)",
              marginBottom: 10,
            }}
          >
            {current.title}
          </div>
          <div
            style={{
              fontSize: 15,
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            {current.desc}
          </div>
          {current.hint && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "var(--accent)",
                fontWeight: 700,
              }}
            >
              {current.hint}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={finish}
            className="ghostBtn"
            style={{ flex: 1, justifyContent: "center" }}
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={isLast ? finish : () => setStep((s) => s + 1)}
            className="primaryBtn"
            style={{ flex: 2, justifyContent: "center" }}
          >
            {isLast ? "さっそく始める！" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
