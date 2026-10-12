export const CONSENT_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

export const CONSENT_ANALYTICS_GRANTED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "granted",
} as const;

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __ccGaConsentDefaulted?: boolean;
  }
}

let gaConfigured = false;

export function getGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  if (!id || !MEASUREMENT_ID_PATTERN.test(id)) return null;
  return id;
}

export function isGaConfigured(): boolean {
  return getGaMeasurementId() !== null;
}

export function getGtagDisableKey(measurementId: string): string {
  return `ga-disable-${measurementId}`;
}

export function getGaScriptSrc(measurementId = getGaMeasurementId()): string | null {
  if (!measurementId) return null;
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
}

export function shouldLoadGaScript(consentGranted: boolean): boolean {
  return isGaConfigured() && consentGranted;
}

export function getGaConsentDefaultScript(measurementId: string): string {
  const denied = JSON.stringify(CONSENT_DENIED);
  return (
    `window.dataLayer=window.dataLayer||[];` +
    `function gtag(){dataLayer.push(arguments);}` +
    `gtag('consent','default',${denied});` +
    `window.__ccGaConsentDefaulted=true;` +
    `window[${JSON.stringify(getGtagDisableKey(measurementId))}]=true;`
  );
}

export function buildPageViewParams(
  pathname: string,
  origin: string,
  title: string,
): { page_path: string; page_location: string; page_title: string } {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return {
    page_path: path,
    page_location: `${origin}${path}`,
    page_title: title,
  };
}

function getWindowRecord(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  return window as unknown as Record<string, unknown>;
}

function setGaDisabled(disabled: boolean) {
  const id = getGaMeasurementId();
  const win = getWindowRecord();
  if (!id || !win) return;
  win[getGtagDisableKey(id)] = disabled;
}

export function isGaDisabled(): boolean {
  const id = getGaMeasurementId();
  const win = getWindowRecord();
  if (!id || !win) return true;
  return win[getGtagDisableKey(id)] === true;
}

export function ensureGtagStub() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag === "function") return;
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

export function applyConsentDefaults() {
  if (!isGaConfigured() || typeof window === "undefined") return;
  ensureGtagStub();
  if (window.__ccGaConsentDefaulted) return;
  window.gtag?.("consent", "default", { ...CONSENT_DENIED });
  window.__ccGaConsentDefaulted = true;
}

export function grantGaConsent() {
  if (!isGaConfigured() || typeof window === "undefined") return;
  ensureGtagStub();
  setGaDisabled(false);
  window.gtag?.("consent", "update", { ...CONSENT_ANALYTICS_GRANTED });
}

export function revokeGaConsent() {
  if (!isGaConfigured() || typeof window === "undefined") return;
  gaConfigured = false;
  setGaDisabled(true);
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", { ...CONSENT_DENIED });
  }
}

export function configureGaAfterLoad() {
  const id = getGaMeasurementId();
  if (!id || typeof window === "undefined") return;
  ensureGtagStub();
  setGaDisabled(false);
  window.gtag?.("consent", "update", { ...CONSENT_ANALYTICS_GRANTED });
  window.gtag?.("js", new Date());
  window.gtag?.("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  gaConfigured = true;
}

export function isGaReady(): boolean {
  return gaConfigured;
}

const FORBIDDEN_PARAM_KEY =
  /^(email|e[-_]?mail|phone|telephone|tel|name|full[-_]?name|first[-_]?name|last[-_]?name|customer[-_]?id|order[-_]?id|user[-_]?id)$/i;

export function sanitizeGaParams(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeGaParams(entry));
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_PARAM_KEY.test(key)) continue;
      output[key] = sanitizeGaParams(nested);
    }
    return output;
  }
  return value;
}

export function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (!isGaConfigured() || typeof window === "undefined") return;
  if (isGaDisabled()) return;
  if (typeof window.gtag !== "function") return;
  const sanitized =
    params === undefined ? undefined : (sanitizeGaParams(params) as Record<string, unknown>);
  window.gtag("event", name, sanitized);
}

export function sendGaPageView(pathname: string) {
  if (typeof window === "undefined") return;
  sendGaEvent("page_view", buildPageViewParams(pathname, window.location.origin, document.title));
}

export function resetGaForTests() {
  gaConfigured = false;
  if (typeof window === "undefined") return;
  window.__ccGaConsentDefaulted = false;
  window.dataLayer = [];
  delete window.gtag;
}

export function createAnonymousTransactionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t_${Math.random().toString(36).slice(2, 12)}`;
}
