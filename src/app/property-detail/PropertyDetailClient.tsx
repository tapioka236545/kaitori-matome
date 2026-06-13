"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  getProperty,
  loadVendors,
  upsertPropertyVendorRow,
  type Property,
  type Vendor,
} from "@/lib/store";

const TYPE_FILTERS = [
  "マンション",
  "建売",
  "中古戸建",
  "土地",
  "収益用地",
  "一棟レジ・アパート",
  "立ち退き",
  "借地底地",
  "リースバック",
  "オーナーチェンジ",
  "再建築不可",
  "その他",
] as const;

type TypeFilter = "all" | (typeof TYPE_FILTERS)[number];
type SortMode = "name" | "high" | "low" | "favorite";
type FilterMode = "all" | "introduced" | "unanswered";
type SaveState = "idle" | "saving" | "saved" | "error";

type RowForm = {
  introduced: boolean;
  called: boolean;
  priceText: string;
  memo: string;
  favorite: boolean;
};

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 7);
}

function formatWithComma(value: string) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  return Number(digits).toLocaleString("ja-JP");
}

function parseManYen(value: string): number | null {
  const digits = digitsOnly(value);
  if (!digits) return null;

  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
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

function createEmptyRowForm(): RowForm {
  return {
    introduced: false,
    called: false,
    priceText: "",
    memo: "",
    favorite: false,
  };
}

function makeFormSignature(form: RowForm) {
  return JSON.stringify({
    introduced: form.introduced,
    called: form.called,
    priceText: digitsOnly(form.priceText),
    memo: form.memo,
    favorite: form.favorite,
  });
}

function sortButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    cursor: "pointer",
    background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
    fontWeight: 700,
  };
}

