export const CART_STATUSES = ["active", "converted", "abandoned"] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

export const ABANDONED_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D+/g, "");
}

export function isValidCartStatus(status: string): status is CartStatus {
  return (CART_STATUSES as readonly string[]).includes(status);
}
