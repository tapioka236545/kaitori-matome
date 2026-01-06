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

export function createId(): string {
  // Safariなどでも動くID生成
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadProperties(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Property[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveProperties(props: Property[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
}

export function addProperty(address: string): Property {
  const props = loadProperties();
  const p: Property = {
    id: createId(),
    address: address.trim(),
    createdAt: new Date().toISOString(),
    offers: [],
  };
  props.unshift(p);
  saveProperties(props);
  return p;
}

export function getProperty(id: string): Property | undefined {
  const props = loadProperties();
  return props.find((p) => p.id === id);
}

export function addOffer(propertyId: string, input: OfferInput): Offer {
  const props = loadProperties();
  const p = props.find((x) => x.id === propertyId);
  if (!p) throw new Error("Property not found");

  const offer: Offer = {
    id: createId(),
    createdAt: new Date().toISOString(),
    company: input.company.trim(),
    price: Number(input.price),
    terms: input.terms.trim(),
  };

  p.offers.unshift(offer);
  saveProperties(props);
  return offer;
}
