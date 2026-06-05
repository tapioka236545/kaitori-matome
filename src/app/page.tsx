"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAdmin, useAdminStatus } from "@/lib/admin-auth";
import { loadVendors, loadProperties } from "@/lib/store";
import Onboarding from "@/components/Onboarding";

export default function HomePage() {
  const { isAdmin, loading } = useAdminStatus();

  const [tapCount, setTapCount] = useState(0);
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  const [vendorCount, setVendorCount] = useState<number | null>(null);
  const [propertyCount, setPropertyCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([loadVendors(), loadProperties()])
      .then(([v, p]) => {
        setVendorCount(v.length);
        setPropertyCount(p.length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tapCount === 0) return;

    const timer = setTimeout(() => {
      setTapCount(0);
    }, 1500);

    return () => clearTimeout(timer);
  }, [tapCount]);

  const onTitleTap = () => {
    const nextCount = tapCount + 1;

    if (nextCount >= 5) {
      setShowAdminEntry(true);
      setTapCount(0);
      return;
    }

    setTapCount(nextCount);
  };

  return (
    <main className="container safeArea">
      <Onboarding />
      <section
        style={{
          minHeight: "calc(100vh - 120px)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 24,
            background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            display: "grid",
            gap: 20,
          }}
        >
          <button
            type="button"
            onClick={onTitleTap}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              cursor: "pointer",
            }}
          >
            <h1
              className="pageTitle"
              style={{ marginBottom: 0, textAlign: "center", width: "100%" }}
            >
              買取くん
            </h1>
          </button>

          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 18,
              lineHeight: 1.7,
              fontWeight: 700,
              color: "var(--text)",
              opacity: 0.95,
              whiteSpace: "pre-line",
            }}
          >
            {"〜あの会社いくらだっけ？\nどこに紹介した？を卒業〜"}
          </p>

          {/* EmptyState ガイドバナー */}
          {vendorCount === 0 && (
            <Link
              href="/vendors"
              style={{
                display: "block",
                textDecoration: "none",
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(255,180,0,0.12)",
                border: "1px solid rgba(255,180,0,0.35)",
                color: "var(--text)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                ⚠️ まず業者を登録しましょう
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                業者登録 → 名刺撮影で簡単入力できます →
              </div>
            </Link>
          )}
          {vendorCount !== null && vendorCount > 0 && propertyCount === 0 && (
            <Link
              href="/properties/new"
              style={{
                display: "block",
                textDecoration: "none",
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(74,163,255,0.1)",
                border: "1px solid rgba(74,163,255,0.3)",
                color: "var(--text)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                📋 物件を追加しましょう
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                物件を登録して業者に紹介 →
              </div>
            </Link>
          )}

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 8,
            }}
          >
            <Link
              href="/properties"
              className="primaryBtn"
              style={{
                textDecoration: "none",
                textAlign: "center",
                fontSize: 18,
                fontWeight: 800,
                padding: "16px 18px",
                borderRadius: 16,
              }}
            >
              物件一覧
            </Link>

            <Link
              href="/vendors"
              className="ghostBtn"
              style={{
                textDecoration: "none",
                textAlign: "center",
                fontSize: 18,
                fontWeight: 800,
                padding: "16px 18px",
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              業者登録
            </Link>

            {!loading && isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="ghostBtn"
                  style={{
                    textDecoration: "none",
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    padding: "16px 18px",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  管理者ページ
                </Link>

                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="ghostBtn"
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}
                >
                  管理者ログアウト
                </button>
              </>
            )}

            {!loading && !isAdmin && showAdminEntry && (
              <Link
                href="/admin-login"
                className="ghostBtn"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                管理者ログイン
              </Link>
            )}
          </div>
          <Link
            href="/account-transfer"
            className="ghostBtn"
            style={{
              textDecoration: "none",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 700,
              padding: "12px 16px",
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            データ引き継ぎ設定
          </Link>
        </div>
      </section>
    </main>
  );
}