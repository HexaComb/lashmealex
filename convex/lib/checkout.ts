export type CheckoutLine = {
  productId: string;
  quantity: number;
  unitAmount: number;
};

export function checkoutLinesTotal(lines: CheckoutLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
}

function lineKey(line: CheckoutLine): string {
  return `${line.productId}:${line.quantity}:${line.unitAmount}`;
}

export function checkoutLinesEqual(left: CheckoutLine[], right: CheckoutLine[]): boolean {
  if (left.length !== right.length) return false;
  const a = left.map(lineKey).sort();
  const b = right.map(lineKey).sort();
  return a.every((key, index) => key === b[index]);
}

export const PAID_FAILURE_OUTCOMES = [
  "missing_cart_id",
  "cart_not_found",
  "snapshot_not_found",
  "amount_mismatch",
  "line_mismatch",
  "inventory_unavailable",
  "product_missing",
] as const;

export type PaidFailureOutcome = (typeof PAID_FAILURE_OUTCOMES)[number];

export function isPaidFailureOutcome(outcome: string): outcome is PaidFailureOutcome {
  return (PAID_FAILURE_OUTCOMES as readonly string[]).includes(outcome);
}
