"use client";

import Link from "next/link";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import {
  deleteProperty,
  loadProperties,
  loadVendors,
  reorderProperties,
  type Property,
  type Vendor,
} from "@/lib/store";

function formatWithComma(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

function normalizeStoredPriceToManYen(
  price: number | null | undefined
): number | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;

  if (price >= 10_000_000) {
    return Math.round(price / 10000);
  }

  return price;
}

function SortablePropertyItem({
  property,
  topVendor,
  waitingCount,
  answeredCount,
  onDelete,
  vendors,
}: {
  property: Property;
  topVendor: { companyName: string; price: number } | null;
  waitingCount: number;
  answeredCount: number;
  onDelete: (propertyId: string) => void;
  vendors: Vendor[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--card)",
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flex: 1,
            minWidth: 0,
          }}
        >
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label="並び替え"
            style={{
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text)",
              borderRadius: 10,
              width: 36,
              height: 36,
              cursor: "grab",
              flexShrink: 0,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ≡
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {property.address}
            </div>

            {topVendor ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                最高額：{topVendor.companyName} / {formatWithComma(topVendor.price)}万円
              </div>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                最高額：未入力
              </div>
            )}

            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              返答待ち：{waitingCount}件
            </div>

            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 2,
                lineHeight: 1.5,
              }}
            >
              回答あり：{answeredCount}件
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href={`/property-detail?id=${property.id}`}
              className="ghostBtn"
              style={{
                textDecoration: "none",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                height: 38,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              詳細 / 金額入力
            </Link>

            <button
              type="button"
              onClick={() => onDelete(property.id)}
              className="ghostBtn"
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                cursor: "pointer",
                height: 38,
              }}
            >
              削除
          </button>
          </div>

          <button
            type="button"
            onClick={() => exportPropertyCsv(property, vendors)}
            className="ghostBtn"
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              cursor: "pointer",
              height: 34,
              fontSize: 13,
              width: "100%",
            }}
          >
            📥 CSV出力
          </button>
        </div>
      </div>
    </li>
  );
}

function toManYen(price: number | null | undefined): number | null {
  if (typeof price !== "number" || price <= 0) return null;
  return price >= 10_000_000 ? Math.round(price / 10000) : price;
}

function exportPropertyCsv(property: Property, vendors: Vendor[]) {
  const getVendorName = (id: string) =>
    vendors.find((v) => v.id === id)?.name ?? id;

  const rows: string[][] = [["業者名", "金額（万円）", "備考"]];

  const vendorRows = [...(property.vendorRows ?? [])].sort(
    (a, b) => (toManYen(b.price) ?? -1) - (toManYen(a.price) ?? -1)
  );

  for (const row of vendorRows) {
    const price = toManYen(row.price);
    rows.push([
      getVendorName(row.vendorId),
      price !== null ? new Intl.NumberFormat("ja-JP").format(price) : "未回答",
      (row as any).memo ?? "",
    ]);
  }

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${property.address}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const refresh = async () => {
    const [propertyList, vendorList] = await Promise.all([
      loadProperties(),
      loadVendors(),
    ]);
    setProperties(propertyList);
    setVendors(vendorList);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      const [propertyList, vendorList] = await Promise.all([
        loadProperties(),
        loadVendors(),
      ]);

      if (alive) {
        setProperties(propertyList);
        setVendors(vendorList);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const onDelete = async (propertyId: string) => {
    const ok = window.confirm("この物件を削除しますか？");
    if (!ok) return;

    await deleteProperty(propertyId);
    await refresh();
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name ?? "不明";
  };

  const getTopVendorInfo = (property: Property) => {
    const rows = property.vendorRows ?? [];

    const pricedRows = rows
      .map((row) => {
        const normalizedPrice = normalizeStoredPriceToManYen(row.price);
        return {
          ...row,
          normalizedPrice,
        };
      })
      .filter(
        (row) =>
          typeof row.normalizedPrice === "number" &&
          Number.isFinite(row.normalizedPrice) &&
          row.normalizedPrice > 0
      );

    if (pricedRows.length === 0) return null;

    pricedRows.sort(
      (a, b) => (b.normalizedPrice ?? 0) - (a.normalizedPrice ?? 0)
    );

    const top = pricedRows[0];

    return {
      companyName: getVendorName(top.vendorId),
      price: top.normalizedPrice ?? 0,
    };
  };

  const getWaitingCount = (property: Property) => {
    const rows = property.vendorRows ?? [];

    return rows.filter((row) => {
      const hasIntro = Boolean(row.introduced);
      const normalizedPrice = normalizeStoredPriceToManYen(row.price);
      const hasNoPrice = normalizedPrice === null;

      return hasIntro && hasNoPrice;
    }).length;
  };

  const getAnsweredCount = (property: Property) => {
    const rows = property.vendorRows ?? [];

    return rows.filter((row) => {
      const normalizedPrice = normalizeStoredPriceToManYen(row.price);
      return normalizedPrice !== null;
    }).length;
  };

  const filteredProperties = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return properties;

    return properties.filter((p) =>
      (p.address ?? "").toLowerCase().includes(keyword)
    );
  }, [properties, searchText]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    if (searchText.trim()) {
      alert("検索中は並び替えできません");
      return;
    }

    const oldIndex = properties.findIndex((item) => item.id === active.id);
    const newIndex = properties.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(properties, oldIndex, newIndex);
    setProperties(next);
    setSavingOrder(true);

    try {
      await reorderProperties(next.map((item) => item.id));
    } catch (error) {
      console.error("reorderProperties failed:", error);
      alert("並び順の保存に失敗しました");
      await refresh();
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <main className="container safeArea">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <h1 className="pageTitle">物件一覧</h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/" className="ghostBtn">
            トップ
          </Link>
          <Link href="/vendors" className="ghostBtn">
            業者登録
          </Link>
        </div>
      </div>

      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>登録済み物件</div>

          <Link href="/properties/new" className="primaryBtn">
            ＋ 新規物件を追加
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gap: 6,
            maxWidth: 520,
          }}
        >
          <label style={{ fontWeight: 700 }}>物件検索</label>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="物件名・住所で検索"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 15,
            }}
          />
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            左の「≡」をドラッグすると並び替えできます
            {savingOrder ? "（保存中...）" : ""}
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>読み込み中...</p>
      ) : filteredProperties.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          {searchText.trim()
            ? "検索条件に一致する物件がありません。"
            : "まだ物件が登録されていません。"}
        </p>
      ) : searchText.trim() ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 12,
          }}
        >
          {filteredProperties.map((p) => (
            <SortablePropertyItem
              key={p.id}
              property={p}
              topVendor={getTopVendorInfo(p)}
              waitingCount={getWaitingCount(p)}
              answeredCount={getAnsweredCount(p)}
              onDelete={onDelete}
              vendors={vendors}
            />
          ))}
        </ul>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={properties.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 12,
              }}
            >
              {properties.map((p) => (
                <SortablePropertyItem
                  key={p.id}
                  property={p}
                  topVendor={getTopVendorInfo(p)}
                  waitingCount={getWaitingCount(p)}
                  answeredCount={getAnsweredCount(p)}
                  onDelete={onDelete}
                  vendors={vendors}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </main>
  );
}