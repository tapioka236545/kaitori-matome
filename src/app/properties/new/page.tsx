"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addProperty } from "@/lib/store";

export default function NewPropertyPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = address.trim();
    if (!trimmed) return;

    const property = await addProperty(trimmed);

    // ここを新しい詳細ページに変更
    router.push(`/property-detail?id=${property.id}`);
  };

  return (
    <main className="container safeArea">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
       <h1 className="pageTitle">新規物件を追加</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" className="ghostBtn">
            トップ
          </Link>
          <Link href="/properties" className="ghostBtn">
            物件一覧
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
        }}
      >
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            物件名 / 住所
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例）アール・ケープラザ横浜関内605"
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
            type="submit"
            className="primaryBtn"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            次へ
          </button>
        </form>
      </section>
    </main>
  );
}