// src/lib/store.ts
export type Offer = {
  id: string;
  companyName: string;
  amount: number;
  conditions: string;
  createdAt: string;
};

export type Property = {
  id: string;
  address: string;
  offers: Offer[];
  createdAt: string;
};

const KEY = "kaitori-matome:properties";

function safeParse(json: string | null): Property[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadProperties(): Property[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

export function saveProperties(properties: Property[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(properties));
}

export function createId() {
  // Safari/古い環境でも落ちにくいように保険
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
