import { Suspense } from "react";
import PropertyDetailSearchParamsClient from "./PropertyDetailSearchParamsClient";

export default function PropertyDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="container safeArea">
          <p>読み込み中...</p>
        </main>
      }
    >
      <PropertyDetailSearchParamsClient />
    </Suspense>
  );
}