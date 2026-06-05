"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStatus } from "@/lib/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, loading } = useAdminStatus();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAdmin) {
      router.replace("/admin-login");
    }

    setReady(true);
  }, [isAdmin, loading, pathname, router]);

  if (loading || !ready) {
    return (
      <main className="container safeArea">
        <p>管理者確認中...</p>
        <Link href="/" className="ghostBtn">
          ← トップへ
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}