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
 * Converts a storefront dollar amount into integer cents for the client cart.
 *
 * @param dollars The catalog price shown in dollars.
 * @returns The integer cent amount used by cart lines and checkout.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
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
