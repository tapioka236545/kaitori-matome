"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAdmin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await loginAdmin(email.trim(), password);
      router.replace("/admin");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "ログインに失敗しました";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">管理者ログイン</h1>

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
          maxWidth: 520,
          display: "grid",
          gap: 12,
        }}
      >
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
    placeholder="管理者メールアドレス"
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
    autoComplete="current-password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="パスワード"
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
          onClick={onLogin}
          className="primaryBtn"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            fontWeight: 700,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "ログイン中..." : "ログイン"}
        </button>

        <div style={{ minHeight: 22, color: "#ff8a8a", fontSize: 13 }}>
          {error}
        </div>
      </section>
    </main>
  );
}