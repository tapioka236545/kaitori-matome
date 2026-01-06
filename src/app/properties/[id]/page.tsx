"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addOffer, getProperty, type Property } from "../../lib/store";

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);

  const [company, setCompany] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [terms, setTerms] = useState("");

  const [sort, setSort] = useState<"high" | "low">("high");

  useEffect(() => {
    setProperty(getProperty(params.id) ?? null);
  }, [params.id]);

  const offersSorted = useMemo(() => {
    if (!property) return [];
    const arr = property.offers.slice();
    arr.sort((a, b) => (sort === "high" ? b.price - a.price : a.price - b.price));
    return arr;
  }, [property, sort]);

  if (!property) {
    return (
      <main style={{ padding: 24 }}>
        <p>物件が見つかりませんでした。</p>
        <Link href="/properties">← 物件一覧へ</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <p>
        <Link href="/properties">← 物件一覧へ</Link>
      </p>

      <h1 style={{ marginTop: 12 }}>{property.address}</h1>

      <hr style={{ margin: "16px 0" }} />

      <h2>買取条件を追加</h2>

      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>会社名</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>買取金額（円）</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ width: "100%", padding: 8 }}
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            例：3000万円 → 30000000
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>条件</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
            placeholder="例）現況渡し / 測量あり / 瑕疵担保免責 など"
          />
        </div>

        <button
          style={{ padding: "8px 16px" }}
          onClick={() => {
            if (!company.trim()) return;
            if (!Number.isFinite(price) || price <= 0) return;

            addOffer(property.id, {
              company: company.trim(),
              price,
              terms: terms.trim(),
            });

            // 再読み込み
            setProperty(getProperty(params.id) ?? null);

            // 入力クリア
            setCompany("");
            setPrice(0);
            setTerms("");
          }}
        >
          追加する
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h2>買取一覧</h2>

      <div style={{ marginBottom: 12 }}>
        並び替え：
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} style={{ marginLeft: 8 }}>
          <option value="high">金額が高い順</option>
          <option value="low">金額が安い順</option>
        </select>
      </div>

      {offersSorted.length === 0 ? (
        <p>まだ登録がありません。</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>会社名</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #444", padding: 8 }}>金額（円）</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>条件</th>
            </tr>
          </thead>
          <tbody>
            {offersSorted.map((o) => (
              <tr key={o.id}>
                <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{o.company}</td>
                <td style={{ borderBottom: "1px solid #222", padding: 8, textAlign: "right" }}>
                  {o.price.toLocaleString()}
                </td>
                <td style={{ borderBottom: "1px solid #222", padding: 8, whiteSpace: "pre-wrap" }}>
                  {o.terms || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
