"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addOffer, getProperty, type Property } from "@/lib/store";

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

      <h1 style={{ marginTop: 8 }}>{property.address}</h1>

      <hr style={{ margin: "16px 0" }} />

      <h2>買取情報を追加</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="会社名"
          style={{ padding: 8 }}
        />
        <input
          value={Number.isFinite(price) ? price : 0}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="買取金額（円）"
          type="number"
          style={{ padding: 8 }}
        />
        <input
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="条件（例：現況渡し、測量なし等）"
          style={{ padding: 8 }}
        />

        <button
          style={{ padding: "8px 12px" }}
          onClick={() => {
            if (!company.trim()) return;
            if (!price || price <= 0) return;

            addOffer(property.id, { company, price, terms });
            setProperty(getProperty(property.id) ?? null);

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

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>並び替え：</span>
        <button onClick={() => setSort("high")}>金額が高い順</button>
        <button onClick={() => setSort("low")}>金額が低い順</button>
      </div>

      {offersSorted.length === 0 ? (
        <p style={{ marginTop: 12 }}>まだ買取情報がありません。</p>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {offersSorted.map((o) => (
            <li key={o.id} style={{ marginBottom: 8 }}>
              <b>{o.company}</b>：{o.price.toLocaleString()}円
              {o.terms ? `（${o.terms}）` : ""}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
