// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>買取まとめ</h1>
      <p>不動産会社の買取金額を物件ごとに整理します。</p>
      <Link href="/properties">物件一覧へ</Link>
    </main>
  );
}
