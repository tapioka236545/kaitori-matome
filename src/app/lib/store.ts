// src/app/lib/store.ts
export type OfferInput = {
  company: string;
  price: number; // 円で管理（例: 30000000）
  terms: string;
};

export type Offer = OfferInput & {
  id: string;
  createdAt: string;
};

export type Property = {
  id: string;
  address: string; // 住所 or マンション名
  createdAt: string;
  offers: Offer[];
};

const STORAGE_KEY = "kaitori-matome:v1";

function newId() {
  // Safariなどでも落ちにくいID生成
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readAll(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Property[];
  } catch {
    return [];
  }
}

function writeAll(properties: Property[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
}

export function getProperties(): Property[] {
  const props = readAll();

  // 初回だけサンプルを入れる（不要ならこのifブロックごと消してOK）
  if (props.length === 0) {
    const sample: Property[] = [
      {
        id: newId(),
        address: "サンプル：〇〇マンション 101",
        createdAt: new Date().toISOString(),
        offers: [
          {
            id: newId(),
            company: "A社",
            price: 30000000,
            terms: "現況渡し / 測量なし",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ];
    writeAll(sample);
    return sample;
  }

  return props;
}

export function getProperty(id: string): Property | undefined {
  return getProperties().find((p) => p.id === id);
}

export function addProperty(address: string): Property {
  const props = getProperties();
  const newProp: Property = {
    id: newId(),
    address,
    createdAt: new Date().toISOString(),
    offers: [],
  };
  const next = [newProp, ...props];
  writeAll(next);
  return newProp;
}

export function addOffer(propertyId: string, input: OfferInput): Offer | null {
  const props = getProperties();
  const idx = props.findIndex((p) => p.id === propertyId);
  if (idx === -1) return null;

  const offer: Offer = {
    id: newId(),
    createdAt: new Date().toISOString(),
    company: input.company,
    price: input.price,
    terms: input.terms,
  };

  const updated: Property = {
    ...props[idx],
    offers: [offer, ...props[idx].offers],
  };

  const next = props.slice();
  next[idx] = updated;
  writeAll(next);
  return offer;
}
