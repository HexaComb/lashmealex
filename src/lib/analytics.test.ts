import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_STORAGE_KEY_LEGACY,
  ANALYTICS_EVENT_NAME,
} from "./brand-keys";

const MEASUREMENT_ID = "G-TEST1234";

type GtagFn = ((...args: unknown[]) => void) & { calls: unknown[][] };

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key]! : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    clear: () => {
      for (const key of Object.keys(data)) delete data[key];
    },
  };
}

function installAnalyticsWindow(storage: ReturnType<typeof memoryStorage>) {
  const customEvents: CustomEvent[] = [];
  const gtagCalls: unknown[][] = [];
  const gtag: GtagFn = Object.assign(
    (...args: unknown[]) => {
      gtagCalls.push(args);
    },
    { calls: gtagCalls },
  );

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  window.dispatchEvent = (event: Event) => {
    if (event instanceof CustomEvent) customEvents.push(event);
    return true;
  };
  window.dataLayer = [];
  window.gtag = gtag;
  window.__ccGaConsentDefaulted = false;
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`];
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "https://store.example.com" },
  });

  return { customEvents, gtag };
}

async function loadAnalytics() {
  return import("./analytics");
}

async function loadGa() {
  return import("./ga");
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  installAnalyticsWindow(memoryStorage());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("does not dispatch CustomEvent or gtag before analytics consent", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(memoryStorage());
  const { analytics } = await loadAnalytics();

  analytics.productViewed("sku_1", "Classic Lash", 19.99);

  expect(customEvents).toEqual([]);
  expect(gtag.calls).toEqual([]);
});

test("does not send events when consent is denied", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "denied" }),
  );
  const { analytics } = await loadAnalytics();

  analytics.addToCart("sku_1", "Classic Lash", 19.99, 2);

  expect(customEvents).toEqual([]);
  expect(gtag.calls).toEqual([]);
});

test("keeps CustomEvent dispatch and maps view_item after consent", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const { analytics } = await loadAnalytics();

  analytics.productViewed("sku_1", "Classic Lash", 19.99);

  expect(customEvents).toHaveLength(1);
  expect(customEvents[0]?.type).toBe(ANALYTICS_EVENT_NAME);
  expect(customEvents[0]?.detail).toEqual({
    name: "product_viewed",
    data: { productId: "sku_1", productName: "Classic Lash", priceCents: 19.99 },
  });
  expect(gtag.calls).toEqual([
    [
      "event",
      "view_item",
      {
        currency: "USD",
        value: 19.99,
        items: [{ item_id: "sku_1", item_name: "Classic Lash", price: 19.99, quantity: 1 }],
      },
    ],
  ]);
});

test("maps add_to_cart and begin_checkout without personal data", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const { analytics } = await loadAnalytics();

  analytics.addToCart("sku_2", "Volume Fan", 24.5, 3);
  analytics.checkoutInitiated(7350, 3);

  expect(customEvents.map((event) => event.detail.name)).toEqual([
    "add_to_cart",
    "checkout_initiated",
  ]);
  expect(gtag.calls[0]).toEqual([
    "event",
    "add_to_cart",
    {
      currency: "USD",
      value: 73.5,
      items: [{ item_id: "sku_2", item_name: "Volume Fan", price: 24.5, quantity: 3 }],
    },
  ]);
  expect(gtag.calls[1]).toEqual([
    "event",
    "begin_checkout",
    { currency: "USD", value: 73.5 },
  ]);
});

test("purchase uses a non-PII transaction id and omits order or customer ids", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const { analytics } = await loadAnalytics();

  analytics.purchaseComplete();

  expect(customEvents[0]?.detail).toEqual({ name: "purchase_complete", data: undefined });
  expect(gtag.calls).toHaveLength(1);
  expect(gtag.calls[0]?.[0]).toBe("event");
  expect(gtag.calls[0]?.[1]).toBe("purchase");
  const params = gtag.calls[0]?.[2] as Record<string, unknown>;
  expect(params.currency).toBe("USD");
  expect(typeof params.transaction_id).toBe("string");
  expect(String(params.transaction_id).length).toBeGreaterThan(0);
  expect(JSON.stringify(params)).not.toMatch(/email|phone|order|customer|cs_|ord_/i);
});

test("cart identity and variant events stay on CustomEvent only", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const { analytics } = await loadAnalytics();

  analytics.variantSelected("var_1", "0.07mm", 18);
  analytics.cartIdentitySubmitted();

  expect(customEvents.map((event) => event.detail.name)).toEqual([
    "variant_selected",
    "cart_identity_submitted",
  ]);
  expect(customEvents[1]?.detail.data).toBeUndefined();
  expect(gtag.calls).toEqual([]);
});

test("does nothing with gtag when the measurement id is unset", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
  const { customEvents, gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const { analytics } = await loadAnalytics();
  const ga = await loadGa();

  analytics.productViewed("sku_1", "Classic Lash", 19.99);

  expect(customEvents).toHaveLength(1);
  expect(gtag.calls).toEqual([]);
  expect(ga.isGaConfigured()).toBe(false);
  expect(ga.shouldLoadGaScript(true)).toBe(false);
  expect(ga.getGaScriptSrc()).toBeNull();
});

test("honors a migrated legacy consent key", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const storage = memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY_LEGACY]: "granted" });
  const { customEvents, gtag } = installAnalyticsWindow(storage);
  const { analytics } = await loadAnalytics();

  analytics.productViewed("sku_1", "Classic Lash", 19.99);

  expect(customEvents).toHaveLength(1);
  expect(gtag.calls).toHaveLength(1);
  expect(storage.data[ANALYTICS_CONSENT_STORAGE_KEY]).toBe("granted");
  expect(storage.data[ANALYTICS_CONSENT_STORAGE_KEY_LEGACY]).toBeUndefined();
});

test("stops sending after consent is withdrawn", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const storage = memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" });
  const { customEvents, gtag } = installAnalyticsWindow(storage);
  const { analytics } = await loadAnalytics();
  const ga = await loadGa();

  analytics.addToCart("sku_1", "Classic Lash", 19.99, 1);
  storage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
  ga.revokeGaConsent();
  analytics.addToCart("sku_1", "Classic Lash", 19.99, 1);
  analytics.purchaseComplete();

  expect(customEvents).toHaveLength(1);
  expect(gtag.calls.filter((call) => call[0] === "event")).toHaveLength(1);
  expect(gtag.calls).toContainEqual([
    "consent",
    "update",
    {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    },
  ]);
});

test("consent mode defaults are denied and do not load gtag.js", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const ga = await loadGa();
  const snippet = ga.getGaConsentDefaultScript(MEASUREMENT_ID);

  expect(snippet).toContain("gtag('consent','default'");
  expect(snippet).toContain('"ad_storage":"denied"');
  expect(snippet).toContain('"ad_user_data":"denied"');
  expect(snippet).toContain('"ad_personalization":"denied"');
  expect(snippet).toContain('"analytics_storage":"denied"');
  expect(snippet).not.toContain("googletagmanager.com");
  expect(snippet).toContain(`ga-disable-${MEASUREMENT_ID}`);
  expect(ga.shouldLoadGaScript(false)).toBe(false);
  expect(ga.shouldLoadGaScript(true)).toBe(true);
  expect(ga.getGaScriptSrc()).toBe(`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`);
});

test("strips personal data if it is passed through GA params", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", MEASUREMENT_ID);
  const { gtag } = installAnalyticsWindow(
    memoryStorage({ [ANALYTICS_CONSENT_STORAGE_KEY]: "granted" }),
  );
  const ga = await loadGa();

  ga.sendGaEvent("purchase", {
    email: "buyer@example.com",
    name: "Alex Buyer",
    phone: "555-0100",
    order_id: "ord_123",
    customerId: "cus_123",
    currency: "USD",
    items: [{ item_id: "sku_1", item_name: "Classic Lash", email: "hidden@example.com" }],
  });

  expect(gtag.calls).toEqual([
    [
      "event",
      "purchase",
      {
        currency: "USD",
        items: [{ item_id: "sku_1", item_name: "Classic Lash" }],
      },
    ],
  ]);
});

test("page view params omit query strings that could include session ids", async () => {
  const ga = await loadGa();
  expect(
    ga.buildPageViewParams("/checkout/success", "https://store.example.com", "Thank You"),
  ).toEqual({
    page_path: "/checkout/success",
    page_location: "https://store.example.com/checkout/success",
    page_title: "Thank You",
  });
});
