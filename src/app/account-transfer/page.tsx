"use client";

import Link from "next/link";
import { useState } from "react";
import { linkAnonymousUserToEmail } from "@/lib/account-transfer";

export default function AccountTransferPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    if (saving) return;

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("メールアドレスを入力してください");
      return;
    }

    if (!password) {
      setError("パスワードを入力してください");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }

    if (password !== passwordConfirm) {
      setError("確認用パスワードが一致しません");
      return;
    }

    setSaving(true);

    try {
      const result = await linkAnonymousUserToEmail(trimmedEmail, password);

      if (result.alreadyLinked) {
        setSuccess("この端末のデータは、すでに引き継ぎ設定済みです。");
      } else {
        setSuccess(
          "引き継ぎ設定が完了しました。App Store版では同じメールアドレスで利用してください。"
        );
      }
    } catch (e: any) {
      const code = e?.code ?? "";

      if (code === "auth/email-already-in-use") {
        setError(
          "このメールアドレスはすでに使用されています。別のメールアドレスを使ってください。"
        );
      } else if (code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません。");
      } else if (code === "auth/weak-password") {
        setError("パスワードが弱すぎます。6文字以上で設定してください。");
      } else {
        setError("引き継ぎ設定に失敗しました。もう一度お試しください。");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">データ引き継ぎ設定</h1>

        <div className="pageHeaderActions">
          <Link href="/" className="ghostBtn">
            ← トップ
          </Link>
        </div>
      </div>

      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--card)",
          maxWidth: 560,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: "var(--muted)",
          }}
        >
          TestFlight版で登録したデータを、App Store公開版でも引き継げるようにする設定です。
          <br />
          公開前に一度だけ設定してください。
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          メールアドレス
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sample@example.com"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          パスワード
          <input
            type="password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          パスワード確認
          <input
            type="password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="もう一度入力"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
            }}
          />
        </label>

        <button
          type="button"
          onClick={onSubmit}
          className="primaryBtn"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "設定中..." : "引き継ぎ設定を保存"}
        </button>

        <div style={{ minHeight: 22, fontSize: 13, color: "#ff8a8a" }}>
          {error}
        </div>

        <div style={{ minHeight: 22, fontSize: 13, color: "#8fd19e" }}>
          {success}
        </div>
      </section>
    </main>
  );
}