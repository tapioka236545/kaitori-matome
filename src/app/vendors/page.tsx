"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addVendor,
  deleteVendor,
  loadVendors,
  updateVendor,
  type Vendor,
} from "@/lib/store";

const VENDOR_TYPES = [
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

type VendorType = (typeof VENDOR_TYPES)[number];
type StatusType = "idle" | "saving" | "error";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState<VendorType[]>([]);
  const [memo, setMemo] = useState("");

  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await loadVendors();
        if (alive) setVendors(list);
      } catch (error) {
        console.error("loadVendors failed:", error);
        if (alive) {
          setStatus("error");
          setStatusMessage("業者一覧の読み込みに失敗しました");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleCardScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError("");
    setScanning(true);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch("/api/parse-card", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "解析に失敗しました");
      }

      const data = await res.json();
      if (data.name) setName(data.name);
      if (data.contactName) setContactName(data.contactName);
      if (data.phone) setPhone(data.phone);
      if (data.email) setEmail(data.email);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setTypes([]);
    setMemo("");
  };

  const refresh = async () => {
    const list = await loadVendors();
    setVendors(list);
    return list;
  };

  const handleRegister = async () => {
    if (saving) return;

    setSaving(true);
    setStatus("saving");
    setStatusMessage("保存中...");

    try {
      const input = {
        name: name.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        types,
        memo: memo.trim(),
      };

      if (editingId) {
        await updateVendor(editingId, input);
      } else {
        await addVendor(input);
      }

      await refresh();
      resetForm();

      setStatus("idle");
      setStatusMessage("");
    } catch (error) {
      console.error("handleRegister failed:", error);

      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました";

      setStatus("error");
      setStatusMessage(`保存に失敗しました: ${message}`);
      alert(`保存に失敗しました\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (v: Vendor) => {
    setEditingId(v.id);
    setName(v.name ?? "");
    setContactName(v.contactName ?? "");
    setPhone(v.phone ?? "");
    setEmail(v.email ?? "");
    setTypes(Array.isArray(v.types) ? (v.types as VendorType[]) : []);
    setMemo((v as any).memo ?? "");
    setStatus("idle");
    setStatusMessage("");
  };

  const onDelete = async (vendorId: string) => {
    const ok = window.confirm("この業者を削除しますか？");
    if (!ok) return;

    try {
      await deleteVendor(vendorId);
      await refresh();
    } catch (error) {
      console.error("deleteVendor failed:", error);
      alert("削除に失敗しました");
    }
  };

  return (
    <main className="container safeArea">
      <div className="pageHeader">
        <h1 className="pageTitle">業者登録</h1>

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

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--card)",
          maxWidth: 520,
        }}
      >
        <h2 style={{ marginTop: 0 }}>{editingId ? "業者を編集" : "業者を追加"}</h2>

        {/* 名刺スキャン */}
        <div
          style={{
            marginBottom: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(74,163,255,0.08)",
            border: "1px solid rgba(74,163,255,0.25)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
            📷 名刺から自動入力
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--accent)",
              color: "#001018",
              fontWeight: 800,
              cursor: scanning ? "default" : "pointer",
              opacity: scanning ? 0.7 : 1,
              fontSize: 15,
            }}
          >
            {scanning ? "解析中..." : "名刺を撮影 / 選択"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCardScan}
              disabled={scanning}
            />
          </label>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            撮影後、各フィールドに自動入力されます。修正も可能です。
          </div>
          {scanError && (
            <div style={{ fontSize: 13, color: "#ff8a8a", marginTop: 6 }}>
              ⚠️ {scanError}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            会社名
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例）〇〇不動産"
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
            担当者
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="例）田中様"
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
            電話番号
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例）090-1234-5678"
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
            メールアドレス
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例）sample@example.com"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
              }}
            />
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>種別（複数選択可）</div>

            <div style={{ display: "grid", gap: 6 }}>
              {VENDOR_TYPES.map((t) => {
                const checked = types.includes(t);

                return (
                  <label
                    key={t}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setTypes((prev) =>
                          e.target.checked
                            ? [...prev, t]
                            : prev.filter((x) => x !== t)
                        );
                      }}
                    />
                    {t}
                  </label>
                );
              })}
            </div>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            備考
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例）レス早い / 指値強い など"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={handleRegister}
              disabled={saving}
              className="primaryBtn"
              style={{
                padding: "12px 16px",
                minWidth: 96,
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                touchAction: "manipulation",
                position: "relative",
                zIndex: 2,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "保存中..." : editingId ? "更新" : "登録"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="ghostBtn"
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
            )}
          </div>

          <div
            style={{
              minHeight: 22,
              marginTop: 2,
              fontSize: 13,
              color: status === "error" ? "#ff8a8a" : "var(--muted)",
            }}
          >
            {status === "saving" ? "保存中..." : status === "error" ? statusMessage : ""}
          </div>
        </div>
      </section>

      <h2 style={{ marginTop: 22 }}>登録済み業者</h2>

      {vendors.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>まだ業者が登録されていません。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {vendors.map((v) => (
            <li
              key={v.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 12,
                background: "var(--card)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800 }}>
                  {v.name?.trim() ? v.name : "名称未入力"}
                </div>

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                  担当者：{v.contactName?.trim() ? v.contactName : "未入力"}
                </div>

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  電話番号：{v.phone?.trim() ? v.phone : "未入力"}
                </div>

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  メール：{v.email?.trim() ? v.email : "未入力"}
                </div>

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  種別：
                  {(v.types ?? []).length > 0 ? (v.types ?? []).join(" / ") : "未設定"}
                  {(v as any).memo ? ` / 備考：${(v as any).memo}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => onEdit(v)}
                  className="ghostBtn"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    height: 34,
                  }}
                >
                  編集
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(v.id)}
                  className="ghostBtn"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    height: 34,
                  }}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}