export default function PropertyDetailClient({
  propertyId,
}: {
  propertyId: string;
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [forms, setForms] = useState<Record<string, RowForm>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [loading, setLoading] = useState(true);

  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedType, setSelectedType] = useState<TypeFilter>("all");

  const lastSavedRef = useRef<Record<string, string>>({});
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const savedBadgeTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [propertyData, vendorList] = await Promise.all([
          propertyId ? getProperty(propertyId) : Promise.resolve(null),
          loadVendors(),
        ]);

        if (!alive) return;

        setProperty(propertyData);
        setVendors(vendorList);

        const nextForms: Record<string, RowForm> = {};
        const nextSaved: Record<string, string> = {};

        for (const vendor of vendorList) {
          const row = propertyData?.vendorRows?.find(
            (r) => r.vendorId === vendor.id
          );
          const normalizedPrice = normalizeStoredPriceToManYen(row?.price);

          const form: RowForm = {
            introduced: Boolean(row?.introduced),
            called: Boolean(row?.called),
            priceText:
              normalizedPrice !== null
                ? normalizedPrice.toLocaleString("ja-JP")
                : "",
            memo: row?.memo ?? "",
            favorite: Boolean(row?.favorite),
          };

          nextForms[vendor.id] = form;
          nextSaved[vendor.id] = makeFormSignature(form);
        }

        setForms(nextForms);
        lastSavedRef.current = nextSaved;
        setSaveStates({});
      } catch (error) {
        console.error("property detail load failed:", error);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;

      Object.values(debounceTimersRef.current).forEach(clearTimeout);
      Object.values(savedBadgeTimersRef.current).forEach(clearTimeout);
      debounceTimersRef.current = {};
      savedBadgeTimersRef.current = {};
    };
  }, [propertyId]);

  const showSavedOnce = (vendorId: string) => {
    setSaveStates((prev) => ({
      ...prev,
      [vendorId]: "saved",
    }));

    if (savedBadgeTimersRef.current[vendorId]) {
      clearTimeout(savedBadgeTimersRef.current[vendorId]);
    }

    savedBadgeTimersRef.current[vendorId] = setTimeout(() => {
      setSaveStates((prev) => ({
        ...prev,
        [vendorId]: "idle",
      }));
    }, 1500);
  };

  const performSave = async (vendorId: string, nextForm: RowForm) => {
    if (!propertyId) return;

    const nextSignature = makeFormSignature(nextForm);
    const currentSavedSignature =
      lastSavedRef.current[vendorId] ?? makeFormSignature(createEmptyRowForm());

    if (nextSignature === currentSavedSignature) {
      showSavedOnce(vendorId);
      return;
    }

    setSaveStates((prev) => ({
      ...prev,
      [vendorId]: "saving",
    }));

    try {
      const nextProperty = await upsertPropertyVendorRow(propertyId, {
        vendorId,
        introduced: nextForm.introduced,
        called: nextForm.called,
        price: parseManYen(nextForm.priceText),
        memo: nextForm.memo,
        favorite: nextForm.favorite,
      });

      if (nextProperty) {
        setProperty(nextProperty);
      }

      lastSavedRef.current[vendorId] = nextSignature;
      showSavedOnce(vendorId);
    } catch (error) {
      console.error("auto save failed:", error);

      setSaveStates((prev) => ({
        ...prev,
        [vendorId]: "error",
      }));
    }
  };

  const scheduleSave = (vendorId: string, nextForm: RowForm, delay = 1000) => {
    if (debounceTimersRef.current[vendorId]) {
      clearTimeout(debounceTimersRef.current[vendorId]);
    }

    debounceTimersRef.current[vendorId] = setTimeout(() => {
      void performSave(vendorId, nextForm);
    }, delay);
  };

  const updateVendorForm = (
    vendorId: string,
    patch: Partial<RowForm>,
    mode: "immediate" | "debounced"
  ) => {
    const base = forms[vendorId] ?? createEmptyRowForm();
    const nextForm: RowForm = {
      ...base,
      ...patch,
    };

    setForms((prev) => ({
      ...prev,
      [vendorId]: nextForm,
    }));

    if (mode === "immediate") {
      if (debounceTimersRef.current[vendorId]) {
        clearTimeout(debounceTimersRef.current[vendorId]);
      }
      void performSave(vendorId, nextForm);
      return;
    }

    scheduleSave(vendorId, nextForm, 1000);
  };

  const introducedCount = useMemo(() => {
    return vendors.filter((vendor) => {
      const form = forms[vendor.id] ?? createEmptyRowForm();
      return form.introduced;
    }).length;
  }, [vendors, forms]);

  const unansweredCount = useMemo(() => {
    return vendors.filter((vendor) => {
      const form = forms[vendor.id] ?? createEmptyRowForm();
      const price = parseManYen(form.priceText);
      return form.introduced && price === null;
    }).length;
  }, [vendors, forms]);

  const displayedVendors = useMemo(() => {
    let list = [...vendors];

    if (selectedType !== "all") {
      list = list.filter((vendor) => (vendor.types ?? []).includes(selectedType));
    }

    if (filterMode === "introduced") {
      list = list.filter((vendor) => {
        const form = forms[vendor.id] ?? createEmptyRowForm();
        return form.introduced;
      });
    }

    if (filterMode === "unanswered") {
      list = list.filter((vendor) => {
        const form = forms[vendor.id] ?? createEmptyRowForm();
        const price = parseManYen(form.priceText);
        return form.introduced && price === null;
      });
    }

    list.sort((a, b) => {
      const aForm = forms[a.id] ?? createEmptyRowForm();
      const bForm = forms[b.id] ?? createEmptyRowForm();

      const aName = a.name?.trim() || "名称未入力";
      const bName = b.name?.trim() || "名称未入力";

      const aPrice = parseManYen(aForm.priceText);
      const bPrice = parseManYen(bForm.priceText);

      if (sortMode === "high") {
        return (bPrice ?? -1) - (aPrice ?? -1);
      }

      if (sortMode === "low") {
        const aValue = aPrice ?? Number.MAX_SAFE_INTEGER;
        const bValue = bPrice ?? Number.MAX_SAFE_INTEGER;
        return aValue - bValue;
      }

      if (sortMode === "favorite") {
        if (aForm.favorite !== bForm.favorite) {
          return aForm.favorite ? -1 : 1;
        }
        return aName.localeCompare(bName, "ja");
      }

      return aName.localeCompare(bName, "ja");
    });

    return list;
  }, [vendors, forms, sortMode, filterMode, selectedType]);

  if (loading) {
    return (
      <main className="container safeArea">
        <p>読み込み中...</p>
      </main>
    );
  }

  if (!propertyId || !property) {
    return (
      <main className="container safeArea">
        <div className="pageHeader">
          <h1 className="pageTitle">物件詳細</h1>
          <div className="pageHeaderActions">
            <Link href="/properties" className="ghostBtn">
              ← 物件一覧
            </Link>
            <Link href="/" className="ghostBtn">
              トップ
            </Link>
          </div>
        </div>

        <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />
        <p>物件が見つかりません。</p>
      </main>
    );
  }

  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">物件詳細</h1>

        <div className="pageHeaderActions">
          <Link href="/properties" className="ghostBtn">
            ← 物件一覧
          </Link>
          <Link href="/vendors" className="ghostBtn">
            業者登録
          </Link>
        </div>
      </div>

      <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--card)",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--muted)" }}>物件名</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
          {property.address}
        </div>
      </section>

      {vendors.length === 0 ? (
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            background: "var(--card)",
          }}
        >
          <p style={{ margin: 0 }}>先に業者登録をしてください。</p>
        </section>
      ) : (
        <>
          <section
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 14,
              background: "var(--card)",
              marginBottom: 14,
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setSortMode("name")}
                className="ghostBtn"
                style={sortButtonStyle(sortMode === "name")}
              >
                業者名順
              </button>

              <button
                type="button"
                onClick={() => setSortMode("high")}
                className="ghostBtn"
                style={sortButtonStyle(sortMode === "high")}
              >
                高い順
              </button>

              <button
                type="button"
                onClick={() => setSortMode("low")}
                className="ghostBtn"
                style={sortButtonStyle(sortMode === "low")}
              >
                安い順
              </button>

              <button
                type="button"
                onClick={() => setSortMode("favorite")}
                className="ghostBtn"
                style={sortButtonStyle(sortMode === "favorite")}
              >
                ⭐️
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="ghostBtn"
                style={sortButtonStyle(filterMode === "all")}
              >
                すべて
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("introduced")}
                className="ghostBtn"
                style={sortButtonStyle(filterMode === "introduced")}
              >
                紹介済み
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("unanswered")}
                className="ghostBtn"
                style={sortButtonStyle(filterMode === "unanswered")}
              >
                未回答
              </button>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginLeft: 4,
                }}
              >
                紹介済み {introducedCount}件 / 未回答 {unansweredCount}件
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className="ghostBtn"
                style={sortButtonStyle(selectedType === "all")}
              >
                種別すべて
              </button>

              {TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className="ghostBtn"
                  style={sortButtonStyle(selectedType === type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {displayedVendors.length === 0 ? (
            <section
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
                background: "var(--card)",
              }}
            >
              <p style={{ margin: 0 }}>
                {filterMode === "unanswered"
                  ? "未回答の業者はありません。"
                  : filterMode === "introduced"
                  ? "紹介済みの業者はありません。"
                  : selectedType !== "all"
                  ? "選択した種別に該当する業者はありません。"
                  : "表示できる業者がありません。"}
              </p>
            </section>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {displayedVendors.map((vendor) => {
                const form = forms[vendor.id] ?? createEmptyRowForm();
                const saveState = saveStates[vendor.id] ?? "idle";

                return (
                  <section
                    key={vendor.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 16,
                      background: "var(--card)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>
                          {vendor.name?.trim() || "名称未入力"}
                        </div>

                        <details style={{ marginTop: 8 }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              color: "var(--muted)",
                              fontSize: 12,
                            }}
                          >
                            担当者・TEL・MAILを表示
                          </summary>

                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              color: "var(--muted)",
                              lineHeight: 1.8,
                            }}
                          >
                            種別：
                            {(vendor.types ?? []).length > 0
                              ? vendor.types.join(" / ")
                              : "未設定"}
                            <br />
                            担当者：
                            {vendor.contactName?.trim()
                              ? vendor.contactName
                              : "未入力"}
                            <br />
                            TEL：
                            {vendor.phone?.trim() ? vendor.phone : "未入力"}
                            <br />
                            MAIL：
                            {vendor.email?.trim() ? vendor.email : "未入力"}
                          </div>
                        </details>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 18,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginTop: 14,
                      }}
                    >
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.introduced}
                          onChange={(e) =>
                            updateVendorForm(
                              vendor.id,
                              { introduced: e.target.checked },
                              "immediate"
                            )
                          }
                        />
                        紹介
                      </label>

                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.called}
                          onChange={(e) =>
                            updateVendorForm(
                              vendor.id,
                              { called: e.target.checked },
                              "immediate"
                            )
                          }
                        />
                        📞
                      </label>

                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.favorite}
                          onChange={(e) =>
                            updateVendorForm(
                              vendor.id,
                              { favorite: e.target.checked },
                              "immediate"
                            )
                          }
                        />
                        ⭐️ お気に入り
                      </label>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      <label style={{ display: "grid", gap: 6 }}>
                        金額（万円）
                        <input
                          inputMode="numeric"
                          value={form.priceText}
                          onChange={(e) =>
                            updateVendorForm(
                              vendor.id,
                              {
                                priceText: formatWithComma(e.target.value),
                              },
                              "debounced"
                            )
                          }
                          placeholder="例）100,000"
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "var(--text)",
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        備考
                        <input
                          value={form.memo}
                          onChange={(e) =>
                            updateVendorForm(
                              vendor.id,
                              { memo: e.target.value },
                              "debounced"
                            )
                          }
                          placeholder="例）即決可 / 指値あり など"
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "var(--text)",
                          }}
                        />
                      </label>

                      <div
                        style={{
                          minHeight: 18,
                          fontSize: 12,
                          color:
                            saveState === "error"
                              ? "#ff8a8a"
                              : "var(--muted)",
                        }}
                      >
                        {saveState === "saving"
                          ? "保存中..."
                          : saveState === "saved"
                          ? "保存済み"
                          : saveState === "error"
                          ? "保存に失敗しました"
                          : ""}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}