"use client";

import { db } from "@/lib/firebase";
import { getUid } from "@/lib/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export type Vendor = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  types: string[];
  memo?: string;
  createdAtMs?: number;
  updatedAtMs?: number;
};

export type PropertyVendorRow = {
  vendorId: string;
  introduced: boolean;
  price: number | null;
  memo: string;
  favorite: boolean;
  updatedAtMs?: number;
};

export type Property = {
  id: string;
  address: string;
  vendorRows: PropertyVendorRow[];
  createdAtMs?: number;
  updatedAtMs?: number;
  sortOrder?: number;
};

export type AdminOfferRow = {
  id: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  vendorId: string;
  vendorName: string;
  vendorTypes: string[];
  price: number | null;
  memo: string;
  introduced: boolean;
  favorite: boolean;
  updatedAtMs: number;
};

type VendorInput = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  types: string[];
  memo?: string;
};

type PropertyVendorRowInput = {
  vendorId: string;
  introduced: boolean;
  price: number | null;
  memo: string;
  favorite: boolean;
};

function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}がタイムアウトしました`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function vendorsCol(uid: string) {
  return collection(db, "users", uid, "vendors");
}

function propertiesCol(uid: string) {
  return collection(db, "users", uid, "properties");
}

function adminOfferRowsCol() {
  return collection(db, "admin_offer_rows");
}

function normalizeVendor(raw: any, id: string): Vendor {
  return {
    id,
    name: typeof raw?.name === "string" ? raw.name : "",
    contactName: typeof raw?.contactName === "string" ? raw.contactName : "",
    phone: typeof raw?.phone === "string" ? raw.phone : "",
    email: typeof raw?.email === "string" ? raw.email : "",
    types: Array.isArray(raw?.types)
      ? raw.types.filter((x: unknown) => typeof x === "string")
      : [],
    memo: typeof raw?.memo === "string" ? raw.memo : "",
    createdAtMs:
      typeof raw?.createdAtMs === "number" ? raw.createdAtMs : 0,
    updatedAtMs:
      typeof raw?.updatedAtMs === "number" ? raw.updatedAtMs : 0,
  };
}

function normalizePropertyVendorRow(raw: any): PropertyVendorRow {
  return {
    vendorId: typeof raw?.vendorId === "string" ? raw.vendorId : "",
    introduced: Boolean(raw?.introduced),
    price:
      typeof raw?.price === "number" && Number.isFinite(raw.price)
        ? raw.price
        : null,
    memo: typeof raw?.memo === "string" ? raw.memo : "",
    favorite: Boolean(raw?.favorite),
    updatedAtMs:
      typeof raw?.updatedAtMs === "number" ? raw.updatedAtMs : 0,
  };
}

function normalizeProperty(raw: any, id: string): Property {
  return {
    id,
    address: typeof raw?.address === "string" ? raw.address : "",
    vendorRows: Array.isArray(raw?.vendorRows)
      ? raw.vendorRows.map(normalizePropertyVendorRow)
      : [],
    createdAtMs:
      typeof raw?.createdAtMs === "number" ? raw.createdAtMs : 0,
    updatedAtMs:
      typeof raw?.updatedAtMs === "number" ? raw.updatedAtMs : 0,
    sortOrder:
      typeof raw?.sortOrder === "number" ? raw.sortOrder : undefined,
  };
}

function normalizeAdminOfferRow(raw: any, id: string): AdminOfferRow {
  return {
    id,
    userId: typeof raw?.userId === "string" ? raw.userId : "",
    propertyId: typeof raw?.propertyId === "string" ? raw.propertyId : "",
    propertyName: typeof raw?.propertyName === "string" ? raw.propertyName : "",
    vendorId: typeof raw?.vendorId === "string" ? raw.vendorId : "",
    vendorName: typeof raw?.vendorName === "string" ? raw.vendorName : "",
    vendorTypes: Array.isArray(raw?.vendorTypes)
      ? raw.vendorTypes.filter((x: unknown) => typeof x === "string")
      : [],
    price:
      typeof raw?.price === "number" && Number.isFinite(raw.price)
        ? raw.price
        : null,
    memo: typeof raw?.memo === "string" ? raw.memo : "",
    introduced: Boolean(raw?.introduced),
    favorite: Boolean(raw?.favorite),
    updatedAtMs:
      typeof raw?.updatedAtMs === "number" ? raw.updatedAtMs : 0,
  };
}
/* =========================
   Vendors
========================= */

export async function loadVendors(): Promise<Vendor[]> {
  const uid = await getUid();

  const snap = await withTimeout(
    getDocs(vendorsCol(uid)),
    "業者一覧の読み込み"
  );

  const list = snap.docs.map((d) => normalizeVendor(d.data(), d.id));

  return list.sort(
    (a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0)
  );
}

export async function addVendor(input: VendorInput): Promise<string> {
  const uid = await getUid();
  const ref = doc(vendorsCol(uid));
  const now = Date.now();

  await withTimeout(
    setDoc(ref, {
      name: input.name ?? "",
      contactName: input.contactName ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      types: input.types ?? [],
      memo: input.memo ?? "",
      createdAtMs: now,
      updatedAtMs: now,
    }),
    "業者登録"
  );

  return ref.id;
}

export async function updateVendor(
  vendorId: string,
  input: VendorInput
): Promise<void> {
  const uid = await getUid();

  await withTimeout(
    updateDoc(doc(db, "users", uid, "vendors", vendorId), {
      name: input.name ?? "",
      contactName: input.contactName ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      types: input.types ?? [],
      memo: input.memo ?? "",
      updatedAtMs: Date.now(),
    }),
    "業者更新"
  );
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const uid = await getUid();

  await withTimeout(
    deleteDoc(doc(db, "users", uid, "vendors", vendorId)),
    "業者削除"
  );
}

/* =========================
   Properties
========================= */

export async function loadProperties(): Promise<Property[]> {
  const uid = await getUid();

  const snap = await withTimeout(
    getDocs(propertiesCol(uid)),
    "物件一覧の読み込み"
  );

  const list = snap.docs.map((d) => normalizeProperty(d.data(), d.id));

  return list.sort((a, b) => {
    const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : null;

    if (aOrder !== null && bOrder !== null) {
      return bOrder - aOrder;
    }

    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;

    return (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0);
  });
}

export async function addProperty(address: string): Promise<Property> {
  const uid = await getUid();
  const ref = doc(propertiesCol(uid));
  const now = Date.now();

  const property: Property = {
    id: ref.id,
    address: address.trim(),
    vendorRows: [],
    createdAtMs: now,
    updatedAtMs: now,
    sortOrder: now,
  };

  await withTimeout(
    setDoc(ref, {
      address: property.address,
      vendorRows: [],
      createdAtMs: now,
      updatedAtMs: now,
      sortOrder: now,
    }),
    "物件登録"
  );

  return property;
}

export async function getProperty(
  propertyId: string
): Promise<Property | null> {
  const uid = await getUid();
  const ref = doc(db, "users", uid, "properties", propertyId);

  const snap = await withTimeout(getDoc(ref), "物件詳細の読み込み");

  if (!snap.exists()) return null;

  return normalizeProperty(snap.data(), snap.id);
}

export async function deleteProperty(propertyId: string): Promise<void> {
  const uid = await getUid();

  await withTimeout(
    deleteDoc(doc(db, "users", uid, "properties", propertyId)),
    "物件削除"
  );
}

/* =========================
   Property Vendor Rows
========================= */

export async function upsertPropertyVendorRow(
  propertyId: string,
  input: PropertyVendorRowInput
): Promise<Property | null> {
  const uid = await getUid();
  const ref = doc(db, "users", uid, "properties", propertyId);

  const snap = await withTimeout(getDoc(ref), "物件詳細の読み込み");
  if (!snap.exists()) return null;

  const current = normalizeProperty(snap.data(), snap.id);
  const now = Date.now();

  const nextRow: PropertyVendorRow = {
    vendorId: input.vendorId,
    introduced: Boolean(input.introduced),
    price:
      typeof input.price === "number" && Number.isFinite(input.price)
        ? input.price
        : null,
    memo: input.memo ?? "",
    favorite: Boolean(input.favorite),
    updatedAtMs: now,
  };

  const nextVendorRows = [...(current.vendorRows ?? [])];
  const index = nextVendorRows.findIndex(
    (row) => row.vendorId === input.vendorId
  );

  if (index >= 0) {
    nextVendorRows[index] = {
      ...nextVendorRows[index],
      ...nextRow,
    };
  } else {
    nextVendorRows.push(nextRow);
  }

  await withTimeout(
    setDoc(
      ref,
      {
        vendorRows: nextVendorRows,
        updatedAtMs: now,
      },
      { merge: true }
    ),
    "物件ごとの業者情報保存"
  );

  const vendorSnap = await getDoc(doc(db, "users", uid, "vendors", input.vendorId));
const vendorData = vendorSnap.exists() ? vendorSnap.data() : null;

const adminRowId = `${uid}_${propertyId}_${input.vendorId}`;

await withTimeout(
  setDoc(
    doc(db, "admin_offer_rows", adminRowId),
    {
      userId: uid,
      propertyId,
      propertyName: current.address,
      vendorId: input.vendorId,
      vendorName: typeof vendorData?.name === "string" ? vendorData.name : "",
      vendorTypes: Array.isArray(vendorData?.types) ? vendorData.types : [],
      price: nextRow.price,
      memo: nextRow.memo,
      introduced: nextRow.introduced,
      favorite: nextRow.favorite,
      updatedAtMs: now,
    },
    { merge: true }
  ),
  "管理者用買取一覧保存"
);

  return {
    ...current,
    vendorRows: nextVendorRows,
    updatedAtMs: now,
  };
}
export async function loadAdminOfferRows(): Promise<AdminOfferRow[]> {
  const snap = await withTimeout(
    getDocs(adminOfferRowsCol()),
    "管理者用買取一覧の読み込み"
  );

  const list = snap.docs.map((d) => normalizeAdminOfferRow(d.data(), d.id));

  return list.sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
}

export async function reorderProperties(propertyIds: string[]): Promise<void> {
  const uid = await getUid();
  const batch = writeBatch(db);

  propertyIds.forEach((propertyId, index) => {
    const order = propertyIds.length - index;
    batch.update(doc(db, "users", uid, "properties", propertyId), {
      sortOrder: order,
    });
  });

  await withTimeout(batch.commit(), "物件並び順の保存");
}