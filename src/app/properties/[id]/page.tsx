"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createId, loadProperties, saveProperties, Property } from "@/lib/store";

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [amount, setAmount] = useState("");
  const [conditions, setConditions] = useState("");
  const [sort, setSort] = useState<"high" | "new">("high");

  useEffect(() => {
    const props = loadProperties();
    const found = props.find((p) => p.id === id) ?? null;
    setProperty(found);
  }, [id]);

  const sortedOffers = useMemo(() => {
    if (!property) return [];
    const offers = [...property.offers];
    if (sort === "high") {
      offers.sort((a, b) => b.amount - a.amount);
    } else {
      offers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return offers;
  }, [property, sort]);

  function addOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;

    const cn = companyName.trim();
    const am = Number(amount);
    if (!cn || !Number.isFinite(am)) return;

    const props = loadProperties();
    const idx = props.findIndex((p) => p.id === property.id);
    if (idx === -1) return;

    props[idx].offers.unshift({
      id: createId(),
      companyName: cn,
      amount: am,
      conditions: conditions.trim(),
      createdAt: new Date().toISOString(),
    });

    saveProperties(props);
    setProperty(props[idx]);

    setCompanyName("");
    setAmount("");
    setConditions("");
  }

  if (!property) {
    return (
      <main style={{ padding: 24 }}>
        <p>物件が見つかりませんでした。</p>
        <button onClick={() => router.push("/properties")}>物件一覧へ戻る</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <button onClick={() => router.push("/properties")}>← 物件一覧へ</button>
      <h1 style={{ marginTop: 12 }}>{property.address}</h1>

      <section style={{ marginTop: 18, padding: 12, border: "1px solid #333", borderRadius: 8 }}>
        <h2>会社の買取情報を追加</h2>
        <form onSubmit={addOffer} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label>
            会社名
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>

          <label>
            買取金額（万円などルールは後で統一）
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              style={{ width: "100%", padding: 8, marginTop: 6 }}
              placeholder="例：5480"
            />
          </label>

          <label>
            条件（例：手付/引渡し時期/瑕疵免責など）
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6, minHeight: 80 }}
            />
          </label>

          <button type="submit" style={{ padding: 10 }}>
            追加する
          </button>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>買取一覧</h2>

        <div style={{ margin: "8px 0" }}>
          並び替え：
          <button onClick={() => setSort("high")} disabled={sort === "high"} style={{ marginLeft: 8 }}>
            金額が高い順
          </button>
          <button onClick={() => setSort("new")} disabled={sort === "new"} style={{ marginLeft: 8 }}>
            新しい順
          </button>
        </div>

        {sortedOffers.length === 0 ? (
          <p>まだ買取情報がありません。</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #333", padding: 8 }}>会社名</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #333", padding: 8 }}>金額</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #333", padding: 8 }}>条件</th>
              </tr>
            </thead>
            <tbody>
              {sortedOffers.map((o) => (
                <tr key={o.id}>
                  <td style={{ borderBottom: "1px solid #222", padding: 8 }}>{o.companyName}</td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8, textAlign: "right" }}>
                    {o.amount.toLocaleString()}
                  </td>
                  <td style={{ borderBottom: "1px solid #222", padding: 8, whiteSpace: "pre-wrap" }}>
                    {o.conditions || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
