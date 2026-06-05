import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">管理者ページ</h1>

        <div className="pageHeaderActions">
          <Link href="/" className="ghostBtn">
            ← トップ
          </Link>
          <Link href="/properties" className="ghostBtn">
            物件一覧
          </Link>
        </div>
      </div>

      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <div
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 560,
        }}
      >
        <Link
          href="/admin/by-property"
          className="primaryBtn"
          style={{
            textDecoration: "none",
            textAlign: "center",
            padding: "16px 18px",
            borderRadius: 14,
            fontWeight: 800,
          }}
        >
          物件別の買取一覧
        </Link>

        <Link
          href="/admin/by-vendor"
          className="ghostBtn"
          style={{
            textDecoration: "none",
            textAlign: "center",
            padding: "16px 18px",
            borderRadius: 14,
            border: "1px solid var(--border)",
            fontWeight: 800,
          }}
        >
          会社別ページ
        </Link>
      </div>
    </main>
  );
}