"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addProperty } from "@/lib/store";

export default function NewPropertyPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  return (
    <main style={{ padding: 24 }}>
      <h1>新規物件を追加</h1>

      <label style={{ display: "block", marginTop: 12 }}>
        住所（マンションの場合はマンション名）
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例）〇〇マンション / 東京都〇〇区..."
          style={{ display: "block", width: "100%", marginTop: 8, padding: 8 }}
        />
      </label>

      <button
        style={{ marginTop: 16, padding: "8px 12px" }}
        onClick={() => {
          if (!address.trim()) return;
          const p = addProperty(address);
          router.push(`/properties/${p.id}`);
        }}
      >
        登録して次へ
      </button>
    </main>
  );
}
