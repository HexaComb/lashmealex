/**
 * Converts a stored cent amount into a storefront dollar number.
 *
 * @param cents The stored integer cent amount.
 * @returns The amount as a two-decimal storefront number.
 */
export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Formats a cent amount for owner-facing reporting surfaces.
 *
 * @param cents The stored integer cent amount.
 * @returns A USD currency string.
 */
export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
