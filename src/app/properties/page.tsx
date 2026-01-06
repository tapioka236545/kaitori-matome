"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProperties, Property } from "@/lib/store";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>物件一覧</h1>

      <div style={{ margin: "12px 0" }}>
        <Link href="/properties/new">＋ 物件を新規登録</Link>
      </div>

      {properties.length === 0 ? (
        <p>まだ物件がありません。上の「新規登録」から追加してください。</p>
      ) : (
        <ul>
          {properties.map((p) => (
            <li key={p.id} style={{ marginBottom: 8 }}>
              <Link href={`/properties/${p.id}`}>{p.address}</Link>
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                （{p.offers.length}件）
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
