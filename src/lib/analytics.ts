import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
  ANALYTICS_EVENT_NAME,
} from "./brand-keys";
import {
  createAnonymousTransactionId,
  isGaConfigured,
  sendGaEvent,
} from "./ga";
import { readAndMigrateStorage } from "./migrate-local-storage";
import { centsToDollars } from "./money";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return (
    readAndMigrateStorage(
      window.localStorage,
      ANALYTICS_CONSENT_STORAGE_KEY,
      ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
    ) === "granted"
  );
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function storefrontAmountToGaValue(amount: unknown): number | undefined {
  const value = asFiniteNumber(amount);
  if (value === undefined) return undefined;
  return Number(value.toFixed(2));
}

function centsAmountToGaValue(amount: unknown): number | undefined {
  const cents = asFiniteNumber(amount);
  if (cents === undefined) return undefined;
  return Number(centsToDollars(cents).toFixed(2));
}

function itemParams(itemId: string, itemName: string, price: number, quantity: number) {
  return {
    item_id: itemId,
    item_name: itemName,
    price,
    quantity,
  };
}

export function toGaEvent(
  name: string,
  data?: Record<string, unknown>,
): { name: string; params: Record<string, unknown> } | null {
  switch (name) {
    case "product_viewed": {
      const itemId = asString(data?.productId);
      const itemName = asString(data?.productName);
      const price = storefrontAmountToGaValue(data?.priceCents);
      if (!itemId || !itemName || price === undefined) return null;
      return {
        name: "view_item",
        params: {
          currency: "USD",
          value: price,
          items: [itemParams(itemId, itemName, price, 1)],
        },
      };
    }
    case "add_to_cart": {
      const itemId = asString(data?.productId);
      const itemName = asString(data?.productName);
      const price = storefrontAmountToGaValue(data?.priceCents);
      const quantity = asFiniteNumber(data?.quantity) ?? 1;
      if (!itemId || !itemName || price === undefined) return null;
      return {
        name: "add_to_cart",
        params: {
          currency: "USD",
          value: Number((price * quantity).toFixed(2)),
          items: [itemParams(itemId, itemName, price, quantity)],
        },
      };
    }
    case "checkout_initiated": {
      const value = centsAmountToGaValue(data?.subtotalCents);
      const params: Record<string, unknown> = { currency: "USD" };
      if (value !== undefined) params.value = value;
      return { name: "begin_checkout", params };
    }
    case "purchase_complete": {
      return {
        name: "purchase",
        params: {
          currency: "USD",
          transaction_id: createAnonymousTransactionId(),
        },
      };
    }
    default:
      return null;
  }
}

function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  try {
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: { name, data } }));
  } catch {
    // Never let analytics errors surface to users
  }

  if (!isGaConfigured()) return;
  try {
    const gaEvent = toGaEvent(name, data);
    if (!gaEvent) return;
    sendGaEvent(gaEvent.name, gaEvent.params);
  } catch {
    // Never let analytics errors surface to users
  }
}

export const analytics = {
  /** Fired on initial mount of a product detail page. */
  productViewed(productId: string, productName: string, priceCents: number) {
    trackEvent("product_viewed", { productId, productName, priceCents });
  },

  /** Fired when the user picks a different variant. */
  variantSelected(variantId: string, variantName: string, priceCents: number) {
    trackEvent("variant_selected", { variantId, variantName, priceCents });
  },

  /** Fired when an item lands in the cart. */
  addToCart(productId: string, productName: string, priceCents: number, quantity: number) {
    trackEvent("add_to_cart", { productId, productName, priceCents, quantity });
  },

  /** Fired after identity submission; PII never leaves the form boundary. */
  cartIdentitySubmitted() {
    trackEvent("cart_identity_submitted");
  },

  /** Fired when the user clicks "Checkout Now". */
  checkoutInitiated(subtotalCents: number, itemCount: number) {
    trackEvent("checkout_initiated", { subtotalCents, itemCount });
  },

  /** Fired on the /checkout/success page. */
  purchaseComplete() {
    trackEvent("purchase_complete");
  },
};
