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

    let list = Array.from(map.values()).map((group) => {
      const sortedRows = [...group.rows].sort(
        (a, b) =>
          (normalizeStoredPriceToManYen(b.price) ?? -1) -
          (normalizeStoredPriceToManYen(a.price) ?? -1)
      );

      const answered = sortedRows.filter(
        (r) => normalizeStoredPriceToManYen(r.price) !== null
      ).length;

      return {
        ...group,
        rows: sortedRows,
        answered,
      };
    });

    const keyword = searchText.trim().toLowerCase();
    if (keyword) {
      list = list.filter((group) =>
        (group.vendorName ?? "").toLowerCase().includes(keyword)
      );
    }

    return list.sort((a, b) => a.vendorName.localeCompare(b.vendorName, "ja"));
  }, [rows, searchText]);

  const totalAnswered = useMemo(
    () =>
      rows.filter((r) => normalizeStoredPriceToManYen(r.price) !== null).length,
    [rows]
  );

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

      {/* 統計バー */}
      {!loading && rows.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(74,163,255,0.1)",
              border: "1px solid rgba(74,163,255,0.3)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            会社 {grouped.length}社
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(74,163,255,0.1)",
              border: "1px solid rgba(74,163,255,0.3)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            紹介 {rows.length}件
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(74,163,255,0.1)",
              border: "1px solid rgba(74,163,255,0.3)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            回答済 {totalAnswered}件
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 6, maxWidth: 520, marginBottom: 16 }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="🔍 会社名で検索"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 15,
            boxSizing: "border-box",
          }}
        />
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : grouped.length === 0 ? (
        <p>
          {searchText.trim()
            ? "検索条件に一致する会社がありません。"
            : "管理者用の買取データがありません。"}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {grouped.map((group) => (
            <details
              key={group.vendorId || group.vendorName}
              className="adminGroup"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--card)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                }}
              >
                <span className="chev">▶</span>

                <span
                  style={{
                    fontWeight: 800,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {group.vendorName}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  物件 {group.rows.length}件
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      group.answered > 0 ? "var(--accent)" : "var(--muted)",
                    flexShrink: 0,
                    minWidth: 64,
                    textAlign: "right",
                  }}
                >
                  回答 {group.answered}件
                </span>
              </summary>

              <ul
                style={{
                  listStyle: "none",
                  padding: "4px 14px 12px",
                  margin: 0,
                  display: "grid",
                  gap: 6,
                }}
              >
                {group.rows.map((row) => {
                  const price = normalizeStoredPriceToManYen(row.price);

                  return (
                    <li
                      key={row.id}
                      style={{
                        borderTop: "1px solid var(--border)",
                        padding: "8px 2px 4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.propertyName}
                        </span>

                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: price !== null ? "var(--text)" : "var(--muted)",
                            flexShrink: 0,
                          }}
                        >
                          {price !== null
                            ? `${formatWithComma(price)}万円`
                            : "未回答"}
                        </span>
                      </div>

                      {row.memo?.trim() && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {row.memo}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
