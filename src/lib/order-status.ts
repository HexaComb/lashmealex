export const ORDER_FULFILLMENT_STATUSES = [
  "received",
  "working_on_it",
  "ready_for_pickup",
  "picked_up",
] as const;

export type OrderFulfillmentStatus = (typeof ORDER_FULFILLMENT_STATUSES)[number];

export const orderFulfillmentCopy: Record<OrderFulfillmentStatus, { label: string; description: string }> = {
  received: {
    label: "Received",
    description: "Your order is confirmed and queued for preparation.",
  },
  working_on_it: {
    label: "Working on it",
    description: "Your order is being prepared by the Lashmealex team.",
  },
  ready_for_pickup: {
    label: "Ready for pickup",
    description: "Your order is ready at the Fresno salon.",
  },
  picked_up: {
    label: "Picked up",
    description: "Your order has been collected. Thank you for shopping Lashmealex.",
  },
};

export function isOrderFulfillmentStatus(value: string): value is OrderFulfillmentStatus {
  return ORDER_FULFILLMENT_STATUSES.includes(value as OrderFulfillmentStatus);
}
