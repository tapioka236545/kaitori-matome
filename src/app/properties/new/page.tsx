"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createId, loadProperties, saveProperties } from "@/lib/store";

export default function NewPropertyPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;

    const props = loadProperties();
    props.unshift({
      id: createId(),
      address: trimmed,
      offers: [],
      createdAt: new Date().toISOString(),
    });
    saveProperties(props);
    router.push("/properties");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>物件を登録</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>
          住所（マンションの場合はマンション名）
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例：東京都港区〜 / ○○マンション"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <button type="submit" style={{ padding: 10 }}>
          登録する
        </button>

        <button type="button" onClick={() => router.back()} style={{ padding: 10 }}>
          戻る
        </button>
      </form>
    </main>
  );
}
