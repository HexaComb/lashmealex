export const CART_STORAGE_KEY = "lashmealex_cart_id";

export const CART_STATUSES = ["active", "converted", "abandoned"] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

export const ABANDONED_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const MAX_PENDING_ITEMS = 50;

export interface PendingCartItem {
  productId: string;
  quantity: number;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D+/g, "");
}

export function formatPhoneNumber(value: string): string {
  const digits = normalizePhone(value).slice(0, 11);
  const hasCountryCode = digits.length === 11 && digits.startsWith("1");
  const local = hasCountryCode ? digits.slice(1) : digits.slice(0, 10);
  const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 10)].filter(Boolean);

  if (hasCountryCode) {
    if (parts.length === 1) return `+1 (${parts[0]}`;
    if (parts.length === 2) return `+1 (${parts[0]}) ${parts[1]}`;
    return `+1 (${parts[0]}) ${parts[1]}${parts[2] ? `-${parts[2]}` : ""}`;
  }

  if (parts.length === 1) return `(${parts[0]}`;
  if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
  return `(${parts[0]}) ${parts[1]}${parts[2] ? `-${parts[2]}` : ""}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length === 10 || digits.length === 11;
}
