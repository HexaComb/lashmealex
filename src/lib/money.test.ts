import { expect, test } from "vitest";

import { centsToDollars, dollarsToCents, formatUsdFromCents } from "./money";

test("keeps storefront and reporting currency values in integer-cent precision", () => {
  expect(centsToDollars(1999)).toBe(19.99);
  expect(centsToDollars(1)).toBe(0.01);
  expect(dollarsToCents(18)).toBe(1800);
  expect(dollarsToCents(19.99)).toBe(1999);
  expect(formatUsdFromCents(1999)).toBe("$19.99");
  expect(formatUsdFromCents(0)).toBe("$0.00");
});
