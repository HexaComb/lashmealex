import "server-only";

/**
 * Returns the shared secret used to authorize admin Convex mutations.
 */
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("ADMIN_INTERNAL_SECRET is not configured");
  }
  return secret;
}

/**
 * Converts a Convex millisecond timestamp to a Date for display.
 */
export function timestampToDate(value: number | null | undefined): Date | null {
  if (value == null) return null;
  return new Date(value);
}
