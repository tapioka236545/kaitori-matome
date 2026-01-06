"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProperties, type Property } from "@/lib/store";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>物件一覧</h1>

      {properties.length === 0 ? (
        <p>まだ物件がありません。</p>
      ) : (
        <ul>
          {properties.map((p) => (
            <li key={p.id}>
              <Link href={`/properties/${p.id}`}>{p.address}</Link>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/properties/new">＋ 新規物件を追加</Link>
      </p>
    </main>
  );
}
