export default function PropertiesPage() {
  const properties = [
    { id: "p1", address: "〇〇マンション 101" },
    { id: "p2", address: "東京都中央区〇〇 1-2-3" },
  ];

  return (
    <main style={{ padding: 24 }}>
      <h1>物件一覧</h1>

      <ul>
        {properties.map((p) => (
          <li key={p.id}>
            <a href={`/properties/${p.id}`}>{p.address}</a>
          </li>
        ))}
      </ul>

      <p>
        <a href="/properties/new">＋ 新規物件を追加</a>
      </p>
    </main>
  );
}
