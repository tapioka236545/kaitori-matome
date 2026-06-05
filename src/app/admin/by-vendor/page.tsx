"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAdminOfferRows, type AdminOfferRow } from "@/lib/store";

function formatWithComma(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

function normalizeStoredPriceToManYen(price: number | null | undefined) {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  if (price >= 10_000_000) return Math.round(price / 10000);
  return price;
}

export default function AdminByVendorPage() {
  const [rows, setRows] = useState<AdminOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await loadAdminOfferRows();
        if (alive) setRows(list);
      } catch (error) {
        console.error("loadAdminOfferRows failed:", error);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        rows: AdminOfferRow[];
      }
    >();

    for (const row of rows) {
      const key = row.vendorId || row.vendorName;

      if (!map.has(key)) {
        map.set(key, {
          vendorId: row.vendorId,
          vendorName: row.vendorName || "名称未設定",
          rows: [],
        });
      }

      map.get(key)!.rows.push(row);
    }

    let list = Array.from(map.values()).map((group) => ({
      ...group,
      rows: [...group.rows].sort(
        (a, b) =>
          (normalizeStoredPriceToManYen(b.price) ?? 0) -
          (normalizeStoredPriceToManYen(a.price) ?? 0)
      ),
    }));

    const keyword = searchText.trim().toLowerCase();
    if (keyword) {
      list = list.filter((group) =>
        (group.vendorName ?? "").toLowerCase().includes(keyword)
      );
    }

    return list.sort((a, b) => a.vendorName.localeCompare(b.vendorName, "ja"));
  }, [rows, searchText]);

  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">会社別ページ</h1>

        <div className="pageHeaderActions">
          <Link href="/admin" className="ghostBtn">
            ← 管理者ページ
          </Link>
          <Link href="/" className="ghostBtn">
            トップ
          </Link>
        </div>
      </div>

      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <div style={{ display: "grid", gap: 6, maxWidth: 520, marginBottom: 16 }}>
        <label style={{ fontWeight: 700 }}>会社名検索</label>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="会社名で検索"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 15,
          }}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : grouped.length === 0 ? (
        <p>管理者用の買取データがありません。</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {grouped.map((group) => (
            <section
              key={group.vendorId || group.vendorName}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 14,
                background: "var(--card)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 10 }}>
                {group.vendorName}
              </h2>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                }}
              >
                {group.rows.map((row) => {
                  const price = normalizeStoredPriceToManYen(row.price);

                  return (
                    <li
                      key={row.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: 10,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{row.propertyName}</div>
                      <div style={{ marginTop: 4 }}>
                        金額：
                        {price !== null ? `${formatWithComma(price)}万円` : "未入力"}
                      </div>
                      <div style={{ marginTop: 4, color: "var(--muted)" }}>
                        備考：{row.memo?.trim() || "なし"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}