import { expect, test } from "vitest";

import {
  ORDER_FULFILLMENT_STATUSES,
  isOrderFulfillmentStatus,
  orderFulfillmentCopy,
} from "./order-status";

test("accepts only customer-facing fulfillment states with matching copy", () => {
  for (const status of ORDER_FULFILLMENT_STATUSES) {
    expect(isOrderFulfillmentStatus(status)).toBe(true);
    expect(orderFulfillmentCopy[status].label).not.toBe("");
    expect(orderFulfillmentCopy[status].description).not.toBe("");
  }
  expect(isOrderFulfillmentStatus("fulfilled")).toBe(false);
  expect(isOrderFulfillmentStatus("cancelled")).toBe(false);
});
